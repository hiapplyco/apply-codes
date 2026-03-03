const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");

exports.refreshGoogleToken = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { refreshToken } = data || {};
    if (!refreshToken) {
      throw new HttpsError('invalid-argument', 'Refresh token is required');
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new HttpsError('unavailable', 'Google OAuth credentials not configured');
    }

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error('Google token refresh failed:', errorText);
      throw new HttpsError('internal', 'Failed to refresh token');
    }

    const tokens = await tokenResponse.json();
    const expiresAt = Date.now() + (tokens.expires_in || 0) * 1000;

    return {
      access_token: tokens.access_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      expires_at: expiresAt
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('refreshGoogleToken error:', error);
    throw new HttpsError('internal', 'Failed to refresh Google token');
  }
});
