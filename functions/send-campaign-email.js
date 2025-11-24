const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSendGridClient } = require('./utils/sendgrid');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.sendCampaignEmail = functions.https.onCall(async (data, context) => {
    console.log('Send campaign email function called');

    const {
      campaignId,
      templateId,
      templateData,
      subscriberLists,
      segmentFilters,
      abTestConfig,
      scheduledSendTime,
      trackingOptions,
      unsubscribeUrl,
      fromEmail,
      fromName,
      subject,
      previewText
    } = data;

    // Validate required fields
    if (!campaignId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Campaign ID is required'
      );
    }

    if (!templateId && !subject) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Template ID or subject is required'
      );
    }

    if (!subscriberLists || !Array.isArray(subscriberLists) || subscriberLists.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'At least one subscriber list is required'
      );
    }

    console.log(`Processing campaign: ${campaignId}`);

    try {
      // Get campaign details from database
      const campaignData = await getCampaignDetails(campaignId);

      // Get subscribers based on lists and segmentation
      const subscribers = await getSubscribers(subscriberLists, segmentFilters);

      if (subscribers.length === 0) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'No subscribers found for the specified criteria'
        );
      }

      // Handle A/B testing if configured
      let emailVariants = [];
      if (abTestConfig && abTestConfig.enabled) {
        emailVariants = await setupABTest(subscribers, abTestConfig, templateData);
      } else {
        emailVariants = [{
          variant: 'main',
          subscribers: subscribers,
          templateData: templateData || {}
        }];
      }

      // Check if scheduled send or immediate
      if (scheduledSendTime && new Date(scheduledSendTime) > new Date()) {
        return await scheduleCompaignSend({
          campaignId,
          emailVariants,
          templateId,
          fromEmail,
          fromName,
          subject,
          previewText,
          trackingOptions,
          unsubscribeUrl,
          scheduledSendTime
        });
      }

      // Send campaign immediately
      const sendResults = await sendCampaignEmails({
        campaignId,
        emailVariants,
        templateId,
        fromEmail,
        fromName,
        subject,
        previewText,
        trackingOptions,
        unsubscribeUrl
      });

      // Log campaign completion
      await logCampaignActivity({
        campaignId,
        status: 'completed',
        totalRecipients: subscribers.length,
        successfulSends: sendResults.successful,
        failedSends: sendResults.failed,
        variants: emailVariants.length,
        context
      });

      return {
        success: true,
        campaignId,
        totalRecipients: subscribers.length,
        successfulSends: sendResults.successful,
        failedSends: sendResults.failed,
        variants: emailVariants.map(v => ({
          variant: v.variant,
          recipients: v.subscribers.length
        })),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in send-campaign-email:', error);

      // Log campaign failure
      await logCampaignActivity({
        campaignId,
        status: 'failed',
        error: error.message,
        context
      });

      if (error.code) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to send campaign',
        {
          error: error.message,
          campaignId
        }
      );
    }
  });

async function getCampaignDetails(campaignId) {
  try {
    const db = admin.firestore();
    const campaignDoc = await db.collection('email_campaigns').doc(campaignId).get();

    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Campaign not found'
      );
    }

    return campaignDoc.data();
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    throw error;
  }
}

