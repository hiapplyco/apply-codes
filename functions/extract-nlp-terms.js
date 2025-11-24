const { onRequest } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('firebase-functions/logger');

exports.extractNlpTerms = onRequest(
  {
    cors: true,
    timeoutSeconds: 120,
    memory: '512MiB'
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { content } = req.body;
      logger.info('Received content:', content?.substring(0, 100) + '...');

      if (!content || content.trim().length === 0) {
        logger.info('Empty content received, returning empty arrays');
        res.status(200).json({
          terms: {
            skills: [],
            titles: [],
            keywords: []
          }
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Extract and categorize key terms from this job description into specific categories. Format your response EXACTLY as a JSON object with these arrays:

{
  "skills": ["skill1", "skill2"],
  "titles": ["title1", "title2"],
  "keywords": ["keyword1", "keyword2"]
}

Guidelines for skills extraction:
- Include ONLY concrete, specific technical skills, tools, and technologies
- Exclude generic terms like "experience", "knowledge", "critical thinking", or "decision making"
- Keep each skill concise (1-3 words maximum)
- Include 3-7 most relevant skills
- Format consistently (e.g., "Medical Billing" not "medical billing")
- DO NOT include soft skills or generic competencies

Guidelines for titles:
- Include 2-5 relevant job titles
- Format consistently with proper capitalization
- Include variations and similar roles

Guidelines for keywords:
- Include 3-7 specific industry terms or certifications
- Exclude generic terms
- Focus on concrete, measurable terms

Return ONLY the JSON object, no other text.

Text to analyze: ${content}`;

      logger.info('Using prompt for NLP terms extraction');
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      logger.info('Raw Gemini response:', response);

      try {
        const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
        const parsedResponse = JSON.parse(cleanedResponse);

        // Validate response structure
        if (!Array.isArray(parsedResponse.skills) ||
            !Array.isArray(parsedResponse.titles) ||
            !Array.isArray(parsedResponse.keywords)) {
          throw new Error('Invalid response structure');
        }

        // Clean and validate skills
        parsedResponse.skills = parsedResponse.skills
          .filter(skill =>
            typeof skill === 'string' &&
            skill.trim().length > 0 &&
            skill.split(' ').length <= 3 &&
            !skill.toLowerCase().includes('experience') &&
            !skill.toLowerCase().includes('knowledge') &&
            !skill.toLowerCase().includes('critical thinking') &&
            !skill.toLowerCase().includes('decision making')
          )
          .map(skill => skill.trim());

        logger.info('Successfully parsed and validated response:', parsedResponse);
        res.status(200).json({
          terms: parsedResponse
        });

      } catch (parseError) {
        logger.error('Error parsing Gemini response:', parseError);
        logger.error('Raw response that failed parsing:', response);

        res.status(200).json({
          terms: {
            skills: [],
            titles: [],
            keywords: []
          },
          error: 'Failed to parse terms'
        });
      }

    } catch (error) {
      logger.error('Error in extract-nlp-terms:', error);
      res.status(500).json({
        terms: {
          skills: [],
          titles: [],
          keywords: []
        },
        error: error.message
      });
    }
  }
);