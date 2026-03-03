const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.chatAssistant = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { message, history, context } = data;

      if (!message) {
        throw new HttpsError('invalid-argument', 'Message is required');
      }

      const model = getModel();
      if (!model) {
        throw new HttpsError('failed-precondition', 'Gemini API key not configured');
      }

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

      return { response };

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error in chat assistant:', error);
      throw new HttpsError('internal', error.message);
    }
  }
);
