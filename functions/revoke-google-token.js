const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");

exports.revokeGoogleToken = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { accessToken } = data || {};
    if (!accessToken) {
      throw new HttpsError('invalid-argument', 'Access token is required');
    }

    const params = new URLSearchParams();
    params.append('token', accessToken);

    const revokeResponse = await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!revokeResponse.ok) {
      const errorText = await revokeResponse.text();
      logger.error('Google token revoke failed:', errorText);
      throw new HttpsError('internal', 'Failed to revoke token');
    }

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('revokeGoogleToken error:', error);
    throw new HttpsError('internal', 'Failed to revoke Google token');
  }
});
