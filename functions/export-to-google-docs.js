const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');
const { withAuth } = require('./utils/auth-cors');
const { getDriveService, getDocsService } = require('./utils/google-drive');

exports.exportToGoogleDocs = onRequest({ cors: true }, async (req, res) => {
  const auth = await withAuth(req, res);
  if (!auth) return; // preflight or auth failure handled
  const { uid } = auth;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const {
      content,
      title = 'Untitled Document',
      format = 'docx',
      sharing = 'private',
      folderId = 'root',
      description = '',
      accountId,
    } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }
    if (!accountId) {
      res.status(400).json({ error: 'accountId is required' });
      return;
    }

    const drive = await getDriveService(uid, accountId);
    const docs = await getDocsService(uid, accountId);

    // 1. Create a blank Google Doc in the specified folder
    const fileMetadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.document',
      parents: [folderId],
    };
    if (description) {
      fileMetadata.description = description;
    }

    const createRes = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, webViewLink',
    });

    const documentId = createRes.data.id;
    const documentUrl = createRes.data.webViewLink;

    // 2. Insert content into the document
    // Strip HTML tags for plain-text insertion via Docs API
    const plainText = content.replace(/<[^>]*>/g, '');

    if (plainText.trim()) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: plainText,
              },
            },
          ],
        },
      });
    }

    // 3. Set sharing permissions if not private
    if (sharing === 'anyone_with_link') {
      await drive.permissions.create({
        fileId: documentId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } else if (sharing === 'domain') {
      // Domain sharing requires the user's domain; extract from their Google email
      try {
        const aboutRes = await drive.about.get({ fields: 'user' });
        const email = aboutRes.data.user?.emailAddress || '';
        const domain = email.split('@')[1];
        if (domain) {
          await drive.permissions.create({
            fileId: documentId,
            requestBody: {
              role: 'reader',
              type: 'domain',
              domain,
            },
          });
        }
      } catch (domainErr) {
        logger.warn('[exportToGoogleDocs] Could not set domain sharing:', domainErr.message);
        // Non-fatal: document is still created
      }
    }

    logger.info('[exportToGoogleDocs] Created doc', { documentId, uid, format, sharing });

    res.json({ documentId, documentUrl });
  } catch (error) {
    logger.error('[exportToGoogleDocs] Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});
