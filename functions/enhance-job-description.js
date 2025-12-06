const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.enhanceJobDescription = onRequest(
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
      const { description, enhancementType } = req.body;

      if (!description) {
        res.status(400).json({ error: 'Job description is required' });
        return;
      }

      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      let prompt = '';
      if (enhancementType === 'clarity') {
        prompt = `Improve the clarity and readability of the following job description. Use bullet points where appropriate and ensure the tone is professional yet engaging.\n\n${description}`;
      } else if (enhancementType === 'bias-reduction') {
        prompt = `Review the following job description for potential bias (gender, age, etc.) and rewrite it to be more inclusive and neutral.\n\n${description}`;
      } else if (enhancementType === 'keywords') {
        prompt = `Optimize the following job description with relevant keywords for SEO and candidate searchability. Ensure the keywords are naturally integrated.\n\n${description}`;
      } else {
        prompt = `Enhance the following job description to make it more attractive to top talent. Focus on highlighting key benefits, culture, and impact.\n\n${description}`;
      }

      const result = await model.generateContent(prompt);
      const enhancedDescription = result.response.text();

      res.status(200).json({ enhancedDescription });

    } catch (error) {
      console.error('Error enhancing job description:', error);
      res.status(500).json({ error: error.message });
    }
  }
);