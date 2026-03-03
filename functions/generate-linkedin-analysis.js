const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.generateLinkedinAnalysis = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { content } = data;

      if (!content) {
        throw new HttpsError('invalid-argument', 'Content is required');
      }

      const model = getModel('gemini-3.1-pro-preview', {
        temperature: 1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      });

      if (!model) {
        throw new HttpsError('unavailable', 'GEMINI_API_KEY is not configured');
      }

      const prompt = `Act as 5 experts + Devil's Advocate analyzing "${content}":

1. [MoE Phase]
- Technical Architect: "Core components/implementation challenges..."
- Industry Analyst: "Adoption trends/success-failure case studies..."
- Ethics Specialist: "Regulatory risks/ethical failure points..."
- Solutions Engineer: "Technical specifications/architecture..."
- UX Strategist: "User adoption barriers/engagement strategies..."

2. [Devil's Advocate Phase]
- Critic: "Fundamental flaws in these approaches... Overlooked threats..."

3. [CoT Resolution]
- Lead Architect: "Address criticisms through:\n- Flaw mitigation 1...\n- Threat workaround 2..."
- Final hybrid solution balancing innovation/safety

4. [Voice Synthesis]
- Tone Engineer: "Natural communication using:\n- Relatable analogies\n- Personal anecdotes\n- 'You've probably noticed...' phrasing\n- Humble expertise presentation"`;

      const result = await model.generateContent(prompt);
      const analysis = result.response.text();

      return { analysis };

    } catch (error) {
      logger.error('Error in generate-linkedin-analysis:', error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', error.message || 'Failed to generate LinkedIn analysis');
    }
  }
);