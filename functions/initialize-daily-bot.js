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

exports.initializeDailyBot = functions.https.onRequest(async (req, res) => {
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

    const websocketUrl = functions.config().daily?.bot_ws_url || process.env.DAILY_BOT_WS_URL;
    if (!websocketUrl) {
      // Provide a placeholder so the caller can degrade gracefully
      res.status(200).json({ websocket_url: 'wss://example.com/not-configured' });
      return;
    }

    res.status(200).json({ websocket_url: websocketUrl });
  } catch (error) {
    console.error('initializeDailyBot error:', error);
    res.status(500).json({ error: 'Failed to initialize Daily bot' });
  }
});
