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

exports.exchangeGoogleToken = functions.https.onRequest(async (req, res) => {
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

    const { code, redirectUri } = req.body || {};
    if (!code || !redirectUri) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    const clientId = functions.config().google?.oauth_client_id || process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = functions.config().google?.oauth_client_secret || process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      res.status(500).json({ error: 'Google OAuth credentials not configured' });
      return;
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
      console.error('Google token exchange failed:', errorText);
      res.status(tokenResponse.status).json({ error: 'Failed to exchange authorization code' });
      return;
    }

    const tokens = await tokenResponse.json();
    const expiresAt = Date.now() + (tokens.expires_in || 0) * 1000;

    res.status(200).json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      expires_at: expiresAt
    });
  } catch (error) {
    console.error('exchangeGoogleToken error:', error);
    res.status(500).json({ error: 'Failed to exchange Google token' });
  }
});
