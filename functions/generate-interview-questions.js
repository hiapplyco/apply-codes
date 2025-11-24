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

exports.generateInterviewQuestions = functions.https.onRequest(async (req, res) => {
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
    const {
      jobRole,
      experienceLevel,
      interviewType,
      skills = [],
      duration = 60,
      company = 'our company'
    } = req.body;

    console.log('Generating interview questions for:', { jobRole, experienceLevel, interviewType });

    // Validate required parameters
    if (!jobRole) {
      res.status(400).json({ error: 'Job role is required' });
      return;
    }

    if (!experienceLevel || !['entry', 'mid', 'senior', 'executive'].includes(experienceLevel)) {
      res.status(400).json({ error: 'Valid experience level is required (entry, mid, senior, executive)' });
      return;
    }

    if (!interviewType || !['technical', 'behavioral', 'cultural', 'screening', 'panel', 'final'].includes(interviewType)) {
      res.status(400).json({ error: 'Valid interview type is required (technical, behavioral, cultural, screening, panel, final)' });
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

    // First generate questions using AI, then use our structured approach
    const questions = generateQuestions(jobRole, experienceLevel, interviewType, skills, duration);
    const structure = createInterviewStructure(duration, interviewType);
    const evaluationCriteria = createEvaluationCriteria(jobRole, experienceLevel, interviewType);

    // Generate additional AI-enhanced questions
    const aiPrompt = createAIPrompt(jobRole, experienceLevel, interviewType, skills, duration, company);
    const aiQuestions = await generateWithRetry(model, aiPrompt);

    const interviewGuide = {
      metadata: {
        jobRole,
        experienceLevel,
        interviewType,
        duration: `${duration} minutes`,
        company,
        generatedAt: new Date().toISOString()
      },
      structure,
      questions: questions,
      aiEnhancedQuestions: aiQuestions,
      evaluationCriteria,
      tips: getInterviewTips(interviewType),
      nextSteps: [
        'Review questions and customize for specific candidate',
        'Prepare follow-up questions based on candidate responses',
        'Set up interview environment and materials',
        'Brief co-interviewers if applicable'
      ]
    };

    console.log('Interview guide generated successfully');
    res.status(200).json(interviewGuide);

  } catch (error) {
    console.error('Error in generate-interview-questions:', error);

    // Create a user-friendly error message
    const userMessage = error.message?.includes('503 Service Unavailable')
      ? "The AI service is temporarily unavailable. We tried multiple times but couldn't get a response. Please try again in a few minutes."
      : "There was an error generating interview questions. Please try again.";

    res.status(500).json({
      error: userMessage,
      details: error.stack
    });
  }
});

function createAIPrompt(jobRole, experienceLevel, interviewType, skills, duration, company) {
  const skillsText = skills.length > 0 ? skills.join(', ') : 'general skills for the role';

  return `Generate ${Math.floor(duration / 8)} high-quality interview questions for a ${experienceLevel} level ${jobRole} position at ${company}.

Interview Type: ${interviewType}
Key Skills: ${skillsText}
Duration: ${duration} minutes

Requirements:
1. Questions should be specific to the ${interviewType} interview type
2. Appropriate difficulty level for ${experienceLevel} candidates
3. Include follow-up questions for deeper exploration
4. Focus on ${skillsText} where relevant
5. Each question should assess specific competencies

For each question, provide:
- The main question
- 2-3 follow-up questions
- What competency it assesses
- Estimated time allocation

Format as JSON with this structure:
{
  "questions": [
    {
      "category": "Category Name",
      "question": "Main question text",
      "followUps": ["Follow-up 1", "Follow-up 2"],
      "competency": "What this assesses",
      "timeAllocation": "X minutes",
      "difficulty": "basic|intermediate|advanced"
    }
  ]
}

Make questions engaging, specific, and designed to reveal the candidate's true capabilities and fit for the role.`;
}

