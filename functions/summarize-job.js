const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.summarizeJob = onCall(
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
      logger.info('Summarizing job content:', content?.substring(0, 100) + '...');

      if (!content) {
        throw new HttpsError('invalid-argument', 'Content is required');
      }

      const model = getModel();

      if (!model) {
        throw new HttpsError('unavailable', 'GEMINI_API_KEY is not configured');
      }

      const prompt = `As a senior Talent Acquisition professional, create a compelling and comprehensive summary of this job description using clear markdown formatting. Focus on the key aspects that would most interest potential candidates:

# 📝 Comprehensive Job Summary

## 🎯 Position Overview
- **Role:** *[Specific job title and level]*
- **Industry:** *[Business sector/domain]*
- **Location:** *[Work arrangement - remote/hybrid/onsite]*
- **Company Type:** *[Size, stage, market position]*

## 💫 Key Responsibilities & Impact
- **Primary Focus:** *[Main objective and purpose]*
- **Core Duties:** *[3-4 key responsibilities]*
- **Strategic Impact:** *[How role affects business]*
- **Team Context:** *[Reporting structure & collaboration]*

## 🎓 Required Qualifications
- **Technical Skills:** *[Critical technical requirements]*
- **Experience Level:** *[Years and type of experience]*
- **Education:** *[Required degrees/certifications]*
- **Industry Knowledge:** *[Sector expertise needed]*

## 🌟 Key Competencies
- **Technical Expertise:** *[Specific tools/technologies]*
- **Soft Skills:** *[Critical interpersonal abilities]*
- **Leadership:** *[Management/mentoring requirements]*
- **Communication:** *[Important communication skills]*

## 📈 Growth & Opportunity
- **Career Path:** *[Progression opportunities]*
- **Learning:** *[Development resources]*
- **Impact:** *[Ability to influence outcomes]*
- **Innovation:** *[Opportunity to drive change]*

## 🎁 Package Highlights
- **Compensation:** *[Salary range if provided]*
- **Benefits:** *[Key benefits overview]*
- **Perks:** *[Notable additional benefits]*
- **Work Style:** *[Flexibility/arrangements]*

Format the content to be engaging and concise, using:
- Bold for categories and key terms
- Italic for supporting details
- Bullet points for clear organization
- Emojis for visual engagement

Focus on what would most interest potential candidates, including:
- Role impact and growth potential
- Key responsibilities and expectations
- Required skills and experience
- Company culture and benefits
- Career development opportunities

Job description: ${content}`;

      logger.info('Using prompt for job summary');
      const result = await model.generateContent(prompt);
      const summary = result.response.text();
      logger.info('Job summary generated successfully');

      return { summary };

    } catch (error) {
      logger.error('Error in summarize-job:', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', error.message || 'Failed to summarize job');
    }
  }
);