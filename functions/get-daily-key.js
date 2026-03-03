const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { generateMeetingToken } = require('./utils/daily');

exports.getDailyKey = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Daily API key not configured');
  }

  try {
    const { roomName, userName, expiresIn = 3600 } = data || {};

    if (!roomName) {
      throw new HttpsError('invalid-argument', 'Room name is required for token generation');
    }

    const token = await generateMeetingToken(apiKey, roomName, auth.uid, {
      userName,
      tokenExpiresIn: expiresIn,
    });

    return { token };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('getDailyKey error:', error.response?.data || error.message);
    throw new HttpsError('internal', 'Failed to generate meeting token');
  }
});
