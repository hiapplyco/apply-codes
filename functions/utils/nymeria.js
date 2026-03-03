/**
 * Shared Nymeria API client utility.
 *
 * Lazy-init singleton following the sendgrid.js pattern.
 * Provides searchPerson() and enrichPerson() methods.
 *
 * Usage:
 *   const { enrichPerson, searchPerson } = require('./utils/nymeria');
 *   const result = await enrichPerson({ profileUrl: 'https://linkedin.com/in/user' });
 */

const { logger } = require("firebase-functions/v2");
const axios = require("axios");

const BASE_URL = "https://www.nymeria.io/api/v4/person";
const TIMEOUT_MS = 30000;

let _cachedKey = null;
let _isConfigured = false;

/**
 * Resolve the Nymeria API key from environment variables.
 */
const resolveApiKey = () => {
  return process.env.NYMERIA_API_KEY || null;
};

/**
 * Get and validate the API key, caching result.
 * @param {object} [options]
 * @param {boolean} [options.required] - Throw if missing
 * @returns {string|null}
 */
const getApiKey = (options = {}) => {
  const apiKey = resolveApiKey();

  if (apiKey) {
    _cachedKey = apiKey;
    _isConfigured = true;
    return apiKey;
  }

  _cachedKey = null;
  _isConfigured = false;

  if (options.required) {
    throw new Error("NYMERIA_API_KEY is not configured. Set it in environment variables.");
  }

  logger.warn("[nymeria] No NYMERIA_API_KEY configured; skipping initialization.");
  return null;
};

/**
 * Handle Nymeria API error responses consistently.
 * @param {Error} error - Axios error
 * @param {string} operation - Description for logging
 * @returns {null} Returns null for 404, throws for other errors
 */
const handleApiError = (error, operation) => {
  if (error.response) {
    const { status, data } = error.response;

    if (status === 404) {
      logger.info(`[nymeria] ${operation}: profile not found (404)`);
      return null;
    }
    if (status === 401) {
      throw new Error("Invalid Nymeria API key. Check NYMERIA_API_KEY configuration.");
    }
    if (status === 402) {
      throw new Error("Nymeria API credits exhausted. Check your plan.");
    }
    if (status === 429) {
      throw new Error("Nymeria rate limit exceeded. Try again later.");
    }

    throw new Error(`Nymeria API error (${status}): ${JSON.stringify(data)}`);
  }

  if (error.code === "ECONNABORTED") {
    throw new Error("Nymeria API request timed out after 30 seconds.");
  }

  throw error;
};

/**
 * Enrich a person profile via Nymeria.
 *
 * @param {object} params
 * @param {string} [params.profileUrl] - LinkedIn profile URL
 * @param {string} [params.profileId] - LinkedIn profile ID (lid)
 * @param {string} [params.email] - Email address lookup
 * @returns {Promise<object|null>} Raw Nymeria response data, or null if not found
 */
const enrichPerson = async (params = {}) => {
  const apiKey = getApiKey({ required: true });
  const { profileUrl, profileId, email } = params;

  if (!profileUrl && !profileId && !email) {
    throw new Error("enrichPerson requires profileUrl, profileId, or email");
  }

  const queryParams = new URLSearchParams();
  if (profileUrl) queryParams.append("profile", profileUrl);
  else if (profileId) queryParams.append("lid", profileId);
  else if (email) queryParams.append("email", email);

  const url = `${BASE_URL}/enrich?${queryParams.toString()}`;
  logger.info("[nymeria] Enriching person", { hasProfile: !!profileUrl, hasId: !!profileId, hasEmail: !!email });

  try {
    const response = await axios.get(url, {
      headers: { "X-Api-Key": apiKey },
      timeout: TIMEOUT_MS,
    });

    return response.data?.data || response.data || null;
  } catch (error) {
    return handleApiError(error, "enrichPerson");
  }
};

/**
 * Search for people via Nymeria.
 * Valid keys: first_name, last_name, name, title, company, industry,
 * location, country, filter, require, limit, offset.
 * @param {object} searchParams - Search parameters (see valid keys above)
 * @returns {Promise<object>} Nymeria search results
 */
const searchPerson = async (searchParams = {}) => {
  const apiKey = getApiKey({ required: true });

  const validKeys = [
    "first_name", "last_name", "name", "title", "company",
    "industry", "location", "country", "filter", "require",
    "limit", "offset",
  ];

  const queryParams = new URLSearchParams();
  for (const key of validKeys) {
    if (searchParams[key] !== undefined && searchParams[key] !== null) {
      queryParams.append(key, String(searchParams[key]));
    }
  }

  if (!queryParams.has("limit")) {
    queryParams.append("limit", "10");
  }

  const url = `${BASE_URL}/search?${queryParams.toString()}`;
  logger.info("[nymeria] Searching people", { paramCount: queryParams.toString().split("&").length });

  try {
    const response = await axios.get(url, {
      headers: { "X-Api-Key": apiKey },
      timeout: TIMEOUT_MS,
    });

    return response.data;
  } catch (error) {
    return handleApiError(error, "searchPerson");
  }
};

module.exports = {
  enrichPerson,
  searchPerson,
  resolveApiKey,
  isConfigured: () => _isConfigured && !!_cachedKey,
};
