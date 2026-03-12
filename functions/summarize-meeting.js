/**
 * Server-side meeting transcript summarization.
 *
 * Replaces the insecure pattern of exposing the Gemini API key to the client
 * via getGeminiKey. Meeting summarization now happens server-side.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { generateContent } = require('./utils/gemini');

exports.summarizeMeeting = onCall(
  { secrets: ["GEMINI_API_KEY"], timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { transcript } = request.data;

    if (!transcript || typeof transcript !== 'string') {
      throw new HttpsError('invalid-argument', 'Transcript text is required');
    }

    if (transcript.length > 100000) {
      throw new HttpsError('invalid-argument', 'Transcript too long (max 100K chars)');
    }

    try {
      const prompt = `Please provide a concise summary of this meeting transcript, highlighting:
      - Key discussion points
      - Important decisions made
      - Action items or next steps
      - Overall meeting outcome

      Transcript: ${transcript}`;

      const { text } = await generateContent(prompt, {
        temperature: 0.3,
        maxOutputTokens: 2048,
      });

      return { summary: text };
    } catch (error) {
      logger.error('Error summarizing meeting:', error);
      throw new HttpsError('internal', 'Meeting summarization failed');
    }
  }
);
