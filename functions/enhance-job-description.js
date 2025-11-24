const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function generateWithRetry(model, prompt, retryCount = 0) {
  try {
    console.log(`Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error(`Error on attempt ${retryCount + 1}:`, error);

    // Check if error is due to service overload
    if (error.message?.includes('503 Service Unavailable') && retryCount < MAX_RETRIES - 1) {
      const delayTime = INITIAL_RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      console.log(`Retrying in ${delayTime}ms...`);
      await delay(delayTime);
      return generateWithRetry(model, prompt, retryCount + 1);
    }

    throw error;
  }
}

exports.enhanceJobDescription = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set(corsHeaders);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { content } = req.body;
    console.log('Enhancing job description:', content?.substring(0, 100) + '...');

    if (!content) {
      res.status(400).json({ error: 'No content provided' });
      return;
    }

    // Get Gemini API key from environment
    const geminiApiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not configured');
      res.status(500).json({ error: 'API configuration error' });
      return;
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `As an experienced Talent Acquisition specialist, enhance this job description using clear headers and emphasis on key points that will attract top talent. Create a comprehensive, well-structured description that highlights:

🏢 Company Impact & Culture
- Mission & Vision
- Company Culture
- Growth Trajectory
- Innovation Focus

💫 Role Overview & Impact
- Position Impact
- Key Objectives
- Team Context
- Strategic Value

📋 Essential Qualifications
- Technical Expertise
- Experience Level
- Industry Knowledge
- Core Competencies
- Soft Skills

🌟 Preferred Qualifications
- Advanced Skills
- Additional Experience
- Industry Insights
- Leadership Abilities
- Certifications

📈 Growth & Development
- Career Progression
- Professional Development
- Mentorship
- Training Programs
- Innovation Opportunities

🎯 Success Metrics & Expectations
- First 90 Days
- Key Responsibilities
- Performance Indicators
- Team Collaboration
- Strategic Goals

🤝 Work Environment & Culture
- Team Structure
- Collaboration Style
- Work Arrangement
- Company Values
- Innovation Culture

📊 Impact & Outcomes
- Business Impact
- Team Influence
- Growth Potential
- Innovation Scope
- Success Metrics

🌈 Diversity & Inclusion
- Inclusive Culture
- Equal Opportunity
- Support Systems
- Accessibility

🎁 Benefits & Perks Highlights
- Health & Wellness
- Work-Life Balance
- Professional Growth
- Additional Perks

🚀 Next Steps & Application
- Application Process
- Timeline
- Contact Details
- Required Materials

Format the content to be:
- Engaging and scannable
- Clear and concise
- Action-oriented
- Value-focused
- Achievement-centered

Use:
- Bold for emphasis on key terms
- Bullet points for easy scanning
- Emojis for visual engagement
- Active voice and strong verbs

Highlight:
- Unique opportunities
- Growth potential
- Company culture
- Innovation focus
- Impact potential

Original job description: ${content}`;

    console.log('Using prompt for job description enhancement');

    const enhancedDescription = await generateWithRetry(model, prompt);
    console.log('Enhanced description generated successfully');

    res.status(200).json({ enhancedDescription });

  } catch (error) {
    console.error('Error in enhance-job-description:', error);

    // Create a user-friendly error message
    const userMessage = error.message?.includes('503 Service Unavailable')
      ? "The AI service is temporarily unavailable. We tried multiple times but couldn't get a response. Please try again in a few minutes."
      : "There was an error enhancing the job description. Please try again.";

    res.status(500).json({
      error: userMessage,
      details: error.stack
    });
  }
});