const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const axios = require('axios');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSendGridClient } = require('./utils/sendgrid');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.sendOutreachEmail = onCall(
  {
    secrets: [geminiApiKey]
  },
  async (request) => {
    console.log('Send outreach email function called');

    const { data, auth } = request;
    const { projectId, candidateProfileUrl, userCustomText } = data;

    // Validate input
    if (!projectId || !candidateProfileUrl || !userCustomText?.trim()) {
      throw new HttpsError(
        'invalid-argument',
        'Project ID, candidate profile URL, and custom text are required'
      );
    }

    console.log(`Processing outreach email for project: ${projectId}`);

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
      const emailContent = await generateEmailContent(projectData, candidateData, userCustomText, geminiApiKey.value());

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
      console.error('Error in send-outreach-email:', error);

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
    console.error('Error fetching project:', error);
    throw new HttpsError(
      'internal',
      `Failed to fetch project details: ${error.message}`
    );
  }
}

async function enrichCandidateProfile(profileUrl) {
  // Note: Nymeria API key should ideally also be in Secret Manager
  const nymeriaApiKey = process.env.NYMERIA_API_KEY;

  if (!nymeriaApiKey) {
    throw new HttpsError(
      'failed-precondition',
      'Missing Nymeria API key configuration'
    );
  }

  const nymeriaUrl = `https://www.nymeria.io/api/v4/person/enrich?profile=${encodeURIComponent(profileUrl)}`;

  try {
    const response = await axios.get(nymeriaUrl, {
      headers: {
        'X-Api-Key': nymeriaApiKey
      }
    });

    const enrichedData = response.data;

    // Extract key information
    return {
      email: enrichedData.emails?.[0]?.email || null,
      name: enrichedData.name?.full_name || enrichedData.name?.first_name || null,
      currentRole: enrichedData.experiences?.[0]?.title || null,
      currentCompany: enrichedData.experiences?.[0]?.company?.name || null,
      location: enrichedData.location?.full_location || null,
      skills: enrichedData.skills?.map(skill => skill.name).slice(0, 5) || [],
      experienceSummary: enrichedData.experiences?.slice(0, 3).map(exp =>
        `${exp.title} at ${exp.company?.name}`
      ).join(', ') || null
    };

  } catch (error) {
    if (error.response?.status === 404) {
      throw new HttpsError(
        'not-found',
        'Candidate profile not found in contact database'
      );
    }

    throw new HttpsError(
      'internal',
      `Failed to enrich candidate profile: ${error.message}`
    );
  }
}

async function generateEmailContent(projectData, candidateData, userCustomText, apiKey) {
  if (!apiKey) {
    throw new HttpsError(
      'failed-precondition',
      'Missing Gemini API key configuration'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    }
  });

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
    console.warn('Failed to parse Gemini response as JSON, using fallback:', error);

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
    console.error('SendGrid error:', error);

    if (error.response) {
      console.error('SendGrid response error:', error.response.body);
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

    console.log('Outreach activity logged successfully');
  } catch (error) {
    console.error('Error logging outreach activity:', error);
    // Don't throw error to avoid failing the main operation
  }
}
