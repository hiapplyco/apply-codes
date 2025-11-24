const functions = require('firebase-functions');
const sgMail = require('@sendgrid/mail');

let isConfigured = false;
let cachedKey = null;

const resolveSendGridApiKey = () => {
  return functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY || null;
};

const configureSendGridClient = () => {
  if (isConfigured && cachedKey) {
    return sgMail;
  }

  const apiKey = resolveSendGridApiKey();

  if (!apiKey) {
    console.warn('[sendgrid] No API key configured; skipping SendGrid initialization.');
    cachedKey = null;
    isConfigured = false;
    return null;
  }

  if (!apiKey.startsWith('SG.')) {
    console.warn('[sendgrid] API key present but invalid (expected to start with "SG."); skipping SendGrid initialization.');
    cachedKey = null;
    isConfigured = false;
    return null;
  }

  sgMail.setApiKey(apiKey);
  cachedKey = apiKey;
  isConfigured = true;
  return sgMail;
};

const getSendGridClient = (options = {}) => {
  const { required = false } = options;
  const client = configureSendGridClient();

  if (!client && required) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'SendGrid API key is not configured correctly. Provide a valid key that starts with "SG.".'
    );
  }

  return client;
};

module.exports = {
  getSendGridClient,
  resolveSendGridApiKey,
  isSendGridConfigured: () => isConfigured && !!cachedKey
};
