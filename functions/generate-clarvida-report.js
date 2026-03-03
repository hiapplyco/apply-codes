const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");

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

exports.generateClarvidaReport = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    const { content } = data || {};
    if (!content) {
      throw new HttpsError('invalid-argument', 'Content is required');
    }

    // Placeholder future integration: return structured report derived from content
    const report = defaultReport(content);
    return report;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('generateClarvidaReport error:', error);
    throw new HttpsError('internal', 'Failed to generate Clarvida report');
  }
});
