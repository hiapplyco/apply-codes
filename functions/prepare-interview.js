const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const interviewFrameworks = {
  'star': {
    name: 'STAR Method',
    tooltip:
      'Situation, Task, Action, Result. Used to assess past behavior and predict future performance by asking candidates to describe specific examples of their experiences.',
  },
  'behavioral': {
    name: 'Behavioral',
    tooltip:
      'Focuses on past behaviors to predict future performance. Questions often start with "Tell me about a time when..."',
  },
  'technical': {
    name: 'Technical',
    tooltip:
      'Evaluates a candidate\'s technical skills and knowledge. Can include coding challenges, system design questions, or theoretical concepts.',
  },
  'case-study': {
    name: 'Case Study',
    tooltip:
      'Presents business problems or analytical challenges to assess problem-solving skills, analytical thinking, and business acumen.',
  },
  'cultural-fit': {
    name: 'Cultural Fit',
    tooltip:
      'Assesses alignment with company values, team dynamics, and organizational culture to ensure a good match.',
  },
  'panel': {
    name: 'Panel Interview',
    tooltip:
      'Multiple interviewers assess the candidate simultaneously, providing diverse perspectives and comprehensive evaluation.',
  },
  'screening': {
    name: 'Phone/Video Screening',
    tooltip:
      'Initial assessment to evaluate basic qualifications, communication skills, and interest in the position.',
  },
  'executive': {
    name: 'Executive Interview',
    tooltip:
      'Focuses on leadership capabilities, strategic thinking, vision, and ability to drive organizational success.',
  },
  'competency': {
    name: 'Competency-Based',
    tooltip:
      'Evaluates specific skills and competencies required for the role through structured questions and scenarios.',
  },
  'stress': {
    name: 'Stress Interview',
    tooltip:
      'Tests how candidates handle pressure, challenging situations, and unexpected questions to assess resilience.',
  },
  'group': {
    name: 'Group Interview',
    tooltip:
      'Multiple candidates are interviewed together to assess teamwork, leadership, and how they interact with others.',
  },
  'custom': {
    name: 'Custom Framework',
    tooltip:
      'Create your own interview structure tailored to your specific needs and evaluation criteria.',
  },
};

// Retry logic for Gemini API
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

exports.prepareInterview = functions.https.onRequest(async (req, res) => {
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
    const { context, interviewType } = req.body;

    if (!context || !interviewType) {
      res.status(400).json({
        error: 'Missing context or interviewType'
      });
      return;
    }

    const framework = interviewFrameworks[interviewType];

    if (!framework) {
      res.status(400).json({
        error: `Invalid interviewType: ${interviewType}. Valid types are: ${Object.keys(interviewFrameworks).join(', ')}`
      });
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Based on the following context:
      ---
      ${context}
      ---
      Generate a comprehensive interview preparation package for a ${framework.name} interview.

      Your response should include:
      1. A set of 5-7 interview questions specific to this framework
      2. For each question, provide a brief explanation of what it assesses
      3. Candidate briefing materials with tips for preparation
      4. Interview guide for interviewers with evaluation criteria
      5. Assessment criteria and scoring rubric

      You must return only valid JSON with no additional text or formatting.
      Return the response as a JSON object with the following structure:
      {
        "interviewType": "${framework.name}",
        "tooltip": "${framework.tooltip}",
        "questions": [
          {
            "question": "The generated question",
            "assesses": "What the question is designed to assess",
            "category": "Question category (e.g., Technical Skills, Problem Solving, etc.)",
            "difficulty": "basic|intermediate|advanced",
            "timeAllocation": "Suggested time in minutes"
          }
        ],
        "candidateBriefing": {
          "preparationTips": ["List of preparation tips for candidates"],
          "whatToExpect": "Description of what candidates can expect",
          "recommendedResources": ["List of recommended preparation resources"]
        },
        "interviewerGuide": {
          "conductingTips": ["Tips for conducting this type of interview"],
          "redFlags": ["Warning signs to watch for"],
          "followUpQuestions": ["Suggested follow-up questions"]
        },
        "assessmentCriteria": {
          "scoringRubric": {
            "excellent": "Description of excellent performance",
            "good": "Description of good performance",
            "fair": "Description of fair performance",
            "poor": "Description of poor performance"
          },
          "keyCompetencies": ["List of key competencies being evaluated"]
        }
      }
    `;

    console.log(`Generating interview preparation for ${framework.name} interview`);
    const text = await generateWithRetry(model, prompt);

    // Clean the response to ensure it's valid JSON
    let cleanedText = text.trim();

    // Remove markdown code blocks if present
    if (cleanedText.includes('```')) {
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }

    // Try to extract JSON if it's embedded in other text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    // Validate that the cleaned text is parsable JSON
    const parsedResponse = JSON.parse(cleanedText);

    console.log('Interview preparation generated successfully');
    res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('Error in prepare-interview function:', error);

    // Determine error message
    let errorMessage = 'Failed to generate interview preparation materials';
    if (error instanceof SyntaxError) {
      errorMessage = 'Failed to parse AI response. Please try again.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Create a user-friendly error message
    const userMessage = error.message?.includes('503 Service Unavailable')
      ? "The AI service is temporarily unavailable. We tried multiple times but couldn't get a response. Please try again in a few minutes."
      : errorMessage;

    res.status(500).json({
      error: userMessage,
      details: error instanceof Error ? error.toString() : 'Unknown error'
    });
  }
});