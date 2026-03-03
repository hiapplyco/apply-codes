const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.extractNlpTerms = onCall(
  {
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { content } = data;
      logger.info('Received content:', content?.substring(0, 100) + '...');

      if (!content || content.trim().length === 0) {
        logger.info('Empty content received, returning empty arrays');
        return {
          terms: {
            skills: [],
            titles: [],
            keywords: []
          }
        };
      }

      const model = getModel();

      if (!model) {
        throw new HttpsError('unavailable', 'GEMINI_API_KEY is not configured');
      }

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
        return {
          terms: parsedResponse
        };

      } catch (parseError) {
        logger.error('Error parsing Gemini response:', parseError);
        logger.error('Raw response that failed parsing:', response);

        return {
          terms: {
            skills: [],
            titles: [],
            keywords: []
          },
          error: 'Failed to parse terms'
        };
      }

    } catch (error) {
      logger.error('Error in extract-nlp-terms:', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', error.message || 'Failed to extract NLP terms');
    }
  }
);