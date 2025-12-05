const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Get user's projects - REST API for Chrome Extension
 * Returns list of non-archived projects for the authenticated user
 */
exports.getProjects = onRequest({
  cors: true,
  maxInstances: 10,
  invoker: 'public',
}, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user with Firebase Auth
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      if (!decodedToken.uid) {
        res.status(401).json({ error: 'Unauthorized - Invalid token' });
        return;
      }
    } catch (authError) {
      console.error('Auth error:', authError);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
      return;
    }

    const userId = decodedToken.uid;

    // Fetch projects from Firestore
    const db = admin.firestore();
    const projectsSnapshot = await db.collection('projects')
      .where('user_id', '==', userId)
      .where('is_archived', '==', false)
      .orderBy('created_at', 'desc')
      .get();

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
      updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || doc.data().updated_at
    }));

    res.status(200).json({
      success: true,
      projects: projects
    });

  } catch (error) {
    console.error('Error in get-projects function:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});
