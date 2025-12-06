const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

exports.getGeminiKey = onRequest(
  {
    cors: true,
    secrets: [geminiApiKey]
  },
  async (req, res) => {
    // Set CORS headers
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Check authentication (basic check if auth header exists, ideally verify token)
    if (!req.headers.authorization) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      res.status(200).json({ key: apiKey });

    } catch (error) {
      console.error('Error retrieving Gemini key:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);
