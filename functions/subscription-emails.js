const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getSendGridClient } = require('./utils/sendgrid');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Email templates for subscription events
const EMAIL_TEMPLATES = {
  trialExpiring: {
    subject: 'Your Apply trial expires in {days} day(s)',
    getHtml: ({ userName, daysRemaining, upgradeUrl }) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trial Expiring Soon</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; border: 2px solid #000; box-shadow: 8px 8px 0 #000;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: #f97316; padding: 16px; border-radius: 50%;">
                <img src="https://hiapply.co/clock-icon.png" alt="Clock" style="width: 32px; height: 32px;" />
              </div>
            </div>

            <h1 style="color: #1f2937; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 16px;">
              ${daysRemaining === 1 ? 'Last Day of Your Free Trial!' : `${daysRemaining} Days Left in Your Trial`}
            </h1>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
              Hi ${userName || 'there'},<br><br>
              Your Apply free trial ${daysRemaining === 1 ? 'ends tomorrow' : `expires in ${daysRemaining} days`}.
              Upgrade now to keep all your searches, candidates, and projects intact.
            </p>

            <div style="background: #f3e8ff; border: 2px solid #c4b5fd; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="color: #7c3aed; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">
                What you'll keep with Pro:
              </h3>
              <ul style="color: #6b21a8; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Unlimited AI-powered searches</li>
                <li>Unlimited candidate enrichment</li>
                <li>Advanced analytics & reports</li>
                <li>Up to 25 active projects</li>
                <li>Team collaboration (5 members)</li>
              </ul>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${upgradeUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; text-decoration: none; border: 2px solid #000; box-shadow: 4px 4px 0 #000;">
                Upgrade to Pro - $149/month
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Questions? Reply to this email or reach out to support@hiapply.co
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  trialExpired: {
    subject: 'Your Apply trial has ended',
    getHtml: ({ userName, upgradeUrl }) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trial Ended</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; border: 2px solid #000; box-shadow: 8px 8px 0 #000;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: #dc2626; padding: 16px; border-radius: 50%;">
                <img src="https://hiapply.co/alert-icon.png" alt="Alert" style="width: 32px; height: 32px;" />
              </div>
            </div>

            <h1 style="color: #1f2937; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 16px;">
              Your Free Trial Has Ended
            </h1>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
              Hi ${userName || 'there'},<br><br>
              Your Apply free trial has ended, but don't worry - all your data is safe!
              Upgrade to Pro to pick up right where you left off.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${upgradeUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; text-decoration: none; border: 2px solid #000; box-shadow: 4px 4px 0 #000;">
                Upgrade Now - $149/month
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 16px;">
              Or save 17% with annual billing: <strong>$1,788/year</strong>
            </p>

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Your data will be kept safe for 30 days after trial expiration.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  subscriptionCreated: {
    subject: 'Welcome to Apply Pro!',
    getHtml: ({ userName, tier }) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Apply Pro</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; border: 2px solid #000; box-shadow: 8px 8px 0 #000;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: #7c3aed; padding: 16px; border-radius: 50%;">
                <span style="font-size: 32px;">&#x1f451;</span>
              </div>
            </div>

            <h1 style="color: #1f2937; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 16px;">
              Welcome to Apply ${tier === 'enterprise' ? 'Enterprise' : 'Pro'}!
            </h1>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
              Hi ${userName || 'there'},<br><br>
              Thank you for upgrading! You now have access to all ${tier === 'enterprise' ? 'Enterprise' : 'Pro'} features.
            </p>

            <div style="background: #f3e8ff; border: 2px solid #c4b5fd; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="color: #7c3aed; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">
                Your new superpowers:
              </h3>
              <ul style="color: #6b21a8; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Unlimited AI-powered searches</li>
                <li>Unlimited candidate enrichment</li>
                <li>Advanced analytics & reports</li>
                <li>Up to ${tier === 'enterprise' ? 'unlimited' : '25'} active projects</li>
                <li>Team collaboration (${tier === 'enterprise' ? 'unlimited' : '5'} members)</li>
                ${tier === 'enterprise' ? '<li>Custom integrations & SSO</li>' : ''}
              </ul>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://hiapply.co/dashboard" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; text-decoration: none; border: 2px solid #000; box-shadow: 4px 4px 0 #000;">
                Start Recruiting
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Questions? We're here to help at support@hiapply.co
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  paymentFailed: {
    subject: 'Action required: Payment failed for your Apply subscription',
    getHtml: ({ userName, updatePaymentUrl }) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; border: 2px solid #dc2626; box-shadow: 8px 8px 0 #dc2626;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: #fee2e2; padding: 16px; border-radius: 50%;">
                <span style="font-size: 32px;">&#x26a0;&#xfe0f;</span>
              </div>
            </div>

            <h1 style="color: #dc2626; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 16px;">
              Payment Failed
            </h1>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
              Hi ${userName || 'there'},<br><br>
              We couldn't process your payment for Apply. Please update your payment method to keep your subscription active.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${updatePaymentUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; text-decoration: none; border: 2px solid #000; box-shadow: 4px 4px 0 #000;">
                Update Payment Method
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              If you have questions about this charge, please contact us at support@hiapply.co
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  subscriptionCanceled: {
    subject: "We're sad to see you go",
    getHtml: ({ userName, endDate, reactivateUrl }) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Canceled</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; border: 2px solid #000; box-shadow: 8px 8px 0 #000;">
            <h1 style="color: #1f2937; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 16px;">
              Your Subscription Has Been Canceled
            </h1>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
              Hi ${userName || 'there'},<br><br>
              We're sorry to see you go! Your Apply subscription has been canceled and will remain active until <strong>${endDate}</strong>.
            </p>

            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 24px;">
              You can reactivate anytime before this date to keep all your data and continue recruiting with Apply.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${reactivateUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; text-decoration: none; border: 2px solid #000; box-shadow: 4px 4px 0 #000;">
                Reactivate Subscription
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              We'd love to hear your feedback. Reply to this email to let us know how we can improve.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

// Helper function to send subscription emails
async function sendSubscriptionEmail(to, userName, templateName, templateData) {
  const sendgridClient = getSendGridClient({ required: true });
  const template = EMAIL_TEMPLATES[templateName];

  if (!template) {
    throw new Error(`Unknown email template: ${templateName}`);
  }

  const subject = template.subject.replace('{days}', templateData.daysRemaining || '');
  const htmlBody = template.getHtml({ userName, ...templateData });

  const msg = {
    to: { email: to },
    from: { email: 'hello@hiapply.co', name: 'Apply Team' },
    subject,
    content: [
      { type: 'text/html', value: htmlBody }
    ],
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true }
    }
  };

  try {
    await sendgridClient.send(msg);
    console.log(`Sent ${templateName} email to ${to}`);

    // Log the email
    await db.collection('subscription_email_logs').add({
      recipient_email: to,
      template_name: templateName,
      status: 'sent',
      sent_at: admin.firestore.Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error(`Failed to send ${templateName} email to ${to}:`, error);

    await db.collection('subscription_email_logs').add({
      recipient_email: to,
      template_name: templateName,
      status: 'failed',
      error_message: error.message,
      sent_at: admin.firestore.Timestamp.now()
    });

    throw error;
  }
}

// HTTP function to check for expiring trials and send reminder emails
// Can be triggered by Cloud Scheduler or called manually
// To set up Cloud Scheduler: gcloud scheduler jobs create http checkTrialExpirations --schedule="0 9 * * *" --uri="https://checktrialexpirations-aaesxdhooq-uc.a.run.app" --http-method=POST --oidc-service-account-email=applycodes-2683f@appspot.gserviceaccount.com
exports.checkTrialExpirations = functions.https.onRequest(async (req, res) => {
    console.log('Running trial expiration check...');

    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    try {
      // Find users with trials expiring in 3 days who haven't been notified
      const threeDaySnapshot = await db.collection('user_subscription_details')
        .where('status', '==', 'trialing')
        .where('trialEndDate', '>=', threeDaysFromNow.toISOString().split('T')[0])
        .where('trialEndDate', '<=', new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .get();

      // Find users with trials expiring tomorrow
      const oneDaySnapshot = await db.collection('user_subscription_details')
        .where('status', '==', 'trialing')
        .where('trialEndDate', '>=', oneDayFromNow.toISOString().split('T')[0])
        .where('trialEndDate', '<=', new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .get();

      // Find users with expired trials
      const expiredSnapshot = await db.collection('user_subscription_details')
        .where('status', '==', 'trialing')
        .where('trialEndDate', '<', now.toISOString())
        .get();

      const emailPromises = [];

      // Send 3-day warning emails
      for (const doc of threeDaySnapshot.docs) {
        const data = doc.data();
        const userId = data.userId;

        // Check if we already sent this notification
        const notificationKey = `trial_expiring_3d_${userId}`;
        const existingNotification = await db.collection('notification_sent').doc(notificationKey).get();

        if (!existingNotification.exists) {
          // Get user email from Firebase Auth
          try {
            const userRecord = await admin.auth().getUser(userId);
            if (userRecord.email) {
              emailPromises.push(
                sendSubscriptionEmail(
                  userRecord.email,
                  userRecord.displayName,
                  'trialExpiring',
                  {
                    daysRemaining: 3,
                    upgradeUrl: 'https://hiapply.co/pricing'
                  }
                ).then(() => {
                  // Mark notification as sent
                  return db.collection('notification_sent').doc(notificationKey).set({
                    sentAt: admin.firestore.Timestamp.now(),
                    userId
                  });
                })
              );
            }
          } catch (authError) {
            console.error(`Failed to get user ${userId}:`, authError);
          }
        }
      }

      // Send 1-day warning emails
      for (const doc of oneDaySnapshot.docs) {
        const data = doc.data();
        const userId = data.userId;

        const notificationKey = `trial_expiring_1d_${userId}`;
        const existingNotification = await db.collection('notification_sent').doc(notificationKey).get();

        if (!existingNotification.exists) {
          try {
            const userRecord = await admin.auth().getUser(userId);
            if (userRecord.email) {
              emailPromises.push(
                sendSubscriptionEmail(
                  userRecord.email,
                  userRecord.displayName,
                  'trialExpiring',
                  {
                    daysRemaining: 1,
                    upgradeUrl: 'https://hiapply.co/pricing'
                  }
                ).then(() => {
                  return db.collection('notification_sent').doc(notificationKey).set({
                    sentAt: admin.firestore.Timestamp.now(),
                    userId
                  });
                })
              );
            }
          } catch (authError) {
            console.error(`Failed to get user ${userId}:`, authError);
          }
        }
      }

      // Send trial expired emails and update status
      for (const doc of expiredSnapshot.docs) {
        const data = doc.data();
        const userId = data.userId;

        const notificationKey = `trial_expired_${userId}`;
        const existingNotification = await db.collection('notification_sent').doc(notificationKey).get();

        if (!existingNotification.exists) {
          // Update subscription status to expired
          await doc.ref.update({
            status: 'expired',
            updatedAt: admin.firestore.Timestamp.now()
          });

          try {
            const userRecord = await admin.auth().getUser(userId);
            if (userRecord.email) {
              emailPromises.push(
                sendSubscriptionEmail(
                  userRecord.email,
                  userRecord.displayName,
                  'trialExpired',
                  {
                    upgradeUrl: 'https://hiapply.co/pricing'
                  }
                ).then(() => {
                  return db.collection('notification_sent').doc(notificationKey).set({
                    sentAt: admin.firestore.Timestamp.now(),
                    userId
                  });
                })
              );
            }
          } catch (authError) {
            console.error(`Failed to get user ${userId}:`, authError);
          }
        }
      }

      await Promise.allSettled(emailPromises);

      const processedCount = threeDaySnapshot.size + oneDaySnapshot.size + expiredSnapshot.size;
      console.log(`Trial expiration check complete. Processed ${processedCount} users.`);

      res.status(200).json({
        success: true,
        message: `Trial expiration check complete. Processed ${processedCount} users.`,
        processed: {
          threeDayWarnings: threeDaySnapshot.size,
          oneDayWarnings: oneDaySnapshot.size,
          expired: expiredSnapshot.size
        }
      });

    } catch (error) {
      console.error('Error in trial expiration check:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

// Callable function to manually send subscription emails (for testing)
exports.sendSubscriptionNotification = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to send notifications'
    );
  }

  const { templateName, recipientEmail, recipientName, templateData } = data;

  if (!templateName || !recipientEmail) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Template name and recipient email are required'
    );
  }

  try {
    await sendSubscriptionEmail(recipientEmail, recipientName, templateName, templateData || {});

    return {
      success: true,
      message: `${templateName} email sent to ${recipientEmail}`
    };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      `Failed to send email: ${error.message}`
    );
  }
});

// Export sendSubscriptionEmail for use in stripe-webhook.js
exports.sendSubscriptionEmail = sendSubscriptionEmail;
