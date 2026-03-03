/**
 * Shared Enrichment Service — waterfall with cache.
 *
 * Enforces: Nymeria -> Hunter.io -> PDL (first success wins).
 * Cache-first: checks enrichment_cache Firestore collection (30-day TTL).
 * Logs all attempts to enrichment_logs collection.
 *
 * Usage:
 *   const { enrichContact } = require('./utils/enrichment-service');
 *   const result = await enrichContact({ profileUrl: '...' }, { userId: uid });
 */

const { logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const axios = require("axios");
const { enrichPerson: nymeriaEnrich } = require("./nymeria");

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const TIMEOUT_MS = 30000;

/** Look up cached enrichment data (30-day TTL). */
const checkCache = async (cacheKey) => {
  try {
    const db = admin.firestore();
    const snap = await db
      .collection("enrichment_cache")
      .where("cache_key", "==", cacheKey)
      .where("created_at", ">", admin.firestore.Timestamp.fromDate(new Date(Date.now() - CACHE_TTL_MS)))
      .limit(1)
      .get();

    if (!snap.empty) {
      const cached = snap.docs[0].data();
      logger.info("[enrichment] Cache hit", { cacheKey: cacheKey.substring(0, 80) });
      return { data: cached.data, provider: cached.provider };
    }
  } catch (err) {
    logger.error("[enrichment] Cache lookup failed, continuing:", err.message);
  }
  return null;
};

/** Write enrichment result to cache. */
const writeCache = async (cacheKey, data, provider, userId) => {
  try {
    const db = admin.firestore();
    await db.collection("enrichment_cache").add({
      cache_key: cacheKey,
      data,
      provider,
      user_id: userId || null,
      created_at: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    logger.error("[enrichment] Cache write failed:", err.message);
  }
};

/** Log an enrichment attempt to Firestore. */
const logAttempt = async (cacheKey, providersTried, providerFound, status, userId) => {
  try {
    const db = admin.firestore();
    await db.collection("enrichment_logs").add({
      action_type: "waterfall_enrichment",
      cache_key: cacheKey,
      user_id: userId || null,
      providers_tried: providersTried,
      provider_found: providerFound,
      status,
      created_at: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    logger.error("[enrichment] Log write failed:", err.message);
  }
};

const tryHunter = async (firstName, lastName, domain) => {
  const apiKey = process.env.HUNTER_IO_API_KEY;
  if (!apiKey || !firstName || !lastName || !domain) return null;

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      domain,
      first_name: firstName,
      last_name: lastName,
    });
    const response = await axios.get(
      `https://api.hunter.io/v2/email-finder?${params.toString()}`,
      { timeout: TIMEOUT_MS }
    );
    const data = response.data?.data;
    return data?.email ? { ...data, _provider: "hunter" } : null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    logger.error("[enrichment] Hunter error:", err.response?.status || err.message);
    return null;
  }
};

const tryPDL = async (params) => {
  const apiKey = process.env.PDL_API_KEY || process.env.PEOPLE_DATA_LABS_API_KEY;
  if (!apiKey) return null;

  try {
    const qp = new URLSearchParams();
    if (params.profileUrl) qp.append("profile", params.profileUrl);
    if (params.email) qp.append("email", params.email);
    if (params.firstName) qp.append("first_name", params.firstName);
    if (params.lastName) qp.append("last_name", params.lastName);
    if (params.company) qp.append("company", params.company);

    const response = await axios.get(
      `https://api.peopledatalabs.com/v5/person/enrich?${qp.toString()}`,
      { headers: { "X-Api-Key": apiKey }, timeout: TIMEOUT_MS }
    );
    const data = response.data;
    return data && (data.emails?.length || data.phone_numbers?.length)
      ? { ...data, _provider: "pdl" }
      : null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    logger.error("[enrichment] PDL error:", err.response?.status || err.message);
    return null;
  }
};

/**
 * Run the enrichment waterfall: Nymeria -> Hunter.io -> PDL (first success wins).
 * @param {object} params - profileUrl, email, firstName, lastName, company, domain
 * @param {object} [meta] - userId (for logging), skipCache (bypass cache)
 */
const enrichContact = async (params = {}, meta = {}) => {
  const { profileUrl, email, firstName, lastName, company, domain } = params;
  const { userId, skipCache = false } = meta;

  const cacheKey = profileUrl || email || `${firstName}_${lastName}_${company || ""}`;

  // 1. Cache check
  if (!skipCache) {
    const cached = await checkCache(cacheKey);
    if (cached) {
      return { success: true, data: cached.data, provider: cached.provider, cached: true, providersTried: [] };
    }
  }

  const providersTried = [];
  let result = null;

  // 2. Nymeria (profile URL or email)
  if (profileUrl || email) {
    providersTried.push("nymeria");
    try {
      const raw = await nymeriaEnrich({ profileUrl, email });
      if (raw && (raw.work_email || raw.personal_emails?.length || raw.emails?.length || raw.mobile_phone)) {
        result = raw;
        result._provider = "nymeria";
      }
    } catch (err) {
      logger.error("[enrichment] Nymeria step failed:", err.message);
    }
  }

  // 3. Hunter.io (name + domain)
  if (!result && firstName && lastName && domain) {
    providersTried.push("hunter");
    result = await tryHunter(firstName, lastName, domain);
  }

  // 4. PDL (broadest)
  if (!result) {
    providersTried.push("pdl");
    result = await tryPDL({ profileUrl, email, firstName, lastName, company });
  }

  const provider = result?._provider || null;

  // Clean internal marker
  if (result) delete result._provider;

  // 5. Log & cache
  await logAttempt(cacheKey, providersTried, provider, result ? "success" : "not_found", userId);
  if (result) {
    await writeCache(cacheKey, result, provider, userId);
  }

  return {
    success: true,
    data: result,
    provider,
    cached: false,
    providersTried,
  };
};

module.exports = {
  enrichContact,
  checkCache,
};
