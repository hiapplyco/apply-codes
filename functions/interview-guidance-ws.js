const functions = require('firebase-functions');
const { logger } = require("firebase-functions/v2");
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const { getCorsHeaders } = require('./utils/auth-cors');

exports.interviewGuidanceWs = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set(getCorsHeaders(req.headers.origin));
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    res.set(getCorsHeaders(req.headers.origin));

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    await admin.auth().verifyIdToken(token);

    const websocketUrl = process.env.INTERVIEW_GUIDANCE_WS_URL;
    if (!websocketUrl) {
      res.status(200).json({ websocket_url: 'wss://example.com/interview-guidance-not-configured' });
      return;
    }

    res.status(200).json({ websocket_url: websocketUrl });
  } catch (error) {
    logger.error('interviewGuidanceWs error:', error);
    res.status(500).json({ error: 'Failed to initialize interview guidance' });
  }
});
