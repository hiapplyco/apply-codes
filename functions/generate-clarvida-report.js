const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const defaultReport = (content) => {
  const summary = content?.slice(0, 280) || 'No content provided.';
  return {
    success: true,
    data: {
      report: {
        summary,
        insights: [
          'Ensure compensation benchmarks are aligned with market data.',
          'Highlight unique benefits and culture fit to attract top talent.'
        ],
        recommendations: [
          'Clarify must-have skills versus nice-to-have skills.',
          'Add location flexibility details if remote/hybrid options exist.'
        ]
      }
    }
  };
};

exports.generateClarvidaReport = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    res.set(corsHeaders);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    await admin.auth().verifyIdToken(token);

    const { content } = req.body || {};
    if (!content) {
      res.status(400).json({ success: false, error: 'Content is required' });
      return;
    }

    // Placeholder future integration: return structured report derived from content
    const report = defaultReport(content);
    res.status(200).json(report);
  } catch (error) {
    console.error('generateClarvidaReport error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate Clarvida report' });
  }
});
