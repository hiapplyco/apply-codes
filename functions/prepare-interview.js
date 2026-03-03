const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.prepareInterview = onCall(
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
      const { jobDescription, candidateResume, interviewType } = data;

      if (!jobDescription || !candidateResume) {
        throw new HttpsError('invalid-argument', 'Job description and candidate resume are required');
      }

      const model = getModel();
      if (!model) {
        throw new HttpsError('unavailable', 'Gemini API key not configured');
      }

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
      const parsed = JSON.parse(cleanJson);

      return parsed;

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error preparing interview:', error);
      throw new HttpsError('internal', error.message);
    }
  }
);
