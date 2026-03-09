const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');
const { withAuth } = require('./utils/auth-cors');
const { getDriveService } = require('./utils/google-drive');

exports.importFromGoogleDocs = onRequest({ cors: true }, async (req, res) => {
  const auth = await withAuth(req, res);
  if (!auth) return; // preflight or auth failure handled
  const { uid } = auth;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fileId, accountId } = req.body;

    if (!fileId) {
      res.status(400).json({ error: 'fileId is required' });
      return;
    }
    if (!accountId) {
      res.status(400).json({ error: 'accountId is required' });
      return;
    }

    const drive = await getDriveService(uid, accountId);

    // Export the Google Doc as plain text
    const exportRes = await drive.files.export({
      fileId,
      mimeType: 'text/plain',
    });

    const content = exportRes.data || '';

    // Build the document URL
    const documentUrl = `https://docs.google.com/document/d/${fileId}/edit`;

    logger.info('[importFromGoogleDocs] Imported doc', { fileId, uid, contentLength: content.length });

    res.json({ content, documentUrl });
  } catch (error) {
    logger.error('[importFromGoogleDocs] Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});
