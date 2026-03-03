const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");

exports.getDailyKey = onCall({}, async (request) => {
  const { auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      throw new HttpsError('unavailable', 'Daily API key not configured');
    }

    return { secret: apiKey };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('getDailyKey error:', error);
    throw new HttpsError('internal', 'Failed to retrieve Daily key');
  }
});
