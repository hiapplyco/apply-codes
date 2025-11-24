const { onRequest } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('firebase-functions/logger');

exports.generateLinkedinAnalysis = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: '1GiB'
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { content } = req.body;

      if (!content) {
        res.status(400).json({ error: 'Content is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      const prompt = `Act as 5 experts + Devil's Advocate analyzing "${content}":

1. [MoE Phase]
- Technical Architect: "Core components/implementation challenges..."
- Industry Analyst: "Adoption trends/success-failure case studies..."
- Ethics Specialist: "Regulatory risks/ethical failure points..."
- Solutions Engineer: "Technical specifications/architecture..."
- UX Strategist: "User adoption barriers/engagement strategies..."

2. [Devil's Advocate Phase]
- Critic: "Fundamental flaws in these approaches... Overlooked threats..."

3. [CoT Resolution]
- Lead Architect: "Address criticisms through:\n- Flaw mitigation 1...\n- Threat workaround 2..."
- Final hybrid solution balancing innovation/safety

4. [Voice Synthesis]
- Tone Engineer: "Natural communication using:\n- Relatable analogies\n- Personal anecdotes\n- 'You've probably noticed...' phrasing\n- Humble expertise presentation"`;

      const result = await model.generateContent(prompt);
      const analysis = result.response.text();

      res.status(200).json({ analysis });

    } catch (error) {
      logger.error('Error in generate-linkedin-analysis:', error);
      res.status(500).json({ error: error.message });
    }
  }
);