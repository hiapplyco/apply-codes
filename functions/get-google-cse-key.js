const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { defineString } = require('firebase-functions/params');

// Define parameters that will be read from .env
const googleCseApiKey = defineString('GOOGLE_CSE_API_KEY');
const googleCseId = defineString('GOOGLE_CSE_ID');

if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.getGoogleCseKey = functions.https.onRequest(async (req, res) => {
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

    // Use params which read from .env file
    const apiKey = googleCseApiKey.value();
    const engineId = googleCseId.value();

    if (!apiKey || !engineId) {
      console.error('Missing CSE config:', { hasApiKey: !!apiKey, hasEngineId: !!engineId });
      res.status(500).json({ error: 'Google CSE configuration missing' });
      return;
    }

    res.status(200).json({
      secret: apiKey,
      engineId
    });
  } catch (error) {
    console.error('getGoogleCseKey error:', error);
    res.status(500).json({ error: 'Failed to retrieve Google CSE configuration' });
  }
});
