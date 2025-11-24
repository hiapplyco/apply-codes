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

const stopWords = new Set([
  'about','above','after','again','against','there','their','which','should','could','would','these','those','where','while','other','between','during','under','since','until'
]);

function extractKeyTerms(content) {
  if (!content) return [];
  const cleaned = content.replace(/[^\w\s]/gi, ' ').toLowerCase();
  const words = cleaned.split(/\s+/);
  const filtered = words.filter((word) => word.length > 4 && !stopWords.has(word));
  return Array.from(new Set(filtered)).slice(0, 10);
}

function buildSearchString(terms, searchType, companyName) {
  if (!terms.length) return '';
  const formattedTerms = terms.map((term) => `"${term}"`).join(' OR ');
  const companyFilter = companyName
    ? ` AND ("${companyName}" OR "${companyName.replace(/\s+/g, '')}")`
    : '';

  if (searchType === 'companies') {
    return `(${formattedTerms})`;
  }

  if (searchType === 'candidates-at-company' && companyName) {
    return `(${formattedTerms})${companyFilter}`;
  }

  return `(${formattedTerms}) AND ("candidate" OR "professional" OR "expert")${companyFilter}`;
}

exports.processJobRequirementsV2 = functions.https.onRequest(async (req, res) => {
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

    const { content, searchType, companyName } = req.body || {};
    if (!content) {
      res.status(400).json({ success: false, error: 'Content is required' });
      return;
    }

    const keyTerms = extractKeyTerms(content);
    const searchString = buildSearchString(keyTerms, searchType, companyName);

    res.status(200).json({
      success: true,
      searchString,
      jobId: null,
      usingNewSystem: true,
      workflowResults: {
        terms: keyTerms,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('processJobRequirementsV2 error:', error);
    res.status(500).json({ success: false, error: 'Failed to process job requirements' });
  }
});
