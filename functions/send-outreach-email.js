const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const admin = require('firebase-admin');

const { getModel } = require('./utils/gemini');
const { getSendGridClient } = require('./utils/sendgrid');
const { enrichContact } = require('./utils/enrichment-service');



// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.sendOutreachEmail = onCall(
  {
    
  },
  async (request) => {
    logger.info('Send outreach email function called');

    const { data, auth } = request;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required to send outreach emails');
    }
    const { projectId, candidateProfileUrl, userCustomText } = data;

    // Validate input
    if (!projectId || !candidateProfileUrl || !userCustomText?.trim()) {
      throw new HttpsError(
        'invalid-argument',
        'Project ID, candidate profile URL, and custom text are required'
      );
    }

    logger.info(`Processing outreach email for project: ${projectId}`);

    try {
      // Step 1: Fetch project details
      const projectData = await fetchProjectDetails(projectId);

      // Step 2: Enrich candidate profile using Nymeria
      const candidateData = await enrichCandidateProfile(candidateProfileUrl);

      if (!candidateData?.email) {
        throw new HttpsError(
          'not-found',
          'Unable to find candidate email address'
        );
      }

      // Step 3: Generate email content using Gemini
      const emailContent = await generateEmailContent(projectData, candidateData, userCustomText, process.env.GEMINI_API_KEY);

      // Step 4: Send email via SendGrid
      const emailResult = await sendEmail({
        to: candidateData.email,
        subject: emailContent.subject,
        body: emailContent.body,
        recipientName: candidateData.name || 'there'
      });

      // Step 5: Log the outreach activity
      await logOutreachActivity(projectId, candidateProfileUrl, candidateData.email, 'sent', auth);

      return {
        success: true,
        message: 'Email sent successfully',
        recipient: candidateData.email,
        subject: emailContent.subject,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error in send-outreach-email:', error);

      if (error.code) {
        // Already a Firebase HttpsError
        throw error;
      }

      throw new HttpsError(
        'internal',
        error.message || 'Failed to send outreach email',
        {
          error: error.message,
          projectId
        }
      );
    }
  }
);

async function fetchProjectDetails(projectId) {
  const db = admin.firestore();

  try {
    const projectDoc = await db.collection('projects').doc(projectId).get();

    if (!projectDoc.exists) {
      throw new HttpsError('not-found', 'Project not found');
    }

    return projectDoc.data();
  } catch (error) {
    logger.error('Error fetching project:', error);
    throw new HttpsError(
      'internal',
      `Failed to fetch project details: ${error.message}`
    );
  }
}

async function enrichCandidateProfile(profileUrl) {
  // Use shared enrichment service (waterfall: Nymeria -> Hunter -> PDL, with cache)
  const result = await enrichContact(
    { profileUrl },
    { userId: null } // No user context in outreach flow
  );

  if (!result.data) {
    throw new HttpsError(
      'not-found',
      'Candidate profile not found in contact database'
    );
  }

  const enrichedData = result.data;

  // Extract key information — normalize across providers
  return {
    email: enrichedData.work_email || enrichedData.emails?.[0]?.email || enrichedData.email || null,
    name: enrichedData.name?.full_name || enrichedData.name?.first_name || enrichedData.full_name || null,
    currentRole: enrichedData.experiences?.[0]?.title || enrichedData.job_title || null,
    currentCompany: enrichedData.experiences?.[0]?.company?.name || enrichedData.job_company_name || null,
    location: enrichedData.location?.full_location || enrichedData.location_name || null,
    skills: enrichedData.skills?.map(skill => typeof skill === 'string' ? skill : skill.name).slice(0, 5) || [],
    experienceSummary: enrichedData.experiences?.slice(0, 3).map(exp =>
      `${exp.title} at ${exp.company?.name || exp.company}`
    ).join(', ') || null
  };
}

async function generateEmailContent(projectData, candidateData, userCustomText, apiKey) {
  const model = getModel('gemini-3.1-pro-preview', {
    temperature: 0.7,
    maxOutputTokens: 1000,
  });

  if (!model) {
    throw new HttpsError(
      'failed-precondition',
      'Missing Gemini API key configuration'
    );
  }

  const prompt = `You are a friendly and professional recruiter writing a personalized outreach email to a potential candidate.

PROJECT DETAILS:
- Project Name: ${projectData.name}
- Description: ${projectData.description || 'Not specified'}

CANDIDATE DETAILS:
- Name: ${candidateData.name || 'Candidate'}
- Current Role: ${candidateData.currentRole || 'Not specified'}
- Current Company: ${candidateData.currentCompany || 'Not specified'}
- Location: ${candidateData.location || 'Not specified'}
- Key Skills: ${candidateData.skills?.join(', ') || 'Not specified'}
- Experience Summary: ${candidateData.experienceSummary || 'Not specified'}

USER'S CUSTOM MESSAGE:
${userCustomText}

REQUIREMENTS:
1. Write a compelling email subject line (under 60 characters)
2. Write a concise, engaging email body (under 200 words)
3. Maintain a professional yet approachable tone
4. Personalize based on the candidate's background
5. Incorporate the user's custom message naturally
6. End with a clear call to action
7. Sign off as "Best regards, Apply Team"

Format your response as JSON with "subject" and "body" fields.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Clean and parse the response
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanedResponse);
  } catch (error) {
    logger.warn('Failed to parse Gemini response as JSON, using fallback:', error);

    // Fallback if JSON parsing fails
    return {
      subject: `Exciting opportunity at ${projectData.name}`,
      body: `Hi ${candidateData.name || 'there'},\n\nI hope this message finds you well. I came across your profile and was impressed by your background in ${candidateData.currentRole} at ${candidateData.currentCompany}.\n\n${userCustomText}\n\nI'd love to discuss this opportunity with you further. Are you available for a brief chat next week?\n\nBest regards,\nApply Team`
    };
  }
}

async function sendEmail({ to, subject, body, recipientName }) {
  const sendgridClient = getSendGridClient({ required: true });

  const msg = {
    to: to,
    from: {
      email: 'hello@hiapply.co',
      name: 'Apply Team'
    },
    subject: subject,
    text: body,
    html: body.replace(/\n/g, '<br>')
  };

  try {
    await sendgridClient.send(msg);
    return { success: true };
  } catch (error) {
    logger.error('SendGrid error:', error);

    if (error.response) {
      logger.error('SendGrid response error:', error.response.body);
    }

    throw new HttpsError(
      'internal',
      `Failed to send email: ${error.message}`
    );
  }
}

async function logOutreachActivity(projectId, profileUrl, email, status, auth) {
  try {
    const db = admin.firestore();

    await db.collection('outreach_logs').add({
      agent_type: 'outreach',
      project_id: projectId,
      profile_url: profileUrl,
      recipient_email: email,
      status: status,
      user_id: auth?.uid || null,
      sent_at: admin.firestore.Timestamp.now(),
      created_at: admin.firestore.Timestamp.now()
    });

    logger.info('Outreach activity logged successfully');
  } catch (error) {
    logger.error('Error logging outreach activity:', error);
    // Don't throw error to avoid failing the main operation
  }
}
