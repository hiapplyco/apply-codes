const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");

exports.initializeDailyBot = onCall({}, async (request) => {
  const { auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const websocketUrl = process.env.DAILY_BOT_WS_URL;
    if (!websocketUrl) {
      // Provide a placeholder so the caller can degrade gracefully
      return { websocket_url: 'wss://example.com/not-configured' };
    }

    return { websocket_url: websocketUrl };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('initializeDailyBot error:', error);
    throw new HttpsError('internal', 'Failed to initialize Daily bot');
  }
});
