const { onCall } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");

/**
 * Clearbit Enrichment Cloud Function -- DEPRECATED
 *
 * Clearbit was acquired by HubSpot in 2023 and is no longer available
 * as a standalone API. Free tools were shut down April 2026.
 * This endpoint now returns a deprecation notice.
 *
 * Replacement: Use waterfallEnrich which routes through Nymeria -> Hunter.io -> PDL
 */
exports.clearbitEnrichment = onCall({}, async () => {
  logger.info("Clearbit endpoint called -- returning deprecation notice");
  return {
    error: 'Clearbit API has been discontinued',
    message: 'Clearbit was acquired by HubSpot and is no longer available as a standalone API. Use the waterfallEnrich endpoint instead, which routes through Nymeria, Hunter.io, and PDL.',
    deprecated: true,
    replacement: 'waterfallEnrich',
    timestamp: new Date().toISOString()
  };
});
