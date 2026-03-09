const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');
const { withAuth } = require('./utils/auth-cors');
const { getDriveService } = require('./utils/google-drive');

exports.getDriveFolders = onRequest({ cors: true }, async (req, res) => {
  const auth = await withAuth(req, res);
  if (!auth) return; // preflight or auth failure handled
  const { uid } = auth;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { accountId } = req.body;

    if (!accountId) {
      res.status(400).json({ error: 'accountId is required' });
      return;
    }

    const drive = await getDriveService(uid, accountId);

    // List all folders the user owns or has access to
    const listRes = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id, name)',
      orderBy: 'name',
      pageSize: 100,
    });

    const folders = (listRes.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
    }));

    logger.info('[getDriveFolders] Listed folders', { uid, count: folders.length });

    res.json({ folders });
  } catch (error) {
    logger.error('[getDriveFolders] Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});