function generateQuestions(role, level, type, skills, duration) {
  const questionCount = Math.floor(duration / 8); // Approximately 8 minutes per question
  const questions = [];

  if (type === 'technical') {
    questions.push(...getTechnicalQuestions(role, level, skills, questionCount));
  } else if (type === 'behavioral') {
    questions.push(...getBehavioralQuestions(role, level, questionCount));
  } else if (type === 'cultural') {
    questions.push(...getCulturalQuestions(role, level, questionCount));
  } else if (type === 'screening') {
    questions.push(...getScreeningQuestions(role, level, skills, questionCount));
  } else if (type === 'panel') {
    questions.push(...getPanelQuestions(role, level, questionCount));
  } else if (type === 'final') {
    questions.push(...getFinalQuestions(role, level, questionCount));
  }

  return questions.slice(0, questionCount);
}

function getTechnicalQuestions(role, level, skills, count) {
  const questions = [];
  const isEngineering = role.toLowerCase().includes('engineer') || role.toLowerCase().includes('developer');

  if (isEngineering) {
    questions.push(
      {
        category: 'Technical Knowledge',
        question: `Explain the key architectural decisions you would make when building a ${skills[0] || 'modern web'} application from scratch.`,
        followUps: ['What factors would influence your technology choices?', 'How would you handle scalability concerns?'],
        difficulty: level === 'entry' ? 'basic' : level === 'senior' ? 'advanced' : 'intermediate'
      },
      {
        category: 'Problem Solving',
        question: 'Walk me through your approach to debugging a production issue that users are reporting.',
        followUps: ['What tools would you use?', 'How would you prevent similar issues?'],
        difficulty: 'intermediate'
      },
      {
        category: 'System Design',
        question: level === 'entry' ?
          'How would you structure a simple REST API for a basic CRUD application?' :
          'Design a system that can handle 1 million concurrent users. What are your main considerations?',
        followUps: ['How would you handle data consistency?', 'What about security considerations?'],
        difficulty: level === 'entry' ? 'basic' : 'advanced'
      }
    );

    if (skills.length > 0) {
      skills.slice(0, 2).forEach(skill => {
        questions.push({
          category: 'Specific Technology',
          question: `Tell me about a challenging project where you used ${skill}. What problems did you solve?`,
          followUps: [`What ${skill} features were most important for your solution?`, 'What would you do differently?'],
          difficulty: 'intermediate'
        });
      });
    }
  } else {
    // Non-engineering roles
    const roleSpecificQuestions = getRoleSpecificTechnicalQuestions(role, level);
    questions.push(...roleSpecificQuestions);
  }

  return questions;
}

function getBehavioralQuestions(role, level, count) {
  const questions = [
    {
      category: 'Leadership & Initiative',
      question: 'Tell me about a time when you had to take ownership of a project or situation without being explicitly asked.',
      followUps: ['What was the outcome?', 'What did you learn from this experience?'],
      purpose: 'Assesses proactivity and leadership potential'
    },
    {
      category: 'Problem Solving',
      question: 'Describe a complex problem you solved at work. Walk me through your thought process.',
      followUps: ['What alternatives did you consider?', 'How did you validate your solution?'],
      purpose: 'Evaluates analytical thinking and problem-solving approach'
    },
    {
      category: 'Collaboration',
      question: 'Tell me about a time when you had to work with a difficult team member. How did you handle it?',
      followUps: ['What was the outcome?', 'What would you do differently?'],
      purpose: 'Assesses interpersonal skills and conflict resolution'
    },
    {
      category: 'Adaptability',
      question: 'Describe a situation where you had to quickly adapt to significant changes in your work environment or project requirements.',
      followUps: ['How did you manage the transition?', 'What helped you adapt successfully?'],
      purpose: 'Evaluates flexibility and change management skills'
    },
    {
      category: 'Achievement',
      question: 'What\'s the most significant accomplishment in your career so far? Why was it meaningful to you?',
      followUps: ['What obstacles did you overcome?', 'How did it impact the organization?'],
      purpose: 'Understanding of candidate values and impact'
    }
  ];

  if (level === 'senior' || level === 'executive') {
    questions.push(
      {
        category: 'Mentorship',
        question: 'Tell me about a time when you mentored or developed someone junior to you.',
        followUps: ['What was your approach?', 'What did you learn from the experience?'],
        purpose: 'Assesses leadership and development capabilities'
      },
      {
        category: 'Strategic Thinking',
        question: 'Describe a time when you identified an opportunity to improve processes or outcomes in your organization.',
        followUps: ['How did you build support for your idea?', 'What was the result?'],
        purpose: 'Evaluates strategic thinking and influence skills'
      }
    );
  }

  return questions;
}