async function getSubscribers(subscriberLists, segmentFilters) {
  try {
    const db = admin.firestore();
    let query = db.collection('email_subscribers');

    // Filter by subscriber lists
    if (subscriberLists && subscriberLists.length > 0) {
      query = query.where('lists', 'array-contains-any', subscriberLists);
    }

    // Apply segmentation filters
    if (segmentFilters) {
      if (segmentFilters.location) {
        query = query.where('location', '==', segmentFilters.location);
      }
      if (segmentFilters.industry) {
        query = query.where('industry', '==', segmentFilters.industry);
      }
      if (segmentFilters.experienceLevel) {
        query = query.where('experience_level', '==', segmentFilters.experienceLevel);
      }
      if (segmentFilters.lastActiveAfter) {
        query = query.where('last_active', '>=', admin.firestore.Timestamp.fromDate(new Date(segmentFilters.lastActiveAfter)));
      }
    }

    // Only get active subscribers
    query = query.where('status', '==', 'active');

    const snapshot = await query.get();
    const subscribers = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      subscribers.push({
        id: doc.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        fullName: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        location: data.location,
        industry: data.industry,
        experienceLevel: data.experience_level,
        preferences: data.preferences || {},
        customFields: data.custom_fields || {}
      });
    });

    console.log(`Found ${subscribers.length} subscribers`);
    return subscribers;
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    throw error;
  }
}

async function setupABTest(subscribers, abTestConfig, baseTemplateData) {
  const {
    splitPercentage = 50,
    variants,
    testMetric = 'open_rate'
  } = abTestConfig;

  if (!variants || variants.length < 2) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'A/B test requires at least 2 variants'
    );
  }

  // Shuffle subscribers for random distribution
  const shuffledSubscribers = [...subscribers].sort(() => Math.random() - 0.5);

  const splitPoint = Math.floor(shuffledSubscribers.length * (splitPercentage / 100));

  const emailVariants = variants.map((variant, index) => {
    let variantSubscribers;

    if (index === 0) {
      // Variant A gets the first portion
      variantSubscribers = shuffledSubscribers.slice(0, splitPoint);
    } else if (index === 1) {
      // Variant B gets the remainder
      variantSubscribers = shuffledSubscribers.slice(splitPoint);
    } else {
      // Additional variants (if any) get empty arrays for now
      variantSubscribers = [];
    }

    return {
      variant: variant.name || `variant_${index + 1}`,
      subscribers: variantSubscribers,
      templateData: {
        ...baseTemplateData,
        ...variant.templateData
      },
      subject: variant.subject,
      previewText: variant.previewText
    };
  });

  // Log A/B test setup
  const db = admin.firestore();
  await db.collection('ab_test_logs').add({
    test_type: 'email_campaign',
    test_metric: testMetric,
    variants: emailVariants.map(v => ({
      name: v.variant,
      recipients: v.subscribers.length
    })),
    created_at: admin.firestore.Timestamp.now()
  });

  console.log(`A/B test configured with ${emailVariants.length} variants`);
  return emailVariants;
}

async function scheduleCompaignSend(campaignData) {
  try {
    const db = admin.firestore();

    // Store scheduled campaign data
    await db.collection('scheduled_campaigns').add({
      ...campaignData,
      status: 'scheduled',
      created_at: admin.firestore.Timestamp.now(),
      scheduled_for: admin.firestore.Timestamp.fromDate(new Date(campaignData.scheduledSendTime))
    });

    return {
      success: true,
      message: 'Campaign scheduled successfully',
      campaignId: campaignData.campaignId,
      scheduledFor: campaignData.scheduledSendTime
    };
  } catch (error) {
    console.error('Error scheduling campaign:', error);
    throw error;
  }
}

