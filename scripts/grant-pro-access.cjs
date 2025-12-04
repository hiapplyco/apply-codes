#!/usr/bin/env node
/**
 * Grant Pro Access Script
 *
 * Usage:
 *   node scripts/grant-pro-access.js <user_email_or_uid> [duration_days]
 *
 * Examples:
 *   node scripts/grant-pro-access.js john@example.com        # 1 year of Pro
 *   node scripts/grant-pro-access.js john@example.com 30     # 30 days of Pro
 *   node scripts/grant-pro-access.js abc123uid 365           # By UID, 1 year
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'applycodes-2683f',
  });
}

const db = admin.firestore();

async function grantProAccess(emailOrUid, durationDays = 365) {
  try {
    let userId = emailOrUid;
    let userEmail = null;

    // Check if input is an email (contains @)
    if (emailOrUid.includes('@')) {
      // Look up user by email
      try {
        const userRecord = await admin.auth().getUserByEmail(emailOrUid);
        userId = userRecord.uid;
        userEmail = userRecord.email;
        console.log(`Found user: ${userEmail} (${userId})`);
      } catch (error) {
        console.error(`User not found with email: ${emailOrUid}`);
        process.exit(1);
      }
    } else {
      // Assume it's a UID, try to get user info
      try {
        const userRecord = await admin.auth().getUser(emailOrUid);
        userEmail = userRecord.email;
        console.log(`Found user: ${userEmail} (${userId})`);
      } catch (error) {
        console.log(`Using UID directly: ${userId} (could not fetch user record)`);
      }
    }

    // Calculate subscription dates
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const subscriptionRef = db.collection('user_subscription_details').doc(userId);

    // Check if subscription doc exists
    const existingDoc = await subscriptionRef.get();

    const subscriptionData = {
      userId: userId,
      status: 'active',
      tier: 'pro',
      // Keep original trial dates if they exist
      trialStartDate: existingDoc.exists ? existingDoc.data().trialStartDate : now.toISOString(),
      trialEndDate: existingDoc.exists ? existingDoc.data().trialEndDate : now.toISOString(),
      // Set subscription period
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      canceledAt: null,
      cancelAtPeriodEnd: false,
      // Pro limits (essentially unlimited)
      searchesLimit: null,           // null = unlimited
      candidatesEnrichedLimit: null,
      aiCallsLimit: null,
      videoInterviewsLimit: null,
      projectsLimit: 25,
      teamMembersLimit: 5,
      // Reset counters if granting new access
      searchesCount: existingDoc.exists ? existingDoc.data().searchesCount || 0 : 0,
      candidatesEnrichedCount: existingDoc.exists ? existingDoc.data().candidatesEnrichedCount || 0 : 0,
      aiCallsCount: existingDoc.exists ? existingDoc.data().aiCallsCount || 0 : 0,
      videoInterviewsCount: existingDoc.exists ? existingDoc.data().videoInterviewsCount || 0 : 0,
      // Metadata
      grantedBy: 'admin_script',
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await subscriptionRef.set(subscriptionData, { merge: true });

    console.log('\n✅ Pro access granted successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`User:     ${userEmail || userId}`);
    console.log(`Tier:     Pro`);
    console.log(`Status:   Active`);
    console.log(`Duration: ${durationDays} days`);
    console.log(`Expires:  ${endDate.toLocaleDateString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('Error granting Pro access:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Grant Pro Access Script
━━━━━━━━━━━━━━━━━━━━━━━

Usage:
  node scripts/grant-pro-access.js <user_email_or_uid> [duration_days]

Examples:
  node scripts/grant-pro-access.js john@example.com        # 1 year of Pro
  node scripts/grant-pro-access.js john@example.com 30     # 30 days of Pro
  node scripts/grant-pro-access.js abc123uid 365           # By UID, 1 year
  `);
  process.exit(0);
}

const emailOrUid = args[0];
const durationDays = parseInt(args[1]) || 365;

grantProAccess(emailOrUid, durationDays).then(() => {
  process.exit(0);
});
