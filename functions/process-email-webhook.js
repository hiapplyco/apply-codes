const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.processEmailWebhook = functions
  .https.onRequest(async (req, res) => {
    console.log('Email webhook function called');

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Event-Webhook-Signature');
      res.status(200).send('');
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method);
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Verify webhook signature for security
      const isValidSignature = await verifyWebhookSignature(req);
      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        res.status(401).json({ error: 'Unauthorized: Invalid signature' });
        return;
      }

      // Parse webhook events from request body
      const events = req.body;

      if (!Array.isArray(events)) {
        console.error('Invalid webhook payload: expected array of events');
        res.status(400).json({ error: 'Invalid payload format' });
        return;
      }

      console.log(`Processing ${events.length} email events`);

      // Process each event
      for (const event of events) {
        await processEmailEvent(event);
      }

      // Return success response
      res.status(200).json({
        message: 'Webhook processed successfully',
        eventCount: events.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error processing email webhook:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

async function verifyWebhookSignature(req) {
  try {
    const signature = req.get('X-Event-Webhook-Signature');
    const timestamp = req.get('X-Event-Webhook-Timestamp');

    if (!signature || !timestamp) {
      console.warn('Missing webhook signature or timestamp');
      return false;
    }

    // Get webhook verification key from environment
    const webhookSecret = functions.config().sendgrid?.webhook_secret || process.env.SENDGRID_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('No webhook secret configured - skipping signature verification');
      return true; // Allow requests when no secret is configured (for development)
    }

    // Create the expected signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp + payload, 'utf8')
      .digest('base64');

    // Compare signatures
    const actualSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'base64'),
      Buffer.from(actualSignature, 'base64')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

async function processEmailEvent(event) {
  try {
    console.log(`Processing email event: ${event.event} for ${event.email}`);

    const eventData = {
      event_id: event.sg_event_id || generateEventId(),
      email: event.email,
      event_type: event.event,
      timestamp: new Date(event.timestamp * 1000),
      message_id: event.sg_message_id || null,
      smtp_id: event.smtp_id || null,
      user_agent: event.useragent || null,
      ip_address: event.ip || null,
      url: event.url || null,
      url_offset: event.url_offset || null,
      reason: event.reason || null,
      status: event.status || null,
      response: event.response || null,
      attempt: event.attempt || null,
      category: event.category || null,
      asm_group_id: event.asm_group_id || null,
      unique_arg_key: event.unique_arg_key || null,
      marketing_campaign_id: event.marketing_campaign_id || null,
      marketing_campaign_name: event.marketing_campaign_name || null,
      created_at: admin.firestore.Timestamp.now()
    };

    // Store event in Firestore
    const db = admin.firestore();
    await db.collection('email_events').add(eventData);

    // Process specific event types
    switch (event.event) {
      case 'delivered':
        await handleDeliveredEvent(event);
        break;
      case 'open':
        await handleOpenEvent(event);
        break;
      case 'click':
        await handleClickEvent(event);
        break;
      case 'bounce':
        await handleBounceEvent(event);
        break;
      case 'dropped':
        await handleDroppedEvent(event);
        break;
      case 'deferred':
        await handleDeferredEvent(event);
        break;
      case 'processed':
        await handleProcessedEvent(event);
        break;
      case 'spam_report':
        await handleSpamReportEvent(event);
        break;
      case 'unsubscribe':
        await handleUnsubscribeEvent(event);
        break;
      case 'group_unsubscribe':
        await handleGroupUnsubscribeEvent(event);
        break;
      case 'group_resubscribe':
        await handleGroupResubscribeEvent(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    console.log(`Successfully processed ${event.event} event for ${event.email}`);
  } catch (error) {
    console.error('Error processing email event:', error);
    throw error; // Re-throw to ensure webhook returns error status
  }
}

async function handleDeliveredEvent(event) {
  await updateEmailStatus(event.email, 'delivered', {
    delivered_at: new Date(event.timestamp * 1000),
    smtp_id: event.smtp_id
  });
}

async function handleOpenEvent(event) {
  await updateEmailStatus(event.email, 'opened', {
    opened_at: new Date(event.timestamp * 1000),
    user_agent: event.useragent,
    ip_address: event.ip
  });

  // Track analytics
  await updateEmailAnalytics(event.email, 'opens', 1);
}

async function handleClickEvent(event) {
  await updateEmailStatus(event.email, 'clicked', {
    clicked_at: new Date(event.timestamp * 1000),
    clicked_url: event.url,
    user_agent: event.useragent,
    ip_address: event.ip
  });

  // Track analytics
  await updateEmailAnalytics(event.email, 'clicks', 1);

  // Store click details
  const db = admin.firestore();
  await db.collection('email_clicks').add({
    email: event.email,
    url: event.url,
    url_offset: event.url_offset,
    user_agent: event.useragent,
    ip_address: event.ip,
    message_id: event.sg_message_id,
    timestamp: new Date(event.timestamp * 1000),
    created_at: admin.firestore.Timestamp.now()
  });
}

async function handleBounceEvent(event) {
  await updateEmailStatus(event.email, 'bounced', {
    bounced_at: new Date(event.timestamp * 1000),
    bounce_reason: event.reason,
    bounce_type: event.type || 'unknown',
    smtp_response: event.response
  });

  // Add to suppression list for hard bounces
  if (event.type === 'bounce') {
    await addToSuppressionList(event.email, 'bounce', event.reason);
  }

  // Track analytics
  await updateEmailAnalytics(event.email, 'bounces', 1);
}

async function handleDroppedEvent(event) {
  await updateEmailStatus(event.email, 'dropped', {
    dropped_at: new Date(event.timestamp * 1000),
    drop_reason: event.reason,
    smtp_response: event.response
  });

  // Track analytics
  await updateEmailAnalytics(event.email, 'drops', 1);
}

async function handleDeferredEvent(event) {
  await updateEmailStatus(event.email, 'deferred', {
    deferred_at: new Date(event.timestamp * 1000),
    defer_reason: event.response,
    attempt: event.attempt
  });
}

async function handleProcessedEvent(event) {
  await updateEmailStatus(event.email, 'processed', {
    processed_at: new Date(event.timestamp * 1000),
    smtp_id: event.smtp_id
  });
}

async function handleSpamReportEvent(event) {
  await updateEmailStatus(event.email, 'spam_reported', {
    spam_reported_at: new Date(event.timestamp * 1000)
  });

  // Add to suppression list
  await addToSuppressionList(event.email, 'spam', 'Marked as spam');

  // Track analytics
  await updateEmailAnalytics(event.email, 'spam_reports', 1);
}

async function handleUnsubscribeEvent(event) {
  await updateEmailStatus(event.email, 'unsubscribed', {
    unsubscribed_at: new Date(event.timestamp * 1000),
    asm_group_id: event.asm_group_id
  });

  // Add to suppression list
  await addToSuppressionList(event.email, 'unsubscribe', 'User unsubscribed');

  // Track analytics
  await updateEmailAnalytics(event.email, 'unsubscribes', 1);
}

async function handleGroupUnsubscribeEvent(event) {
  const db = admin.firestore();
  await db.collection('group_unsubscribes').add({
    email: event.email,
    asm_group_id: event.asm_group_id,
    user_agent: event.useragent,
    ip_address: event.ip,
    timestamp: new Date(event.timestamp * 1000),
    created_at: admin.firestore.Timestamp.now()
  });
}

async function handleGroupResubscribeEvent(event) {
  const db = admin.firestore();
  await db.collection('group_resubscribes').add({
    email: event.email,
    asm_group_id: event.asm_group_id,
    user_agent: event.useragent,
    ip_address: event.ip,
    timestamp: new Date(event.timestamp * 1000),
    created_at: admin.firestore.Timestamp.now()
  });
}

async function updateEmailStatus(email, status, additionalData = {}) {
  try {
    const db = admin.firestore();

    // Find the most recent email log for this email
    const emailLogsQuery = await db
      .collection('email_logs')
      .where('recipient_email', '==', email)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    if (!emailLogsQuery.empty) {
      const emailLogDoc = emailLogsQuery.docs[0];

      // Update the email log with the new status
      await emailLogDoc.ref.update({
        status: status,
        last_event_at: admin.firestore.Timestamp.now(),
        ...additionalData
      });
    }

    // Also check if there's a specific email status document
    const emailStatusQuery = await db
      .collection('email_status')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!emailStatusQuery.empty) {
      const emailStatusDoc = emailStatusQuery.docs[0];
      await emailStatusDoc.ref.update({
        status: status,
        updated_at: admin.firestore.Timestamp.now(),
        ...additionalData
      });
    } else {
      // Create new email status document
      await db.collection('email_status').add({
        email: email,
        status: status,
        created_at: admin.firestore.Timestamp.now(),
        updated_at: admin.firestore.Timestamp.now(),
        ...additionalData
      });
    }
  } catch (error) {
    console.error('Error updating email status:', error);
    // Don't throw error to avoid failing webhook processing
  }
}

async function updateEmailAnalytics(email, metric, value) {
  try {
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const analyticsDocRef = db.collection('email_analytics').doc(today);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(analyticsDocRef);

      if (doc.exists) {
        const data = doc.data();
        const currentValue = data[metric] || 0;
        transaction.update(analyticsDocRef, {
          [metric]: currentValue + value,
          updated_at: admin.firestore.Timestamp.now()
        });
      } else {
        transaction.set(analyticsDocRef, {
          date: today,
          [metric]: value,
          created_at: admin.firestore.Timestamp.now(),
          updated_at: admin.firestore.Timestamp.now()
        });
      }
    });
  } catch (error) {
    console.error('Error updating email analytics:', error);
    // Don't throw error to avoid failing webhook processing
  }
}

async function addToSuppressionList(email, reason, description) {
  try {
    const db = admin.firestore();

    // Check if email is already in suppression list
    const existingQuery = await db
      .collection('email_suppressions')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (existingQuery.empty) {
      await db.collection('email_suppressions').add({
        email: email,
        reason: reason,
        description: description,
        suppressed_at: admin.firestore.Timestamp.now(),
        created_at: admin.firestore.Timestamp.now()
      });

      console.log(`Added ${email} to suppression list for: ${reason}`);
    } else {
      console.log(`Email ${email} already in suppression list`);
    }
  } catch (error) {
    console.error('Error adding to suppression list:', error);
    // Don't throw error to avoid failing webhook processing
  }
}

function generateEventId() {
  return crypto.randomBytes(16).toString('hex');
}

// Helper function to get email events for a specific email address
exports.getEmailEvents = functions
  .https.onCall(async (data, context) => {
    const { email, limit = 50 } = data;

    if (!email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email address is required'
      );
    }

    try {
      const db = admin.firestore();
      const eventsQuery = await db
        .collection('email_events')
        .where('email', '==', email)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const events = eventsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }));

      return {
        email: email,
        events: events,
        count: events.length
      };
    } catch (error) {
      console.error('Error fetching email events:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// Helper function to get email analytics for a date range
exports.getEmailAnalytics = functions
  .https.onCall(async (data, context) => {
    const { startDate, endDate } = data;

    if (!startDate || !endDate) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Start date and end date are required'
      );
    }

    try {
      const db = admin.firestore();
      const analyticsQuery = await db
        .collection('email_analytics')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'asc')
        .get();

      const analytics = analyticsQuery.docs.map(doc => ({
        date: doc.id,
        ...doc.data()
      }));

      return {
        dateRange: { startDate, endDate },
        analytics: analytics
      };
    } catch (error) {
      console.error('Error fetching email analytics:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });