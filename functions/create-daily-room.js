const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.createDailyRoom = functions.https.onRequest(async (req, res) => {
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

    const apiKey = functions.config().daily?.api_key || process.env.DAILY_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Daily API key not configured' });
      return;
    }

    const {
      roomName,
      properties = {},
      expiresIn = 60 * 60, // 1 hour default
      startCloudRecording = false
    } = req.body || {};

    const payload = {
      name: roomName || undefined,
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        enable_knocking: true,
        exp: Math.floor(Date.now() / 1000) + expiresIn,
        start_cloud_recording: startCloudRecording,
        ...properties
      }
    };

    const dailyResponse = await axios.post(
      'https://api.daily.co/v1/rooms',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    res.status(200).json({
      success: true,
      room: dailyResponse.data
    });
  } catch (error) {
    console.error('createDailyRoom error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message || 'Failed to create Daily room'
    });
  }
});
