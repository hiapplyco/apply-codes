/**
 * Shared Gemini AI initialization utility.
 *
 * Lazy-init singleton following the sendgrid.js pattern.
 * Default model: gemini-3-pro-preview
 *
 * Usage:
 *   const { getModel, getJsonModel, generateContent } = require('./utils/gemini');
 *   const model = getModel();
 *   const result = await model.generateContent('Hello');
 */

const { logger } = require("firebase-functions/v2");
const { GoogleGenerativeAI } = require("@google/generative-ai");

let _genAI = null;
let _cachedKey = null;

const DEFAULT_MODEL = "gemini-3-pro-preview";

/**
 * Resolve the Gemini API key from environment variables.
 */
const resolveApiKey = () => {
  return process.env.GEMINI_API_KEY || null;
};

/**
 * Get or create the GoogleGenerativeAI singleton instance.
 */
const getGenAI = () => {
  const apiKey = resolveApiKey();

  if (_genAI && _cachedKey === apiKey) {
    return _genAI;
  }

  if (!apiKey) {
    logger.warn("[gemini] No GEMINI_API_KEY configured; skipping initialization.");
    _genAI = null;
    _cachedKey = null;
    return null;
  }

  _genAI = new GoogleGenerativeAI(apiKey);
  _cachedKey = apiKey;
  return _genAI;
};

/**
 * Get a Gemini GenerativeModel instance.
 *
 * @param {string} [modelName] - Model name (default: gemini-3-pro-preview)
 * @param {object} [generationConfig] - Optional generation config overrides
 * @returns {import('@google/generative-ai').GenerativeModel|null}
 */
const getModel = (modelName, generationConfig) => {
  const genAI = getGenAI();
  if (!genAI) return null;

  return genAI.getGenerativeModel({
    model: modelName || DEFAULT_MODEL,
    ...(generationConfig ? { generationConfig } : {}),
  });
};

/**
 * Get a Gemini model configured for JSON output.
 *
 * @param {string} [modelName] - Model name (default: gemini-3-pro-preview)
 * @param {object} [extraConfig] - Additional generation config
 * @returns {import('@google/generative-ai').GenerativeModel|null}
 */
const getJsonModel = (modelName, extraConfig) => {
  const genAI = getGenAI();
  if (!genAI) return null;

  return genAI.getGenerativeModel({
    model: modelName || DEFAULT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 4096,
      ...extraConfig,
    },
  });
};

/**
 * Generate content with sensible defaults.
 *
 * @param {string} prompt - The prompt text
 * @param {object} [options] - Options
 * @param {string} [options.model] - Model name override
 * @param {boolean} [options.json] - Request JSON output
 * @param {number} [options.temperature] - Temperature override
 * @param {number} [options.maxOutputTokens] - Max tokens override
 * @returns {Promise<{text: string, raw: object}>}
 */
const generateContent = async (prompt, options = {}) => {
  const { model: modelName, json = false, temperature, maxOutputTokens } = options;

  const generationConfig = {};
  if (json) generationConfig.responseMimeType = "application/json";
  if (temperature !== undefined) generationConfig.temperature = temperature;
  if (maxOutputTokens !== undefined) generationConfig.maxOutputTokens = maxOutputTokens;

  const model = json
    ? getJsonModel(modelName, generationConfig)
    : getModel(modelName, Object.keys(generationConfig).length ? generationConfig : undefined);

  if (!model) {
    throw new Error("Gemini API key is not configured. Set GEMINI_API_KEY environment variable.");
  }

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return { text, raw: result };
};

module.exports = {
  getModel,
  getJsonModel,
  generateContent,
  resolveApiKey,
  isConfigured: () => !!_genAI && !!_cachedKey,
};
