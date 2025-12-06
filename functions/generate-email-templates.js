const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('firebase-functions/logger');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

exports.generateEmailTemplates = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: '1GiB',
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
      const { candidates, jobDescription, context } = req.body;

      if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
        res.status(400).json({ error: 'At least one candidate is required' });
        return;
      }

      if (!jobDescription?.trim()) {
        res.status(400).json({ error: 'Job description is required' });
        return;
      }

      logger.info(`Generating email templates for ${candidates.length} candidate(s)`);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({ error: 'Missing Gemini API key' });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      });

      const emailTemplates = [];

      // Generate email template for each candidate
      for (const candidate of candidates) {
        try {
          const emailContent = await generateEmailForCandidate(model, candidate, jobDescription, context);
          emailTemplates.push({
            candidateName: candidate.name,
            subject: emailContent.subject,
            body: emailContent.body,
            profileUrl: candidate.profileUrl
          });
        } catch (error) {
          logger.error(`Error generating email for ${candidate.name}:`, error);
          // Add fallback email for this candidate
          emailTemplates.push({
            candidateName: candidate.name,
            subject: `Exciting Opportunity - ${extractJobTitle(jobDescription)}`,
            body: generateFallbackEmail(candidate, jobDescription, context),
            profileUrl: candidate.profileUrl
          });
        }
      }

      res.status(200).json({
        success: true,
        emailTemplates,
        count: emailTemplates.length
      });

    } catch (error) {
      logger.error('Error in generate-email-templates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  }
);

async function generateEmailForCandidate(model, candidate, jobDescription, context) {
  const prompt = `You are an expert recruiter writing a personalized outreach email to a potential candidate. Create a compelling, concise email that feels human and authentic.

CANDIDATE PROFILE:
- Name: ${candidate.name}
- LinkedIn: ${candidate.profileUrl}
- Background: ${candidate.snippet}
- Location: ${candidate.location || 'Not specified'}

JOB DESCRIPTION:
${jobDescription}

ADDITIONAL CONTEXT:
${context || 'None provided'}

REQUIREMENTS:
1. Subject line: Compelling and personalized (under 60 characters)
2. Email body: Concise and engaging (under 250 words)
3. Tone: Professional yet approachable, avoid sounding robotic
4. Personalization: Reference specific aspects of their background
5. Value proposition: Clearly explain why this role is perfect for them
6. Call to action: Simple and clear next step
7. Sign-off: "Best regards, [Your Name] - Apply Team"

AVOID:
- Generic templates
- Overly salesy language
- Too much company jargon
- Lengthy descriptions

Format your response as JSON with "subject" and "body" fields only.`;

  const result = await model.generateContent([{ text: prompt }]);
  const response = result.response.text();

  // Clean and parse the response
  const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleanedResponse);
  } catch (parseError) {
    logger.warn('Failed to parse Gemini response as JSON for candidate:', candidate.name);
    throw new Error(`Failed to parse AI response for ${candidate.name}`);
  }
}

function generateFallbackEmail(candidate, jobDescription, context) {
  const jobTitle = extractJobTitle(jobDescription);
  const candidateFirstName = candidate.name.split(' ')[0];

  return `Hi ${candidateFirstName},

I came across your LinkedIn profile and was impressed by your background. Your experience seems like a great fit for a ${jobTitle} role I'm working on.

${context ? `${context}\n\n` : ''}Based on your profile, I think you'd be interested in this opportunity. The role offers growth potential and aligns well with your expertise.

Would you be open to a brief 15-minute conversation to learn more? I'd love to share the details and see if it's a good mutual fit.

Looking forward to hearing from you!

Best regards,
[Your Name] - Apply Team`;
}

function extractJobTitle(jobDescription) {
  // Simple job title extraction from job description
  const lines = jobDescription.split('\n').filter(line => line.trim());
  const firstLine = lines[0]?.trim() || '';

  // Look for common job title patterns
  const titlePatterns = [
    /(?:position|role|job):\s*(.+)/i,
    /hiring\s+(?:a\s+)?(.+?)(?:\s+at|\s+for|\s*$)/i,
    /looking\s+for\s+(?:a\s+)?(.+?)(?:\s+to|\s+who|\s*$)/i,
    /^(.+?)(?:\s+position|\s+role|\s+job|\s*$)/i
  ];

  for (const pattern of titlePatterns) {
    const match = firstLine.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback to first meaningful words
  return firstLine.split(' ').slice(0, 3).join(' ') || 'this role';
}