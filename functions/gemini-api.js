const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getJsonModel } = require('./utils/gemini');

const buildPrompt = ({ prompt, data, context = {} }) => {
  let composed = `${prompt}\n\n`;

  if (data) {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    composed += `## ADDITIONAL DATA\n${serialized}\n\n`;
  }

  composed += `## INSTRUCTIONS\nYou are a structured reasoning assistant. Always respond with valid JSON only. Do not include any prose outside of the JSON object.`;

  if (context.agentType || context.taskId) {
    composed += `\n\n## CONTEXT\n${JSON.stringify(context, null, 2)}`;
  }

  composed += `\n\n## RESPONSE FORMAT\nReturn a JSON object. Prefer camelCase keys. Include all relevant insights in nested objects or arrays as appropriate.`;

  return composed;
};

const extractJson = (text) => {
  if (!text) return null;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.warn('Failed to parse Gemini JSON response', { error });
    return null;
  }
};

exports.geminiApi = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
  },
  async (request) => {
    const { data: requestData, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { prompt, data, context } = requestData || {};

      if (!prompt || typeof prompt !== 'string') {
        throw new HttpsError('invalid-argument', 'Prompt is required');
      }

      const model = getJsonModel();

      if (!model) {
        throw new HttpsError('unavailable', 'GEMINI_API_KEY is not configured');
      }

      const composedPrompt = buildPrompt({ prompt, data, context });
      logger.info('Invoking Gemini API', {
        promptLength: composedPrompt.length,
        hasData: !!data,
        agentType: context?.agentType,
        taskId: context?.taskId
      });

      const result = await model.generateContent([
        {
          text: composedPrompt
        }
      ]);

      const rawText = result?.response?.text?.() || '';
      const json = extractJson(rawText);

      return {
        success: true,
        raw: rawText,
        data: json,
        message: json ? 'Parsed JSON response' : 'Returned raw text; JSON parsing failed'
      };
    } catch (error) {
      logger.error('Gemini API call failed', { error });
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', error.message || 'Gemini API call failed');
    }
  }
);
