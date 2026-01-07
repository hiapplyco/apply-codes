const { onRequest } = require('firebase-functions/v2/https');

const { GoogleGenerativeAI } = require('@google/generative-ai');



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
      // Support both 'prompt' and 'userInput' field names for compatibility
      const {
        prompt,
        userInput,
        type,
        contentType,
        context,
        systemPrompt: clientSystemPrompt,
        contextContent,
        projectContext
      } = req.body;

      // Use prompt or userInput (client sends userInput, some components send prompt)
      const finalPrompt = prompt || userInput;

      if (!finalPrompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

      // Use client-provided systemPrompt if available, otherwise generate based on type
      let systemPrompt = '';
      if (clientSystemPrompt) {
        systemPrompt = clientSystemPrompt;
      } else {
        const effectiveType = type || contentType;
        if (effectiveType === 'email' || effectiveType === 'Cold Outreach Email') {
          systemPrompt = 'You are an expert copywriter specializing in professional emails.';
        } else if (effectiveType === 'job_description' || effectiveType === 'Job Description') {
          systemPrompt = 'You are an HR specialist skilled in writing compelling job descriptions.';
        } else {
          systemPrompt = 'You are a helpful AI assistant.';
        }
      }

      // Add context if provided
      if (context) {
        systemPrompt += `\nContext: ${JSON.stringify(context)}`;
      }
      if (contextContent) {
        systemPrompt += `\nAdditional Context: ${contextContent}`;
      }
      if (projectContext) {
        systemPrompt += `\nProject Context: ${projectContext}`;
      }

      const result = await model.generateContent(`${systemPrompt}\n\nTask: ${finalPrompt}`);
      const content = result.response.text();

      res.status(200).json({ content });

    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({ error: error.message });
    }
  }
);