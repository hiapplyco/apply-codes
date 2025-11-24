const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getSendGridClient } = require('./utils/sendgrid');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.sendEmail = functions
  .https.onCall(async (data, context) => {
    console.log('Send email function called');

    const {
      to,
      subject,
      body,
      htmlBody,
      recipientName,
      from,
      fromName,
      attachments,
      templateId,
      templateData,
      trackingOptions
    } = data;

    // Validate required fields
    if (!to || !subject) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Recipient email and subject are required'
      );
    }

    if (!body && !htmlBody && !templateId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email body, HTML body, or template ID is required'
      );
    }

    console.log(`Sending email to: ${to}`);

    try {
      // Send the email
      const emailResult = await sendEmailWithSendGrid({
        to,
        subject,
        body,
        htmlBody,
        recipientName,
        from,
        fromName,
        attachments,
        templateId,
        templateData,
        trackingOptions
      });

      // Log the email activity
      await logEmailActivity({
        to,
        subject,
        status: 'sent',
        context,
        templateId,
        trackingOptions
      });

      return {
        success: true,
        message: 'Email sent successfully',
        recipient: to,
        subject,
        messageId: emailResult.messageId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in send-email:', error);

      // Log the failed email attempt
      await logEmailActivity({
        to,
        subject,
        status: 'failed',
        error: error.message,
        context,
        templateId,
        trackingOptions
      });

      if (error.code) {
        // Already a Firebase HttpsError
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to send email',
        {
          error: error.message,
          recipient: to
        }
      );
    }
  });

async function sendEmailWithSendGrid({
  to,
  subject,
  body,
  htmlBody,
  recipientName,
  from,
  fromName,
  attachments,
  templateId,
  templateData,
  trackingOptions
}) {
  const sendgridClient = getSendGridClient({ required: true });

  // Default sender configuration
  const defaultFrom = {
    email: from || 'hello@hiapply.co',
    name: fromName || 'Apply Team'
  };

  let msg;

  if (templateId) {
    // Use SendGrid template
    msg = {
      to: {
        email: to,
        name: recipientName || undefined
      },
      from: defaultFrom,
      templateId: templateId,
      dynamicTemplateData: templateData || {}
    };
  } else {
    // Use custom content
    msg = {
      to: {
        email: to,
        name: recipientName || undefined
      },
      from: defaultFrom,
      subject: subject,
      content: []
    };

    // Add text content if provided
    if (body) {
      msg.content.push({
        type: 'text/plain',
        value: body
      });
    }

    // Add HTML content if provided, or convert text to HTML
    if (htmlBody) {
      msg.content.push({
        type: 'text/html',
        value: htmlBody
      });
    } else if (body) {
      msg.content.push({
        type: 'text/html',
        value: body.replace(/\n/g, '<br>')
      });
    }
  }

  // Add attachments if provided
  if (attachments && Array.isArray(attachments)) {
    msg.attachments = attachments.map(attachment => ({
      content: attachment.content, // Base64 encoded content
      filename: attachment.filename,
      type: attachment.type || 'application/octet-stream',
      disposition: attachment.disposition || 'attachment'
    }));
  }

  // Add tracking options
  if (trackingOptions) {
    msg.trackingSettings = {
      clickTracking: {
        enable: trackingOptions.clickTracking !== false
      },
      openTracking: {
        enable: trackingOptions.openTracking !== false
      },
      subscriptionTracking: {
        enable: trackingOptions.subscriptionTracking === true
      }
    };
  }

  try {
    const response = await sendgridClient.send(msg);
    console.log('Email sent successfully');

    return {
      success: true,
      messageId: response[0]?.headers?.['x-message-id'] || null
    };
  } catch (error) {
    console.error('SendGrid error:', error);

    if (error.response) {
      console.error('SendGrid response error:', error.response.body);
    }

    // Handle specific SendGrid errors
    if (error.code === 400) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid email request: ${error.message}`
      );
    } else if (error.code === 401) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'SendGrid authentication failed'
      );
    } else if (error.code === 403) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'SendGrid access forbidden'
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      `Failed to send email: ${error.message}`
    );
  }
}

async function logEmailActivity({
  to,
  subject,
  status,
  error,
  context,
  templateId,
  trackingOptions
}) {
  try {
    const db = admin.firestore();

    const logData = {
      recipient_email: to,
      subject: subject,
      status: status,
      template_id: templateId || null,
      tracking_enabled: trackingOptions ? {
        click: trackingOptions.clickTracking !== false,
        open: trackingOptions.openTracking !== false,
        subscription: trackingOptions.subscriptionTracking === true
      } : null,
      user_id: context?.auth?.uid || null,
      sent_at: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now()
    };

    if (error) {
      logData.error_message = error;
    }

    await db.collection('email_logs').add(logData);
    console.log('Email activity logged successfully');
  } catch (error) {
    console.error('Error logging email activity:', error);
    // Don't throw error to avoid failing the main operation
  }
}

// Helper function for bulk email sending
exports.sendBulkEmails = functions
  .https.onCall(async (data, context) => {
    console.log('Send bulk emails function called');

    const { emails, batchSize = 10 } = data;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Array of emails is required'
      );
    }

    console.log(`Sending ${emails.length} emails in batches of ${batchSize}`);

    const results = [];
    const errors = [];

    // Process emails in batches to avoid overwhelming SendGrid
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const batchPromises = batch.map(async (emailData, index) => {
        try {
          const result = await sendEmailWithSendGrid(emailData);
          return {
            index: i + index,
            recipient: emailData.to,
            success: true,
            messageId: result.messageId
          };
        } catch (error) {
          console.error(`Failed to send email to ${emailData.to}:`, error);
          return {
            index: i + index,
            recipient: emailData.to,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(result => {
        if (result.success) {
          results.push(result);
        } else {
          errors.push(result);
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log bulk email activity
    try {
      const db = admin.firestore();
      await db.collection('bulk_email_logs').add({
        total_emails: emails.length,
        successful_sends: results.length,
        failed_sends: errors.length,
        user_id: context?.auth?.uid || null,
        created_at: admin.firestore.Timestamp.now()
      });
    } catch (logError) {
      console.error('Error logging bulk email activity:', logError);
    }

    return {
      success: true,
      totalEmails: emails.length,
      successfulSends: results.length,
      failedSends: errors.length,
      results: results,
      errors: errors,
      timestamp: new Date().toISOString()
    };
  });

// Helper function for sending templated emails
exports.sendTemplatedEmail = functions
  .https.onCall(async (data, context) => {
    console.log('Send templated email function called');

    const {
      to,
      templateId,
      templateData,
      recipientName,
      from,
      fromName,
      trackingOptions
    } = data;

    if (!to || !templateId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Recipient email and template ID are required'
      );
    }

    try {
      const emailResult = await sendEmailWithSendGrid({
        to,
        recipientName,
        from,
        fromName,
        templateId,
        templateData: templateData || {},
        trackingOptions
      });

      await logEmailActivity({
        to,
        subject: `Template: ${templateId}`,
        status: 'sent',
        context,
        templateId,
        trackingOptions
      });

      return {
        success: true,
        message: 'Templated email sent successfully',
        recipient: to,
        templateId,
        messageId: emailResult.messageId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in send-templated-email:', error);

      await logEmailActivity({
        to,
        subject: `Template: ${templateId}`,
        status: 'failed',
        error: error.message,
        context,
        templateId,
        trackingOptions
      });

      if (error.code) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to send templated email',
        {
          error: error.message,
          recipient: to,
          templateId
        }
      );
    }
  });
