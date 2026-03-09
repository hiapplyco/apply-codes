const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');
const { withAuth } = require('./utils/auth-cors');
const { generateContent } = require('./utils/gemini');

exports.summarizeTitle = onRequest({ cors: true }, async (req, res) => {
  const auth = await withAuth(req, res);
  if (!auth) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Content is required and must be a non-empty string' });
      return;
    }

    const prompt = `Analyze the following content and generate a concise title and brief summary.

Rules:
- Title: max 60 characters, descriptive and specific
- Summary: 1-2 sentences capturing the key points

Return valid JSON with exactly this shape:
{
  "title": "...",
  "summary": "..."
}

Content:
${content}`;

    const result = await generateContent(prompt, { json: true });
    const parsed = JSON.parse(result.text);

    res.json({
      title: parsed.title || 'Untitled',
      summary: parsed.summary || '',
    });
  } catch (error) {
    logger.error('[summarizeTitle] Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});
