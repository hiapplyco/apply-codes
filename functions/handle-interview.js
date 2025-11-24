const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Initialize Supabase client for potential future integrations
const initSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    return createClient(supabaseUrl, supabaseKey);
  }
  return null;
};

// Mock interview response when AI service is unavailable
const getDefaultResponse = (message) => {
  const defaultResponses = [
    "Thank you for that response. Could you tell me about a challenging situation you've faced at work and how you handled it?",
    "That's interesting. How would you describe your ideal work environment?",
    "I appreciate your insights. Can you walk me through your approach to problem-solving?",
    "Great. Now, tell me about a time when you had to adapt to a significant change at work.",
    "Could you elaborate on your experience with team collaboration?",
    "Can you describe a project you're particularly proud of and why?",
    "How do you handle tight deadlines and competing priorities?",
    "What motivates you most in your work?",
    "Tell me about a time when you had to learn something new quickly.",
    "How do you approach working with difficult stakeholders or team members?",
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// Enhanced interview response generator with context awareness
const generateInterviewResponse = async (message, context = [], interviewType = 'behavioral') => {
  try {
    // TODO: Integrate with Gemini AI for more sophisticated interview responses
    // For now, use enhanced default responses based on interview type and context

    const responsesByType = {
      behavioral: [
        "Thank you for sharing that. Can you walk me through a specific example of when you demonstrated leadership?",
        "That's valuable insight. How do you handle situations where you disagree with a team member's approach?",
        "I appreciate that perspective. Tell me about a time when you had to deliver difficult feedback.",
        "Interesting. Can you describe a situation where you had to adapt your communication style?",
      ],
      technical: [
        "That's a good foundation. Can you explain how you would approach debugging a complex system issue?",
        "Thanks for that explanation. How do you stay current with new technologies in your field?",
        "I see. Can you walk me through your process for code review and ensuring quality?",
        "Good point. How would you design a scalable solution for handling high traffic?",
      ],
      cultural: [
        "Thank you for that insight. How do you contribute to building an inclusive team environment?",
        "That resonates well. What does work-life balance mean to you?",
        "I appreciate your honesty. How do you handle stress and maintain productivity?",
        "Excellent. What kind of company culture do you thrive in?",
      ],
      screening: [
        "Thank you for that background. What initially attracted you to this role?",
        "That's helpful context. Can you tell me about your salary expectations?",
        "I understand. How soon would you be available to start if we move forward?",
        "Good to know. Do you have any questions about the role or our company?",
      ]
    };

    const responses = responsesByType[interviewType] || responsesByType.behavioral;
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

    // Add context-aware follow-ups if previous context exists
    if (context.length > 3) {
      const followUps = [
        " Building on what we've discussed, what would you say is your greatest professional strength?",
        " Considering our conversation so far, how do you see yourself contributing to our team?",
        " Given what you've shared, what questions do you have about the role or our expectations?",
      ];
      const followUp = followUps[Math.floor(Math.random() * followUps.length)];
      return selectedResponse + followUp;
    }

    return selectedResponse;
  } catch (error) {
    console.error('Error generating interview response:', error);
    return getDefaultResponse(message);
  }
};

// Interview feedback and scoring system
const processInterviewFeedback = async (interviewData) => {
  try {
    const { responses, interviewType, candidateName, interviewerNotes } = interviewData;

    // TODO: Implement AI-powered scoring system
    // For now, return structured feedback format

    const feedbackStructure = {
      candidateName,
      interviewType,
      overallScore: Math.floor(Math.random() * 40) + 60, // Mock score 60-100
      categories: {
        communication: Math.floor(Math.random() * 30) + 70,
        technicalSkills: Math.floor(Math.random() * 30) + 70,
        problemSolving: Math.floor(Math.random() * 30) + 70,
        culturalFit: Math.floor(Math.random() * 30) + 70,
      },
      strengths: [
        "Strong communication skills",
        "Good problem-solving approach",
        "Relevant experience"
      ],
      concerns: [
        "Need more technical depth in some areas",
        "Could provide more specific examples"
      ],
      recommendation: "move_forward", // move_forward, maybe, pass
      notes: interviewerNotes || "No additional notes provided",
      processedAt: new Date().toISOString()
    };

    return feedbackStructure;
  } catch (error) {
    console.error('Error processing interview feedback:', error);
    throw error;
  }
};

// Interview scheduling coordination
const handleInterviewScheduling = async (schedulingData) => {
  try {
    const { candidateId, interviewType, proposedTimes, interviewers } = schedulingData;

    // TODO: Integrate with calendar systems (Google Calendar, Outlook, etc.)
    // For now, return mock scheduling response

    const schedulingResponse = {
      status: 'scheduled',
      interviewId: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scheduledTime: proposedTimes[0], // Use first proposed time
      interviewType,
      candidateId,
      interviewers: interviewers || ['hiring_manager'],
      meetingLink: `https://meet.google.com/mock-${Math.random().toString(36).substr(2, 9)}`,
      calendarInviteSent: true,
      reminderScheduled: true,
      createdAt: new Date().toISOString()
    };

    return schedulingResponse;
  } catch (error) {
    console.error('Error handling interview scheduling:', error);
    throw error;
  }
};

// Main Firebase Cloud Function
exports.handleInterview = functions.https.onRequest(async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  res.set(corsHeaders);

  try {
    const {
      action = 'chat',
      message,
      context = [],
      interviewType = 'behavioral',
      interviewData,
      schedulingData
    } = req.body;

    console.log('Interview function called with action:', action);

    // Route based on action type
    switch (action) {
      case 'chat':
        // Handle interview conversation
        if (!message || typeof message !== 'string') {
          res.status(400).json({
            error: 'Invalid input: message is required and must be a string',
            success: false
          });
          return;
        }

        console.log('Interview message received:', message);
        console.log('Context:', context);
        console.log('Interview type:', interviewType);

        try {
          const response = await generateInterviewResponse(message, context, interviewType);

          // Optional: Save conversation to database
          const supabase = initSupabaseClient();
          if (supabase) {
            try {
              await supabase
                .from('interview_conversations')
                .insert({
                  message,
                  response,
                  interview_type: interviewType,
                  context: context,
                  created_at: new Date().toISOString()
                });
            } catch (dbError) {
              console.warn('Failed to save conversation to database:', dbError);
              // Don't fail the request if database save fails
            }
          }

          res.status(200).json({
            response,
            success: true,
            interviewType,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('Error in interview chat processing:', error);

          // Return a fallback response rather than an error
          const fallbackResponse = getDefaultResponse(message);

          res.status(200).json({
            response: fallbackResponse,
            success: true,
            note: "Using fallback response due to processing issue",
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'feedback':
        // Handle interview feedback and scoring
        if (!interviewData) {
          res.status(400).json({
            error: 'Interview data is required for feedback processing',
            success: false
          });
          return;
        }

        try {
          const feedbackResult = await processInterviewFeedback(interviewData);

          res.status(200).json({
            success: true,
            feedback: feedbackResult,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('Error processing interview feedback:', error);
          res.status(500).json({
            error: 'Failed to process interview feedback',
            success: false
          });
        }
        break;

      case 'schedule':
        // Handle interview scheduling
        if (!schedulingData) {
          res.status(400).json({
            error: 'Scheduling data is required for interview scheduling',
            success: false
          });
          return;
        }

        try {
          const schedulingResult = await handleInterviewScheduling(schedulingData);

          res.status(200).json({
            success: true,
            scheduling: schedulingResult,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('Error handling interview scheduling:', error);
          res.status(500).json({
            error: 'Failed to schedule interview',
            success: false
          });
        }
        break;

      default:
        res.status(400).json({
          error: `Unknown action: ${action}. Supported actions: chat, feedback, schedule`,
          success: false
        });
    }

  } catch (error) {
    console.error('Error handling interview request:', error);

    res.status(500).json({
      error: 'Internal server error',
      success: false,
      timestamp: new Date().toISOString()
    });
  }
});