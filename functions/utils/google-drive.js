/**
 * Shared Google Drive / Docs OAuth2 helpers.
 *
 * Resolves a user's stored Google OAuth tokens from Firestore, constructs an
 * authenticated OAuth2 client (with automatic token refresh), and returns
 * pre-configured Drive / Docs service instances.
 *
 * Usage:
 *   const { getDriveService, getDocsService } = require('./utils/google-drive');
 *   const drive = await getDriveService(uid, accountId);
 *   const docs  = await getDocsService(uid, accountId);
 */

const { google } = require('googleapis');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions/v2');

/**
 * Build an OAuth2 client pre-loaded with the user's stored tokens.
 * If the access token has expired the client will automatically use the
 * refresh token on the next API call (googleapis handles this internally).
 *
 * After a successful refresh we persist the new access token + expiry back
 * to Firestore so subsequent calls don't need to refresh again.
 *
 * @param {string} uid        Firebase Auth UID
 * @param {string} accountId  Google account document ID
 * @returns {Promise<import('googleapis').Auth.OAuth2Client>}
 */
async function getOAuth2Client(uid, accountId) {
  if (!uid) throw new Error('uid is required');
  if (!accountId) throw new Error('accountId is required');

  const docRef = admin.firestore()
    .collection('users').doc(uid)
    .collection('google_accounts').doc(accountId);

  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error('Google account not found');
  }

  const data = doc.data();

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured on server');
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);

  oauth2.setCredentials({
    access_token: data.accessToken,
    refresh_token: data.refreshToken,
  });

  // Listen for token refresh events and persist updated tokens
  oauth2.on('tokens', async (tokens) => {
    try {
      const update = {};
      if (tokens.access_token) update.accessToken = tokens.access_token;
      if (tokens.expiry_date) update.tokenExpiry = new Date(tokens.expiry_date);
      if (Object.keys(update).length > 0) {
        await docRef.update(update);
        logger.info('[google-drive] Persisted refreshed tokens for', accountId);
      }
    } catch (err) {
      logger.warn('[google-drive] Failed to persist refreshed tokens:', err.message);
    }
  });

  return oauth2;
}

/**
 * Return a Google Drive v3 service authenticated as the given user account.
 *
 * @param {string} uid
 * @param {string} accountId
 * @returns {Promise<import('googleapis').drive_v3.Drive>}
 */
async function getDriveService(uid, accountId) {
  const auth = await getOAuth2Client(uid, accountId);
  return google.drive({ version: 'v3', auth });
}

/**
 * Return a Google Docs v1 service authenticated as the given user account.
 *
 * @param {string} uid
 * @param {string} accountId
 * @returns {Promise<import('googleapis').docs_v1.Docs>}
 */
async function getDocsService(uid, accountId) {
  const auth = await getOAuth2Client(uid, accountId);
  return google.docs({ version: 'v1', auth });
}

module.exports = { getOAuth2Client, getDriveService, getDocsService };
