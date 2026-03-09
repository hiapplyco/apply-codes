const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');
const { withAuth } = require('./utils/auth-cors');
const { getDriveService } = require('./utils/google-drive');

/**
 * Map frontend permission labels to Google Drive API roles.
 */
function mapPermissionToRole(permission) {
  switch (permission) {
    case 'edit':
      return 'writer';
    case 'comment':
      return 'commenter';
    case 'view':
    default:
      return 'reader';
  }
}

/**
 * Extract the Google Drive file ID from a Google Docs / Drive URL.
 * Handles patterns like:
 *   https://docs.google.com/document/d/<id>/edit
 *   https://drive.google.com/file/d/<id>/view
 *   or a raw file ID string
 */
function extractFileId(documentUrl) {
  if (!documentUrl) return null;

  const match = documentUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  // If no URL pattern matched, treat the whole string as a file ID
  if (/^[a-zA-Z0-9_-]+$/.test(documentUrl)) return documentUrl;

  return null;
}

exports.shareGoogleDoc = onRequest({ cors: true }, async (req, res) => {
  const auth = await withAuth(req, res);
  if (!auth) return; // preflight or auth failure handled
  const { uid } = auth;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const {
      documentUrl,
      emails,
      permission = 'view',
      notify = true,
      message = '',
      accountId,
    } = req.body;

    if (!documentUrl) {
      res.status(400).json({ error: 'documentUrl is required' });
      return;
    }
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      res.status(400).json({ error: 'emails array is required and must not be empty' });
      return;
    }
    if (!accountId) {
      res.status(400).json({ error: 'accountId is required' });
      return;
    }

    const fileId = extractFileId(documentUrl);
    if (!fileId) {
      res.status(400).json({ error: 'Could not extract file ID from documentUrl' });
      return;
    }

    const drive = await getDriveService(uid, accountId);
    const role = mapPermissionToRole(permission);

    // Create a permission for each email address
    const results = await Promise.allSettled(
      emails.map((email) =>
        drive.permissions.create({
          fileId,
          sendNotificationEmail: notify,
          emailMessage: message || undefined,
          requestBody: {
            role,
            type: 'user',
            emailAddress: email,
          },
        })
      )
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      logger.warn('[shareGoogleDoc] Some shares failed:', failed.map((f) => f.reason?.message));
    }

    logger.info('[shareGoogleDoc] Shared doc', {
      fileId,
      uid,
      emailCount: emails.length,
      failedCount: failed.length,
      role,
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('[shareGoogleDoc] Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});
