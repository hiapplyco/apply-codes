const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");

exports.getGeminiKey = onCall({}, async (request) => {
  const { auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpsError('unavailable', 'Gemini API key not configured');
    }

    return { secret: apiKey };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('Error retrieving Gemini key:', error);
    throw new HttpsError('internal', 'Internal Server Error');
  }
});
