const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.refreshGoogleToken = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    res.set(corsHeaders);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    await admin.auth().verifyIdToken(token);

    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const clientId = functions.config().google?.oauth_client_id || process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = functions.config().google?.oauth_client_secret || process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      res.status(500).json({ error: 'Google OAuth credentials not configured' });
      return;
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
      console.error('Google token refresh failed:', errorText);
      res.status(tokenResponse.status).json({ error: 'Failed to refresh token' });
      return;
    }

    const tokens = await tokenResponse.json();
    const expiresAt = Date.now() + (tokens.expires_in || 0) * 1000;

    res.status(200).json({
      access_token: tokens.access_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      expires_at: expiresAt
    });
  } catch (error) {
    console.error('refreshGoogleToken error:', error);
    res.status(500).json({ error: 'Failed to refresh Google token' });
  }
});
