const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');
const { getCorsHeaders } = require('./utils/auth-cors');

exports.parseDocument = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: '1GiB',
    
  },
  async (req, res) => {
    // Set CORS headers
    res.set(getCorsHeaders(req.headers.origin));

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { content, documentType } = req.body;

      if (!content) {
        res.status(400).json({ error: 'Content is required' });
        return;
      }

      const model = getModel();
      if (!model) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `Parse the following document content and extract structured data.
      
      Document Type: ${documentType || 'General'}
      
      Content:
      ${content}
      
      Return a JSON object with the extracted fields relevant to the document type.
      For resumes: name, email, phone, skills, experience, education.
      For job descriptions: title, company, requirements, responsibilities.
      For others: summary, key_points, entities.
      
      Return ONLY the JSON object.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Clean and parse JSON
      const cleanJson = response.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanJson);

      res.status(200).json(data);

    } catch (error) {
      logger.error('Error parsing document:', error);
      res.status(500).json({ error: error.message });
    }
  }
);