function getCulturalQuestions(role, level, count) {
  return [
    {
      category: 'Values Alignment',
      question: 'What type of work environment brings out your best performance?',
      followUps: ['How do you handle feedback?', 'What motivates you most?'],
      purpose: 'Assesses cultural fit and work style preferences'
    },
    {
      category: 'Team Dynamics',
      question: 'How do you prefer to communicate and collaborate with teammates?',
      followUps: ['Give me an example of effective teamwork', 'How do you handle disagreements?'],
      purpose: 'Understanding of collaboration style and conflict resolution'
    },
    {
      category: 'Growth Mindset',
      question: 'Tell me about a skill you\'ve developed recently. How did you approach learning it?',
      followUps: ['What resources did you use?', 'How do you stay current in your field?'],
      purpose: 'Evaluates learning agility and self-development'
    },
    {
      category: 'Work-Life Integration',
      question: 'How do you maintain high performance while managing competing priorities?',
      followUps: ['What does work-life balance mean to you?', 'How do you handle stress?'],
      purpose: 'Assesses sustainability and stress management'
    },
    {
      category: 'Company Mission',
      question: 'What drew you to apply for this role at our company specifically?',
      followUps: ['How do you see yourself contributing to our mission?', 'What excites you most about this opportunity?'],
      purpose: 'Gauges genuine interest and alignment with company goals'
    }
  ];
}

function getScreeningQuestions(role, level, skills, count) {
  return [
    {
      category: 'Background Verification',
      question: 'Walk me through your career progression and what led you to apply for this role.',
      followUps: ['What are you looking to do differently in your next role?'],
      timeAllocation: '8-10 minutes'
    },
    {
      category: 'Role Understanding',
      question: 'Based on the job description, what aspects of this role are you most excited about?',
      followUps: ['What questions do you have about the role or team?'],
      timeAllocation: '5-7 minutes'
    },
    {
      category: 'Technical Fit',
      question: skills.length > 0 ?
        `Tell me about your experience with ${skills.slice(0, 2).join(' and ')}.` :
        'What technical skills are you most confident in?',
      followUps: ['Can you give me a specific example?', 'How do you stay current with new developments?'],
      timeAllocation: '10-12 minutes'
    },
    {
      category: 'Logistics',
      question: 'Do you have any constraints regarding start date, location, or other logistics we should discuss?',
      followUps: ['What questions do you have about our interview process?'],
      timeAllocation: '3-5 minutes'
    }
  ];
}

function getPanelQuestions(role, level, count) {
  return [
    {
      category: 'Cross-functional Collaboration',
      question: 'Describe a project where you worked across multiple teams or departments. What was your role?',
      followUps: ['How did you handle conflicting priorities?', 'What would you do differently?'],
      panelMember: 'Hiring Manager'
    },
    {
      category: 'Technical Deep Dive',
      question: 'Walk us through a technical decision you made that had significant impact on a project.',
      followUps: ['What alternatives did you consider?', 'How did you measure success?'],
      panelMember: 'Technical Lead'
    },
    {
      category: 'Team Integration',
      question: 'How do you typically onboard to a new team and establish working relationships?',
      followUps: ['What do you need from your team to be successful?'],
      panelMember: 'Team Member'
    },
    {
      category: 'Strategic Contribution',
      question: 'Where do you see this role evolving over the next 1-2 years, and how would you contribute to that evolution?',
      followUps: ['What skills would you want to develop?', 'How would you measure your impact?'],
      panelMember: 'Director/VP'
    }
  ];
}

