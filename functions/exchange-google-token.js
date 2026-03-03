const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");

exports.exchangeGoogleToken = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { code, redirectUri } = data || {};
    if (!code || !redirectUri) {
      throw new HttpsError('invalid-argument', 'Missing required parameters');
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new HttpsError('unavailable', 'Google OAuth credentials not configured');
    }

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error('Google token exchange failed:', errorText);
      throw new HttpsError('internal', 'Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    const expiresAt = Date.now() + (tokens.expires_in || 0) * 1000;

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      expires_at: expiresAt
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('exchangeGoogleToken error:', error);
    throw new HttpsError('internal', 'Failed to exchange Google token');
  }
});
