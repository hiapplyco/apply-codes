/**
 * Firestore-based search result cache.
 * Reduces Serper.dev API usage by caching results for 24-72 hours.
 *
 * Usage:
 *   const { getCachedResults, setCachedResults, generateCacheKey } = require('./utils/search-cache');
 */

const { logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const crypto = require("crypto");

const CACHE_COLLECTION = "search_cache";
const DEFAULT_TTL_HOURS = 48;

/**
 * Generate a deterministic cache key from search parameters.
 *
 * @param {object} params
 * @param {string} params.keywords
 * @param {string[]} params.sources
 * @param {string} [params.location]
 * @param {string} [params.experienceLevel]
 * @param {number} [params.page]
 * @returns {string} SHA-256 hex hash
 */
function generateCacheKey(params) {
  const normalized = {
    keywords: (params.keywords || "").toLowerCase().trim(),
    sources: [...(params.sources || [])].sort(),
    location: (params.location || "").toLowerCase().trim(),
    experienceLevel: (params.experienceLevel || "").toLowerCase().trim(),
    page: params.page || 1,
  };
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

/**
 * Look up cached search results.
 *
 * @param {string} cacheKey
 * @returns {Promise<object|null>} Cached response data, or null if not found/expired
 */
async function getCachedResults(cacheKey) {
  try {
    const doc = await admin.firestore().collection(CACHE_COLLECTION).doc(cacheKey).get();

    if (!doc.exists) return null;

    const data = doc.data();
    const now = admin.firestore.Timestamp.now();

    if (data.expiresAt && data.expiresAt.toMillis() < now.toMillis()) {
      // Expired — delete asynchronously, return null
      doc.ref.delete().catch(() => {});
      return null;
    }

    // Increment hit count asynchronously
    doc.ref.update({ hitCount: admin.firestore.FieldValue.increment(1) }).catch(() => {});

    logger.info(`[search-cache] Cache HIT for key: ${cacheKey.substring(0, 12)}...`);
    return data.response;
  } catch (error) {
    logger.warn("[search-cache] Cache read error:", error.message);
    return null;
  }
}

/**
 * Store search results in cache.
 *
 * @param {string} cacheKey
 * @param {object} response - The full search response to cache
 * @param {number} [ttlHours] - Time-to-live in hours (default 48)
 */
async function setCachedResults(cacheKey, response, ttlHours = DEFAULT_TTL_HOURS) {
  try {
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + ttlHours * 60 * 60 * 1000
    );

    await admin.firestore().collection(CACHE_COLLECTION).doc(cacheKey).set({
      cacheKey,
      response,
      createdAt: now,
      expiresAt,
      hitCount: 0,
    });

    logger.info(`[search-cache] Cached results for key: ${cacheKey.substring(0, 12)}... (TTL: ${ttlHours}h)`);
  } catch (error) {
    logger.warn("[search-cache] Cache write error:", error.message);
  }
}

module.exports = { generateCacheKey, getCachedResults, setCachedResults };
