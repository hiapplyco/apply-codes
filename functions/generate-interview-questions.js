const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.generateInterviewQuestions = onRequest(
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
      const { jobDescription, candidateProfile, round, focusAreas } = req.body;

      if (!jobDescription) {
        res.status(400).json({ error: 'Job description is required' });
        return;
      }

      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Generate interview questions based on the following:
      
      Job Description:
      ${jobDescription}
      
      ${candidateProfile ? `Candidate Profile:\n${candidateProfile}\n` : ''}
      ${round ? `Interview Round: ${round}\n` : ''}
      ${focusAreas ? `Focus Areas: ${focusAreas.join(', ')}\n` : ''}
      
      Generate 5-7 relevant interview questions. For each question include:
      1. The question text
      2. What to look for in the answer (evaluation criteria)
      3. Difficulty level (Junior, Mid, Senior)
      
      Return the response as a JSON object with a "questions" array.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Clean and parse JSON
      const cleanJson = response.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanJson);

      res.status(200).json(data);

    } catch (error) {
      console.error('Error generating interview questions:', error);
      res.status(500).json({ error: error.message });
    }
  }
);