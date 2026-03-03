/**
 * Shared CORS headers and auth verification for onRequest functions.
 *
 * Eliminates the duplicated CORS + Firebase Auth boilerplate across
 * 15+ onRequest handlers.
 *
 * Usage:
 *   const { corsHeaders, handlePreflight, verifyAuth } = require('./utils/auth-cors');
 *
 *   exports.myFunction = onRequest(async (req, res) => {
 *     if (handlePreflight(req, res)) return;
 *     res.set(corsHeaders);
 *     const { uid } = await verifyAuth(req);
 *     // ... handler logic
 *   });
 */

const { logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");

/**
 * Standard CORS headers used across all onRequest functions.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Handle CORS preflight (OPTIONS) requests.
 * Returns true if the request was a preflight and has been handled.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {boolean} true if handled (caller should return early)
 */
const handlePreflight = (req, res) => {
  if (req.method === "OPTIONS") {
    res.set(corsHeaders);
    res.status(204).send("");
    return true;
  }
  return false;
};

/**
 * Verify Firebase Auth ID token from the Authorization header.
 *
 * @param {import('express').Request} req
 * @param {object} [options]
 * @param {boolean} [options.optional] - If true, returns { uid: null } instead of throwing
 * @returns {Promise<{uid: string, token: object}>}
 * @throws {Error} When token is missing/invalid (unless optional=true)
 */
const verifyAuth = async (req, options = {}) => {
  const { optional = false } = options;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (optional) {
      logger.info("[auth-cors] No auth token provided, proceeding as anonymous");
      return { uid: null, token: null };
    }
    const err = new Error("Unauthorized - No token provided");
    err.statusCode = 401;
    throw err;
  }

  const idToken = authHeader.replace("Bearer ", "");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid, token: decodedToken };
  } catch (authError) {
    if (optional) {
      logger.warn("[auth-cors] Token verification failed, proceeding as anonymous:", authError.message);
      return { uid: null, token: null };
    }
    logger.error("[auth-cors] Token verification failed:", authError.message);
    const err = new Error("Unauthorized - Invalid token");
    err.statusCode = 401;
    throw err;
  }
};

/**
 * Express-style middleware that sets CORS headers and verifies auth.
 * Sends 401 response directly if auth fails, returning false.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {object} [options]
 * @param {boolean} [options.optional] - Allow anonymous access
 * @returns {Promise<{uid: string|null, token: object|null}|false>} Auth info, or false if rejected
 */
const withAuth = async (req, res, options = {}) => {
  if (handlePreflight(req, res)) return false;

  res.set(corsHeaders);

  try {
    return await verifyAuth(req, options);
  } catch (err) {
    res.status(err.statusCode || 401).json({ error: err.message });
    return false;
  }
};

module.exports = {
  corsHeaders,
  handlePreflight,
  verifyAuth,
  withAuth,
};