async function sendCampaignEmails({
  campaignId,
  emailVariants,
  templateId,
  fromEmail,
  fromName,
  subject,
  previewText,
  trackingOptions,
  unsubscribeUrl
}) {
  const sendgridClient = getSendGridClient({ required: true });

  let totalSuccessful = 0;
  let totalFailed = 0;
  const batchSize = 100; // SendGrid batch limit

  for (const variant of emailVariants) {
    console.log(`Sending variant: ${variant.variant} to ${variant.subscribers.length} recipients`);

    // Process subscribers in batches
    for (let i = 0; i < variant.subscribers.length; i += batchSize) {
      const batch = variant.subscribers.slice(i, i + batchSize);

      try {
        const batchResult = await sendEmailBatch({
          subscribers: batch,
          templateId,
          templateData: variant.templateData,
          fromEmail: fromEmail || 'hello@hiapply.co',
          fromName: fromName || 'Apply Team',
          subject: variant.subject || subject,
          previewText: variant.previewText || previewText,
          trackingOptions,
          unsubscribeUrl,
          campaignId,
          variant: variant.variant,
          sendgridClient
        });

        totalSuccessful += batchResult.successful;
        totalFailed += batchResult.failed;

        // Add delay between batches to respect rate limits
        if (i + batchSize < variant.subscribers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error sending batch for variant ${variant.variant}:`, error);
        totalFailed += batch.length;
      }
    }
  }

  return {
    successful: totalSuccessful,
    failed: totalFailed
  };
}

async function sendEmailBatch({
  subscribers,
  templateId,
  templateData,
  fromEmail,
  fromName,
  subject,
  previewText,
  trackingOptions,
  unsubscribeUrl,
  campaignId,
  variant,
  sendgridClient
}) {
  if (!sendgridClient) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'SendGrid client is not configured'
    );
  }

  try {
    const personalizations = subscribers.map(subscriber => {
      const personalizedData = {
        ...templateData,
        first_name: subscriber.firstName,
        last_name: subscriber.lastName,
        full_name: subscriber.fullName,
        email: subscriber.email,
        unsubscribe_url: unsubscribeUrl || `https://hiapply.co/unsubscribe?email=${encodeURIComponent(subscriber.email)}&campaign=${campaignId}`,
        ...subscriber.customFields
      };

      return {
        to: [{
          email: subscriber.email,
          name: subscriber.fullName || subscriber.firstName || undefined
        }],
        dynamic_template_data: personalizedData
      };
    });

    const msg = {
      from: {
        email: fromEmail,
        name: fromName
      },
      personalizations: personalizations,
      tracking_settings: {
        click_tracking: {
          enable: trackingOptions?.clickTracking !== false
        },
        open_tracking: {
          enable: trackingOptions?.openTracking !== false
        },
        subscription_tracking: {
          enable: trackingOptions?.subscriptionTracking === true
        }
      },
      custom_args: {
        campaign_id: campaignId,
        variant: variant
      }
    };

    if (templateId) {
      msg.template_id = templateId;
    } else {
      msg.subject = subject;
      if (previewText) {
        msg.custom_args.preview_text = previewText;
      }
    }

    await sendgridClient.send(msg);

    // Log individual sends
    await logBatchSends(subscribers, campaignId, variant, 'sent');

    return {
      successful: subscribers.length,
      failed: 0
    };
  } catch (error) {
    console.error('SendGrid batch error:', error);

    // Log failed sends
    await logBatchSends(subscribers, campaignId, variant, 'failed', error.message);

    return {
      successful: 0,
      failed: subscribers.length
    };
  }
}

