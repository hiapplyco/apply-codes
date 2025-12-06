const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.explainBoolean = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: '256MiB',
    secrets: [geminiApiKey]
  },
  async (req, res) => {
    // Set CORS headers
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { searchString } = req.body;

      if (!searchString) {
        res.status(400).json({ error: 'Search string is required' });
        return;
      }

      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Explain the following boolean search string in simple terms. Break down what it's looking for and what it's excluding.
      
      Search String:
      ${searchString}
      
      Return a JSON object with:
      1. "explanation": A simple paragraph explaining the search logic
      2. "breakdown": An array of objects, each with "segment" (part of the string) and "meaning" (what it does)
      3. "suggestions": An array of strings with suggestions to improve it (if any)
      
      Return ONLY the JSON object.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Clean and parse JSON
      const cleanJson = response.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanJson);

      res.status(200).json(data);

    } catch (error) {
      console.error('Error explaining boolean string:', error);
      res.status(500).json({ error: error.message });
    }
  }
);