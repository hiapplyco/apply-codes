const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.generateInterviewQuestions = onCall(
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
      const { jobDescription, candidateProfile, round, focusAreas } = data;

      if (!jobDescription) {
        throw new HttpsError('invalid-argument', 'Job description is required');
      }

      const model = getModel();
      if (!model) {
        throw new HttpsError('failed-precondition', 'Gemini API key not configured');
      }

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
      const questions = JSON.parse(cleanJson);

      return questions;

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error generating interview questions:', error);
      throw new HttpsError('internal', error.message);
    }
  }
);
