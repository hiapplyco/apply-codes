/**
 * Serper.dev API client for Google search results.
 * Replaces Google CSE API (sunsetting Jan 2027).
 *
 * Usage:
 *   const { executeSerperSearch } = require('./utils/serper');
 *   const results = await executeSerperSearch({ q: 'site:linkedin.com/in/ react developer', num: 10 });
 */

const { logger } = require("firebase-functions/v2");
const axios = require("axios");

const SERPER_API_URL = "https://google.serper.dev/search";
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503];

/**
 * Execute a search against the Serper.dev API.
 *
 * @param {object} query - Serper request body
 * @param {string} query.q - Search query string (include site: operator)
 * @param {string} [query.gl] - Country code (default: 'us')
 * @param {string} [query.location] - Location string for geo-targeting
 * @param {number} [query.num] - Results per page (default: 10, max: 100)
 * @param {number} [query.page] - Page number (default: 1)
 * @returns {Promise<{organic: object[], searchInformation: object, latencyMs: number}>}
 */
async function executeSerperSearch(query) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not configured");
  }

  const body = {
    q: query.q,
    gl: query.gl || "us",
    num: query.num || 10,
    page: query.page || 1,
    ...(query.location ? { location: query.location } : {}),
  };

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      logger.info(`[serper] Retry attempt ${attempt} for query: ${body.q.substring(0, 60)}...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }

    const start = Date.now();

    try {
      const response = await axios.post(SERPER_API_URL, body, {
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
      });

      const latencyMs = Date.now() - start;

      return {
        organic: response.data.organic || [],
        searchInformation: response.data.searchInformation || {},
        latencyMs,
      };
    } catch (error) {
      lastError = error;
      const status = error.response?.status;

      if (status && RETRYABLE_STATUS_CODES.includes(status) && attempt < MAX_RETRIES) {
        logger.warn(`[serper] Retryable error (${status}) for: ${body.q.substring(0, 60)}...`);
        continue;
      }

      logger.error("[serper] Search failed:", {
        status,
        message: error.response?.data?.message || error.message,
        query: body.q.substring(0, 100),
      });
      break;
    }
  }

  throw new Error(
    `Serper search failed: ${lastError?.response?.data?.message || lastError?.message || "Unknown error"}`
  );
}

module.exports = { executeSerperSearch };