async function logBatchSends(subscribers, campaignId, variant, status, errorMessage = null) {
  try {
    const db = admin.firestore();
    const batch = db.batch();

    subscribers.forEach(subscriber => {
      const logRef = db.collection('campaign_send_logs').doc();
      batch.set(logRef, {
        campaign_id: campaignId,
        variant: variant,
        recipient_email: subscriber.email,
        recipient_id: subscriber.id,
        status: status,
        error_message: errorMessage,
        sent_at: admin.firestore.Timestamp.now()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error logging batch sends:', error);
    // Don't throw error to avoid failing the main operation
  }
}

async function logCampaignActivity({
  campaignId,
  status,
  totalRecipients,
  successfulSends,
  failedSends,
  variants,
  error,
  context
}) {
  try {
    const db = admin.firestore();

    const logData = {
      campaign_id: campaignId,
      status: status,
      total_recipients: totalRecipients || 0,
      successful_sends: successfulSends || 0,
      failed_sends: failedSends || 0,
      variant_count: variants || 1,
      user_id: context?.auth?.uid || null,
      created_at: admin.firestore.Timestamp.now()
    };

    if (error) {
      logData.error_message = error;
    }

    await db.collection('campaign_logs').add(logData);
    console.log('Campaign activity logged successfully');
  } catch (error) {
    console.error('Error logging campaign activity:', error);
    // Don't throw error to avoid failing the main operation
  }
}

// Helper function to manage subscriber lists
exports.manageSubscriberList = functions
  .https.onCall(async (data, context) => {
    console.log('Manage subscriber list function called');

    const { action, listId, listName, subscribers, segmentCriteria } = data;

    if (!action || !['create', 'update', 'delete', 'add_subscribers', 'remove_subscribers'].includes(action)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Valid action is required (create, update, delete, add_subscribers, remove_subscribers)'
      );
    }

    try {
      const db = admin.firestore();

      switch (action) {
        case 'create':
          if (!listName) {
            throw new functions.https.HttpsError('invalid-argument', 'List name is required');
          }

          const newListRef = await db.collection('subscriber_lists').add({
            name: listName,
            segment_criteria: segmentCriteria || {},
            subscriber_count: 0,
            created_by: context?.auth?.uid || null,
            created_at: admin.firestore.Timestamp.now(),
            updated_at: admin.firestore.Timestamp.now()
          });

          return {
            success: true,
            listId: newListRef.id,
            message: 'Subscriber list created successfully'
          };

        case 'update':
          if (!listId) {
            throw new functions.https.HttpsError('invalid-argument', 'List ID is required');
          }

          const updateData = {
            updated_at: admin.firestore.Timestamp.now()
          };

          if (listName) updateData.name = listName;
          if (segmentCriteria) updateData.segment_criteria = segmentCriteria;

          await db.collection('subscriber_lists').doc(listId).update(updateData);

          return {
            success: true,
            message: 'Subscriber list updated successfully'
          };

        case 'delete':
          if (!listId) {
            throw new functions.https.HttpsError('invalid-argument', 'List ID is required');
          }

          await db.collection('subscriber_lists').doc(listId).delete();

          return {
            success: true,
            message: 'Subscriber list deleted successfully'
          };

        case 'add_subscribers':
          if (!listId || !subscribers || !Array.isArray(subscribers)) {
            throw new functions.https.HttpsError('invalid-argument', 'List ID and subscribers array are required');
          }

          const addBatch = db.batch();

          subscribers.forEach(subscriber => {
            const subscriberRef = db.collection('email_subscribers').doc();
            addBatch.set(subscriberRef, {
              ...subscriber,
              lists: admin.firestore.FieldValue.arrayUnion(listId),
              status: 'active',
              created_at: admin.firestore.Timestamp.now(),
              updated_at: admin.firestore.Timestamp.now()
            });
          });

          await addBatch.commit();

          // Update subscriber count
          await db.collection('subscriber_lists').doc(listId).update({
            subscriber_count: admin.firestore.FieldValue.increment(subscribers.length),
            updated_at: admin.firestore.Timestamp.now()
          });

          return {
            success: true,
            message: `${subscribers.length} subscribers added to list successfully`
          };

        case 'remove_subscribers':
          if (!listId || !subscribers || !Array.isArray(subscribers)) {
            throw new functions.https.HttpsError('invalid-argument', 'List ID and subscriber emails array are required');
          }

          const removeBatch = db.batch();

          // Get subscribers to remove from list
          const subscribersQuery = await db.collection('email_subscribers')
            .where('email', 'in', subscribers)
            .where('lists', 'array-contains', listId)
            .get();

          subscribersQuery.forEach(doc => {
            removeBatch.update(doc.ref, {
              lists: admin.firestore.FieldValue.arrayRemove(listId),
              updated_at: admin.firestore.Timestamp.now()
            });
          });

          await removeBatch.commit();

          // Update subscriber count
          await db.collection('subscriber_lists').doc(listId).update({
            subscriber_count: admin.firestore.FieldValue.increment(-subscribersQuery.size),
            updated_at: admin.firestore.Timestamp.now()
          });

          return {
            success: true,
            message: `${subscribersQuery.size} subscribers removed from list successfully`
          };

        default:
          throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
      }
    } catch (error) {
      console.error('Error managing subscriber list:', error);

      if (error.code) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to manage subscriber list'
      );
    }
  });

// Helper function to handle unsubscribe requests
exports.handleUnsubscribe = functions
  .https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    try {
      const { email, campaignId, listId } = req.method === 'GET' ? req.query : req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email address is required'
        });
      }

      const db = admin.firestore();

      // Find subscriber
      const subscriberQuery = await db.collection('email_subscribers')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (subscriberQuery.empty) {
        return res.status(404).json({
          success: false,
          error: 'Subscriber not found'
        });
      }

      const subscriberDoc = subscriberQuery.docs[0];
      const subscriberData = subscriberDoc.data();

      if (listId) {
        // Unsubscribe from specific list
        await subscriberDoc.ref.update({
          lists: admin.firestore.FieldValue.arrayRemove(listId),
          updated_at: admin.firestore.Timestamp.now()
        });
      } else {
        // Unsubscribe from all
        await subscriberDoc.ref.update({
          status: 'unsubscribed',
          unsubscribed_at: admin.firestore.Timestamp.now(),
          updated_at: admin.firestore.Timestamp.now()
        });
      }

      // Log unsubscribe activity
      await db.collection('unsubscribe_logs').add({
        email: email,
        campaign_id: campaignId || null,
        list_id: listId || null,
        type: listId ? 'list_unsubscribe' : 'global_unsubscribe',
        created_at: admin.firestore.Timestamp.now()
      });

      res.json({
        success: true,
        message: listId ? 'Unsubscribed from list successfully' : 'Unsubscribed successfully'
      });

    } catch (error) {
      console.error('Error handling unsubscribe:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process unsubscribe request'
      });
    }
  });

