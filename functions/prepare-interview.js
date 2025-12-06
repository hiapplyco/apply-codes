const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.prepareInterview = onRequest(
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
      const { jobDescription, candidateResume, interviewType } = req.body;

      if (!jobDescription || !candidateResume) {
        res.status(400).json({ error: 'Job description and candidate resume are required' });
        return;
      }

      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Prepare an interview guide based on the following:
      
      Job Description:
      ${jobDescription}
      
      Candidate Resume:
      ${candidateResume}
      
      Interview Type: ${interviewType || 'General'}
      
      Generate a JSON object with:
      1. "summary": Brief summary of the candidate's fit
      2. "strengths": Key strengths identified
      3. "weaknesses": Potential areas of concern
      4. "questions": List of specific interview questions to ask
      
      Return ONLY the JSON object.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Clean and parse JSON
      const cleanJson = response.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanJson);

      res.status(200).json(data);

    } catch (error) {
      console.error('Error preparing interview:', error);
      res.status(500).json({ error: error.message });
    }
  }
);