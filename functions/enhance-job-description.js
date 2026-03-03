const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.enhanceJobDescription = onCall(
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
      const { description, enhancementType } = data;

      if (!description) {
        throw new HttpsError('invalid-argument', 'Job description is required');
      }

      const model = getModel();
      if (!model) {
        throw new HttpsError('failed-precondition', 'Gemini API key not configured');
      }

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

      return { enhancedDescription };

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error enhancing job description:', error);
      throw new HttpsError('internal', error.message);
    }
  }
);
