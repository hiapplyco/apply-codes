const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");

exports.getGoogleCseKey = onCall({}, async (request) => {
  const { auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const engineId = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !engineId) {
      logger.error('Missing CSE config:', { hasApiKey: !!apiKey, hasEngineId: !!engineId });
      throw new HttpsError('unavailable', 'Google CSE configuration missing');
    }

    return {
      secret: apiKey,
      engineId
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('getGoogleCseKey error:', error);
    throw new HttpsError('internal', 'Failed to retrieve Google CSE configuration');
  }
});
