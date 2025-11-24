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

exports.interviewGuidanceWs = functions.https.onRequest(async (req, res) => {
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

    const websocketUrl = functions.config().interview?.guidance_ws_url || process.env.INTERVIEW_GUIDANCE_WS_URL;
    if (!websocketUrl) {
      res.status(200).json({ websocket_url: 'wss://example.com/interview-guidance-not-configured' });
      return;
    }

    res.status(200).json({ websocket_url: websocketUrl });
  } catch (error) {
    console.error('interviewGuidanceWs error:', error);
    res.status(500).json({ error: 'Failed to initialize interview guidance' });
  }
});
