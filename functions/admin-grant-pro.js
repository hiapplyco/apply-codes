const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Admin function to grant Pro access to a user
 *
 * Call via: firebase functions:call adminGrantPro --data '{"email":"user@example.com","days":365}'
 * Or via HTTP POST with admin auth
 */
exports.adminGrantPro = functions.https.onCall(async (data, context) => {
  // Check if caller is admin (you can customize this check)
  // For now, we'll use a simple admin email list
  const adminEmails = [
    'james@hiapply.co',
    'jamesschlauch@gmail.com',
    'james@hiapply.com'
  ];

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Get caller's email
  const callerEmail = context.auth.token.email;
  if (!adminEmails.includes(callerEmail)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can grant Pro access');
  }

  const { email, uid, days = 365 } = data;

  if (!email && !uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Must provide email or uid');
  }

  try {
    let userId = uid;
    let userEmail = email;

    // Look up user by email if provided
    if (email && !uid) {
      const userRecord = await admin.auth().getUserByEmail(email);
      userId = userRecord.uid;
      userEmail = userRecord.email;
    }

    // Calculate subscription dates
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const subscriptionRef = db.collection('user_subscription_details').doc(userId);
    const existingDoc = await subscriptionRef.get();

    const subscriptionData = {
      userId: userId,
      status: 'active',
      tier: 'pro',
      trialStartDate: existingDoc.exists ? existingDoc.data().trialStartDate : now.toISOString(),
      trialEndDate: existingDoc.exists ? existingDoc.data().trialEndDate : now.toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      canceledAt: null,
      cancelAtPeriodEnd: false,
      searchesLimit: null,
      candidatesEnrichedLimit: null,
      aiCallsLimit: null,
      videoInterviewsLimit: null,
      projectsLimit: 25,
      teamMembersLimit: 5,
      searchesCount: existingDoc.exists ? existingDoc.data().searchesCount || 0 : 0,
      candidatesEnrichedCount: existingDoc.exists ? existingDoc.data().candidatesEnrichedCount || 0 : 0,
      aiCallsCount: existingDoc.exists ? existingDoc.data().aiCallsCount || 0 : 0,
      videoInterviewsCount: existingDoc.exists ? existingDoc.data().videoInterviewsCount || 0 : 0,
      grantedBy: callerEmail,
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await subscriptionRef.set(subscriptionData, { merge: true });

    return {
      success: true,
      message: `Pro access granted to ${userEmail || userId}`,
      userId,
      email: userEmail,
      tier: 'pro',
      status: 'active',
      expiresAt: endDate.toISOString(),
      days
    };

  } catch (error) {
    console.error('Error granting Pro access:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * HTTP endpoint version (for quick admin access)
 * Protected by a simple secret key
 */
exports.grantProAccess = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'content-type, x-admin-key');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Simple admin key protection (set this in Firebase config)
  const adminKey = process.env.ADMIN_SECRET_KEY || 'apply-admin-2024';
  const providedKey = req.headers['x-admin-key'] || req.body?.adminKey;

  if (providedKey !== adminKey) {
    res.status(401).json({ error: 'Invalid admin key' });
    return;
  }

  const { email, uid, days = 365 } = req.body;

  if (!email && !uid) {
    res.status(400).json({ error: 'Must provide email or uid' });
    return;
  }

  try {
    let userId = uid;
    let userEmail = email;

    if (email && !uid) {
      const userRecord = await admin.auth().getUserByEmail(email);
      userId = userRecord.uid;
      userEmail = userRecord.email;
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const subscriptionRef = db.collection('user_subscription_details').doc(userId);
    const existingDoc = await subscriptionRef.get();

    const subscriptionData = {
      userId: userId,
      status: 'active',
      tier: 'pro',
      trialStartDate: existingDoc.exists ? existingDoc.data().trialStartDate : now.toISOString(),
      trialEndDate: existingDoc.exists ? existingDoc.data().trialEndDate : now.toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      canceledAt: null,
      cancelAtPeriodEnd: false,
      searchesLimit: null,
      candidatesEnrichedLimit: null,
      aiCallsLimit: null,
      videoInterviewsLimit: null,
      projectsLimit: 25,
      teamMembersLimit: 5,
      grantedBy: 'admin_api',
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await subscriptionRef.set(subscriptionData, { merge: true });

    res.json({
      success: true,
      message: `Pro access granted to ${userEmail || userId}`,
      userId,
      email: userEmail,
      tier: 'pro',
      status: 'active',
      expiresAt: endDate.toISOString(),
      days
    });

  } catch (error) {
    console.error('Error granting Pro access:', error);
    res.status(500).json({ error: error.message });
  }
});
