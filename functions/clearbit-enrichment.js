const functions = require('firebase-functions');
const { logger } = require("firebase-functions/v2");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Clearbit Enrichment Cloud Function — DEPRECATED
 *
 * Clearbit was acquired by HubSpot in 2023 and is no longer available
 * as a standalone API. Free tools were shut down April 2026.
 * This endpoint now returns a deprecation notice.
 *
 * Replacement: Use waterfallEnrich which routes through Nymeria → Hunter.io → PDL
 */
const clearbitEnrichment = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(200).send();
    return;
  }

  res.set(corsHeaders);

  logger.info("Clearbit endpoint called — returning deprecation notice");
  res.status(410).json({
    error: 'Clearbit API has been discontinued',
    message: 'Clearbit was acquired by HubSpot and is no longer available as a standalone API. Use the waterfallEnrich endpoint instead, which routes through Nymeria, Hunter.io, and PDL.',
    deprecated: true,
    replacement: 'waterfallEnrich',
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  clearbitEnrichment
};
