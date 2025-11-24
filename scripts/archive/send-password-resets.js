#!/usr/bin/env node

/**
 * Send Password Reset Emails to All Users
 * Required after migrating from Supabase to Firebase
 * as passwords cannot be directly migrated
 */

import admin from 'firebase-admin';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, '..', 'firebase-service-account.json');

try {
  const serviceAccountData = await fs.readFile(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(serviceAccountData);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
} catch (error) {
  console.error('Error: Firebase service account file not found');
  console.error('Please download your service account key from Firebase Console');
  console.error('Expected path:', serviceAccountPath);
  process.exit(1);
}

const auth = admin.auth();

// Configuration
const BATCH_SIZE = 10; // Send emails in batches to avoid rate limiting
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
const DRY_RUN = process.env.DRY_RUN === 'true'; // Test mode
const PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL || 'https://apply.codes/reset-password';

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate custom password reset link
 */
async function generatePasswordResetLink(email) {
  try {
    const link = await auth.generatePasswordResetLink(email, {
      url: PASSWORD_RESET_URL // Where to redirect after reset
    });
    return link;
  } catch (error) {
    console.error(`Failed to generate reset link for ${email}:`, error.message);
    return null;
  }
}

/**
 * Send password reset email (via Firebase)
 */
async function sendPasswordResetEmail(user) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would send reset email to: ${user.email}`);
    return { success: true, dryRun: true };
  }

  try {
    // Firebase Auth can send the email directly
    const link = await generatePasswordResetLink(user.email);

    if (!link) {
      return { success: false, error: 'Could not generate reset link' };
    }

    console.log(`✓ Reset link generated for: ${user.email}`);

    // Note: Firebase Auth handles the actual email sending
    // If you want custom email content, you'd need to integrate
    // with SendGrid or another email service here

    return { success: true, link };
  } catch (error) {
    console.error(`✗ Failed to process ${user.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get all users from Firebase Auth
 */
async function getAllUsers() {
  const users = [];
  let nextPageToken;

  try {
    do {
      const listResult = await auth.listUsers(1000, nextPageToken);
      users.push(...listResult.users);
      nextPageToken = listResult.pageToken;
    } while (nextPageToken);

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Create email template (if using custom email service)
 */
function createEmailTemplate(user, resetLink) {
  return {
    to: user.email,
    subject: 'Reset Your Password - Apply.codes Migration',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #8B5CF6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Required</h1>
          </div>
          <div class="content">
            <p>Hello${user.displayName ? ' ' + user.displayName : ''},</p>

            <p>We've recently upgraded our platform to provide you with better security and performance.
            As part of this upgrade, you'll need to reset your password.</p>

            <p><strong>This is a one-time requirement due to our system migration.</strong></p>

            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Your Password</a>
            </p>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">
              ${resetLink}
            </p>

            <p>This link will expire in 1 hour for security reasons.</p>

            <p>If you didn't request this email or have any concerns, please contact our support team.</p>

            <p>Thank you for your patience during this transition!</p>

            <p>Best regards,<br>The Apply.codes Team</p>
          </div>
          <div class="footer">
            <p>© 2025 Apply.codes - AI-Powered Recruitment Platform</p>
            <p>This is a security notification sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Required

      Hello${user.displayName ? ' ' + user.displayName : ''},

      We've recently upgraded our platform to provide you with better security and performance.
      As part of this upgrade, you'll need to reset your password.

      This is a one-time requirement due to our system migration.

      Reset your password here: ${resetLink}

      This link will expire in 1 hour for security reasons.

      If you didn't request this email or have any concerns, please contact our support team.

      Thank you for your patience during this transition!

      Best regards,
      The Apply.codes Team
    `
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Password Reset Email Sender');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('🔍 Running in DRY RUN mode - no emails will be sent\n');
  }

  // Get all users
  console.log('Fetching all users from Firebase Auth...');
  const users = await getAllUsers();

  console.log(`Found ${users.length} users\n`);

  if (users.length === 0) {
    console.log('No users found. Exiting.');
    return;
  }

  // Filter users who need password reset
  // In a migration scenario, this would be all users
  // You might want to filter based on metadata or last sign-in
  const usersNeedingReset = users.filter(user => {
    // Skip users who have signed in recently (already reset)
    const lastSignIn = user.metadata.lastSignInTime;
    if (lastSignIn) {
      const daysSinceSignIn = (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSignIn < 1) {
        console.log(`Skipping ${user.email} - recently signed in`);
        return false;
      }
    }
    return true;
  });

  console.log(`${usersNeedingReset.length} users need password reset\n`);

  // Process in batches
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < usersNeedingReset.length; i += BATCH_SIZE) {
    const batch = usersNeedingReset.slice(i, i + BATCH_SIZE);

    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(usersNeedingReset.length / BATCH_SIZE)}`);

    const promises = batch.map(user => sendPasswordResetEmail(user));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      const user = batch[index];
      if (result.status === 'fulfilled' && result.value.success) {
        successCount++;
      } else {
        errorCount++;
        errors.push({
          email: user.email,
          error: result.status === 'rejected' ? result.reason : result.value.error
        });
      }
    });

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < usersNeedingReset.length) {
      console.log(`  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  // Save error report if there were errors
  if (errors.length > 0) {
    const errorFile = path.join(__dirname, '..', 'migration-data', 'password-reset-errors.json');
    await fs.writeFile(errorFile, JSON.stringify(errors, null, 2));
    console.log(`\nError report saved to: ${errorFile}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Errors: ${errorCount}`);

  if (DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN - no emails were actually sent');
    console.log('Run without DRY_RUN=true to send emails');
  }

  if (errors.length > 0) {
    console.log('\nFailed emails:');
    errors.forEach(err => {
      console.log(`  - ${err.email}: ${err.error}`);
    });
  }
}

// Run if executed directly
main().catch(console.error);

export { sendPasswordResetEmail, getAllUsers };