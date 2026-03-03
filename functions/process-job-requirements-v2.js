const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");

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

exports.processJobRequirementsV2 = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { content, searchType, companyName } = data || {};
    if (!content) {
      throw new HttpsError('invalid-argument', 'Content is required');
    }

    const keyTerms = extractKeyTerms(content);
    const searchString = buildSearchString(keyTerms, searchType, companyName);

    return {
      success: true,
      searchString,
      jobId: null,
      usingNewSystem: true,
      workflowResults: {
        terms: keyTerms,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('processJobRequirementsV2 error:', error);
    throw new HttpsError('internal', 'Failed to process job requirements');
  }
});
