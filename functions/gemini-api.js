const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('firebase-functions/logger');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

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

exports.geminiApi = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: '1GiB',
    secrets: [geminiApiKey]
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    try {
      const { prompt, data, context } = req.body || {};

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ success: false, error: 'Prompt is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({ success: false, error: 'GEMINI_API_KEY is not configured' });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json'
        }
      });

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

      res.status(200).json({
        success: true,
        raw: rawText,
        data: json,
        message: json ? 'Parsed JSON response' : 'Returned raw text; JSON parsing failed'
      });
    } catch (error) {
      logger.error('Gemini API call failed', { error });
      res.status(500).json({
        success: false,
        error: error.message || 'Gemini API call failed'
      });
    }
  }
);