// Function to get campaign analytics
exports.getCampaignAnalytics = functions
  .https.onCall(async (data, context) => {
    console.log('Get campaign analytics function called');

    const { campaignId, timeRange = '30d' } = data;

    if (!campaignId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Campaign ID is required'
      );
    }

    try {
      const db = admin.firestore();

      // Get campaign logs
      const campaignLogs = await db.collection('campaign_logs')
        .where('campaign_id', '==', campaignId)
        .orderBy('created_at', 'desc')
        .get();

      // Get send logs
      const sendLogs = await db.collection('campaign_send_logs')
        .where('campaign_id', '==', campaignId)
        .get();

      // Calculate analytics
      const analytics = {
        campaignId,
        totalSent: 0,
        successfulSends: 0,
        failedSends: 0,
        openRate: 0,
        clickRate: 0,
        unsubscribeRate: 0,
        variants: {},
        sendHistory: []
      };

      campaignLogs.forEach(doc => {
        const data = doc.data();
        analytics.sendHistory.push({
          timestamp: data.created_at.toDate(),
          status: data.status,
          recipients: data.total_recipients,
          successful: data.successful_sends,
          failed: data.failed_sends
        });
      });

      sendLogs.forEach(doc => {
        const data = doc.data();
        analytics.totalSent++;

        if (data.status === 'sent') {
          analytics.successfulSends++;
        } else {
          analytics.failedSends++;
        }

        // Track by variant
        if (!analytics.variants[data.variant]) {
          analytics.variants[data.variant] = {
            sent: 0,
            successful: 0,
            failed: 0
          };
        }

        analytics.variants[data.variant].sent++;
        if (data.status === 'sent') {
          analytics.variants[data.variant].successful++;
        } else {
          analytics.variants[data.variant].failed++;
        }
      });

      return analytics;

    } catch (error) {
      console.error('Error getting campaign analytics:', error);

      if (error.code) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to get campaign analytics'
      );
    }
  });
