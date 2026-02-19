const { onRequest } = require('firebase-functions/v2/https');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');



const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.chatAssistant = onRequest(
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
      const { message, history, context } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

      // Construct chat history for Gemini
      const chatHistory = history ? history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })) : [];

      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const systemPrompt = `You are a helpful AI assistant for a recruitment platform. 
      Context: ${JSON.stringify(context || {})}
      
      Answer the user's questions and assist with recruitment tasks.`;

      const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${message}`);
      const response = result.response.text();

      res.status(200).json({ response });

    } catch (error) {
      console.error('Error in chat assistant:', error);
      res.status(500).json({ error: error.message });
    }
  }
);