function getFinalQuestions(role, level, count) {
  return [
    {
      category: 'Decision Making',
      question: 'What factors are most important to you in making this career decision?',
      followUps: ['How does this opportunity align with your career goals?'],
      purpose: 'Understand candidate motivation and decision criteria'
    },
    {
      category: 'Expectations Setting',
      question: 'What would success look like for you in the first 90 days in this role?',
      followUps: ['What support would you need to achieve that?', 'How would you measure your progress?'],
      purpose: 'Align expectations and assess planning skills'
    },
    {
      category: 'Two-way Fit',
      question: 'Based on our conversations, what aspects of this role or company culture resonate most with you?',
      followUps: ['Are there any concerns or reservations you\'d like to discuss?'],
      purpose: 'Ensure mutual fit and address any concerns'
    },
    {
      category: 'Final Assessment',
      question: 'Is there anything else you\'d like me to know about your background or interest in this role?',
      followUps: ['What questions do you have for me?'],
      purpose: 'Allow candidate to fill any gaps and demonstrate interest'
    }
  ];
}

function getRoleSpecificTechnicalQuestions(role, level) {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('product')) {
    return [
      {
        category: 'Product Strategy',
        question: 'How would you approach prioritizing features for a product roadmap?',
        followUps: ['What frameworks do you use?', 'How do you handle conflicting stakeholder needs?']
      }
    ];
  } else if (roleLower.includes('marketing')) {
    return [
      {
        category: 'Marketing Strategy',
        question: 'Walk me through how you would develop a go-to-market strategy for a new product.',
        followUps: ['How would you measure success?', 'What channels would you prioritize?']
      }
    ];
  } else if (roleLower.includes('sales')) {
    return [
      {
        category: 'Sales Process',
        question: 'Describe your approach to qualifying and nurturing prospects through the sales funnel.',
        followUps: ['How do you handle objections?', 'What CRM tools have you used?']
      }
    ];
  }

  return [
    {
      category: 'Domain Knowledge',
      question: `What do you see as the biggest challenges facing professionals in ${role.toLowerCase()} roles today?`,
      followUps: ['How are you preparing to address these challenges?']
    }
  ];
}

function createInterviewStructure(duration, type) {
  if (type === 'screening') {
    return {
      introduction: '5 minutes - Welcome and role overview',
      mainDiscussion: `${duration - 10} minutes - Core screening questions`,
      candidateQuestions: '5 minutes - Candidate questions and next steps'
    };
  }

  return {
    introduction: '5 minutes - Welcome and agenda review',
    warmUp: '5 minutes - Background and context',
    coreQuestions: `${duration - 20} minutes - Main interview questions`,
    candidateQuestions: '10 minutes - Candidate questions and wrap-up'
  };
}

function createEvaluationCriteria(role, level, type) {
  const baseCriteria = {
    communication: 'Clear articulation of thoughts and ideas',
    relevantExperience: 'Alignment of background with role requirements',
    problemSolving: 'Approach to analyzing and solving problems',
    culturalFit: 'Alignment with company values and team dynamics'
  };

  if (type === 'technical') {
    return {
      ...baseCriteria,
      technicalCompetency: 'Depth of technical knowledge and skills',
      systemDesign: level !== 'entry' ? 'Ability to design scalable systems' : 'Understanding of basic system concepts',
      codingAbility: 'Problem-solving approach and code quality'
    };
  }

  if (level === 'senior' || level === 'executive') {
    return {
      ...baseCriteria,
      leadership: 'Ability to guide and influence others',
      strategicThinking: 'Long-term planning and vision',
      mentorship: 'Experience developing others'
    };
  }

  return baseCriteria;
}

function getInterviewTips(type) {
  const commonTips = [
    'Start with easier questions to help candidate feel comfortable',
    'Listen actively and ask follow-up questions based on responses',
    'Take notes on specific examples and outcomes',
    'Allow silence for candidate to think and elaborate'
  ];

  if (type === 'technical') {
    return [
      ...commonTips,
      'Focus on problem-solving process, not just final answers',
      'Ask candidates to explain their thinking out loud',
      'Provide hints if candidate gets stuck, note how they use guidance'
    ];
  }

  if (type === 'behavioral') {
    return [
      ...commonTips,
      'Use STAR method (Situation, Task, Action, Result) to structure responses',
      'Probe for specific examples rather than hypothetical answers',
      'Look for consistent patterns across different stories'
    ];
  }

  return commonTips;
}