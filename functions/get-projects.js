const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const admin = require('firebase-admin');

/**
 * Get user's projects - v2 onCall
 * Returns list of non-archived projects for the authenticated user
 */
exports.getProjects = onCall(
  {
    maxInstances: 10,
  },
  async (request) => {
    const { auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const userId = auth.uid;

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

      return {
        success: true,
        projects: projects
      };

    } catch (error) {
      logger.error('Error in get-projects function:', error);
      throw new HttpsError('internal', error.message || 'Internal Server Error');
    }
  }
);
