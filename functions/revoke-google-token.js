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

exports.revokeGoogleToken = functions.https.onRequest(async (req, res) => {
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

    const { accessToken } = req.body || {};
    if (!accessToken) {
      res.status(400).json({ error: 'Access token is required' });
      return;
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
      console.error('Google token revoke failed:', errorText);
      res.status(revokeResponse.status).json({ error: 'Failed to revoke token' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('revokeGoogleToken error:', error);
    res.status(500).json({ error: 'Failed to revoke Google token' });
  }
});
