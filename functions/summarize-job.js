const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('firebase-functions/logger');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

exports.summarizeJob = onRequest(
  {
    cors: true,
    timeoutSeconds: 120,
    memory: '512MiB',
    secrets: [geminiApiKey]
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
      logger.info('Summarizing job content:', content?.substring(0, 100) + '...');

      if (!content) {
        res.status(400).json({ error: 'Content is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

      res.status(200).json({ summary });

    } catch (error) {
      logger.error('Error in summarize-job:', error);
      res.status(500).json({ error: error.message });
    }
  }
);