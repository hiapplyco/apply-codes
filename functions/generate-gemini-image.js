/**
 * Server-side Gemini image generation.
 *
 * Replaces the insecure pattern of exposing the Gemini API key to the client
 * via getGeminiKey. All image generation now happens server-side.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.generateGeminiImage = onCall(
  { secrets: ["GEMINI_API_KEY"], timeoutSeconds: 120, memory: "1GiB" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { prompt, style = 'corporate', aspectRatio = '16:9' } = request.data;

    if (!prompt || typeof prompt !== 'string') {
      throw new HttpsError('invalid-argument', 'Prompt is required');
    }

    if (prompt.length > 2000) {
      throw new HttpsError('invalid-argument', 'Prompt too long (max 2000 chars)');
    }

    try {
      const model = getModel('gemini-2.5-flash-preview-05-20', {
        responseModalities: ['TEXT', 'IMAGE'],
      });

      if (!model) {
        throw new HttpsError('unavailable', 'Gemini API key not configured');
      }

      const enhancedPrompt = buildEnhancedPrompt(prompt, style, aspectRatio);
      const result = await model.generateContent(enhancedPrompt);
      const response = result.response;

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new HttpsError('internal', 'No candidates in Gemini response');
      }

      const parts = candidates[0].content?.parts;
      if (!parts || parts.length === 0) {
        throw new HttpsError('internal', 'No parts in Gemini response');
      }

      for (const part of parts) {
        if (part.inlineData) {
          const { data, mimeType } = part.inlineData;
          return {
            base64Data: data,
            mimeType: mimeType || 'image/png',
          };
        }
      }

      throw new HttpsError('internal', 'No image data found in response');
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error generating Gemini image:', error);
      throw new HttpsError('internal', 'Image generation failed');
    }
  }
);

function buildEnhancedPrompt(basePrompt, style, aspectRatio) {
  const styleGuides = {
    photorealistic: 'photorealistic, high-quality photography, natural lighting, professional',
    illustration: 'modern illustration style, clean lines, vibrant colors',
    corporate: 'professional corporate photography, clean modern office environment, warm lighting, diverse workplace',
    modern: 'modern minimalist design, clean aesthetic, professional',
  };

  const aspectGuides = {
    '16:9': 'landscape orientation, wide composition',
    '1:1': 'square composition',
    '9:16': 'portrait orientation, vertical composition',
    '4:3': 'classic landscape ratio',
    '3:4': 'classic portrait ratio',
  };

  return `${basePrompt}. Style: ${styleGuides[style] || styleGuides.corporate}. ${aspectGuides[aspectRatio] || ''} Do not include any text, words, or letters in the image.`;
}
