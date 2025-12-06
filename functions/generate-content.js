const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.generateContent = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: '1GiB',
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
      const { prompt, type, context } = req.body;

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      let systemPrompt = '';
      if (type === 'email') {
        systemPrompt = 'You are an expert copywriter specializing in professional emails.';
      } else if (type === 'job_description') {
        systemPrompt = 'You are an HR specialist skilled in writing compelling job descriptions.';
      } else {
        systemPrompt = 'You are a helpful AI assistant.';
      }

      if (context) {
        systemPrompt += `\nContext: ${JSON.stringify(context)}`;
      }

      const result = await model.generateContent(`${systemPrompt}\n\nTask: ${prompt}`);
      const content = result.response.text();

      res.status(200).json({ content });

    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({ error: error.message });
    }
  }
);