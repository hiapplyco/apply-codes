const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.explainBoolean = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { searchString } = data;

      if (!searchString) {
        throw new HttpsError('invalid-argument', 'Search string is required');
      }

      const model = getModel();

      if (!model) {
        throw new HttpsError('unavailable', 'Gemini API key not configured');
      }

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
      const parsed = JSON.parse(cleanJson);

      return parsed;

    } catch (error) {
      logger.error('Error explaining boolean string:', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', error.message || 'Failed to explain boolean string');
    }
  }
);