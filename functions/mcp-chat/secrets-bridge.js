'use strict';

const { logger } = require('firebase-functions/v2');

const REQUIRED_SECRETS = ['GEMINI_API_KEY'];

const OPTIONAL_SECRETS = [
  'NYMERIA_API_KEY',
  'PERPLEXITY_API_KEY',
];

function validateSecrets() {
  const missing = [];
  const available = [];

  for (const key of REQUIRED_SECRETS) {
    if (process.env[key]) {
      available.push(key);
    } else {
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_SECRETS) {
    if (process.env[key]) {
      available.push(key);
    }
  }

  if (missing.length > 0) {
    logger.error('[secrets-bridge] Missing required secrets:', missing);
    return { valid: false, missing, available };
  }

  logger.info(`[secrets-bridge] ${available.length} secrets available`);
  return { valid: true, missing: [], available };
}

module.exports = { validateSecrets, REQUIRED_SECRETS, OPTIONAL_SECRETS };
