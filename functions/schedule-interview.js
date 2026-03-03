const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const admin = require('firebase-admin');
const { google } = require('googleapis');
const { getSendGridClient } = require('./utils/sendgrid');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Helper function to validate timezone
const isValidTimezone = (timezone) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

// Helper function to get timezone offset
const getTimezoneOffset = (timezone) => {
  const now = new Date();
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
  return (target.getTime() - utc.getTime()) / 60000;
};

// Helper function to create Google Calendar OAuth2 client
const createGoogleCalendarClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Helper function to create meeting link based on platform
const createMeetingLink = async (platform, meetingDetails) => {
  switch (platform) {
    case 'google-meet':
      // Google Meet link is automatically generated with Google Calendar events
      return null; // Will be added by Google Calendar

    case 'zoom':
      // Integration with Zoom API would go here
      return 'https://zoom.us/j/placeholder';

    case 'teams':
      // Integration with Microsoft Teams API would go here
      return 'https://teams.microsoft.com/l/meetup-join/placeholder';

    default:
      return null;
  }
};

// Helper function to create calendar event
const createCalendarEvent = async (calendarService, eventDetails) => {
  const event = {
    summary: eventDetails.title,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.startTime,
      timeZone: eventDetails.timezone,
    },
    end: {
      dateTime: eventDetails.endTime,
      timeZone: eventDetails.timezone,
    },
    attendees: eventDetails.attendees.map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 15 }, // 15 minutes before
      ],
    },
    conferenceData: eventDetails.meetingPlatform === 'google-meet' ? {
      createRequest: {
        requestId: `interview-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    } : undefined
  };

  const response = await calendarService.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: eventDetails.meetingPlatform === 'google-meet' ? 1 : 0,
    sendUpdates: 'all'
  });

  return response.data;
};

// Helper function to send invitation email
const sendInvitationEmail = async (emailDetails) => {
  const { to, candidateName, interviewerName, scheduledTime, meetingLink, timezone, interviewType } = emailDetails;

  const msg = {
    to,
    from: process.env.FROM_EMAIL || 'noreply@apply.codes',
    subject: `Interview Scheduled - ${interviewType} Interview`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Interview Scheduled</h2>
        <p>Dear ${candidateName},</p>

        <p>Your interview has been successfully scheduled with the following details:</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Interview Details</h3>
          <p><strong>Type:</strong> ${interviewType}</p>
          <p><strong>Interviewer:</strong> ${interviewerName}</p>
          <p><strong>Date & Time:</strong> ${scheduledTime} (${timezone})</p>
          ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
        </div>

        <p>Please make sure to:</p>
        <ul>
          <li>Join the meeting 5 minutes early</li>
          <li>Test your camera and microphone beforehand</li>
          <li>Have a copy of your resume ready</li>
          <li>Prepare any questions you may have about the role</li>
        </ul>

        <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>

        <p>Best regards,<br>The Hiring Team</p>
      </div>
    `
  };

  const sendgridClient = getSendGridClient({ required: true });
  return await sendgridClient.send(msg);
};

exports.scheduleInterview = onCall({}, async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  try {
    // Parse request data
    const {
      candidateId,
      candidateEmail,
      candidateName,
      interviewerId,
      interviewerEmail,
      interviewerName,
      interviewType = 'Technical Interview',
      scheduledDateTime,
      duration = 60, // in minutes
      timezone = 'UTC',
      meetingPlatform = 'google-meet',
      calendarIntegration = true,
      additionalNotes = '',
      interviewerCalendarToken,
      action = 'schedule' // schedule, reschedule, cancel
    } = data;

    // Validate required fields
    if (!candidateEmail || !candidateName || !interviewerEmail || !interviewerName || !scheduledDateTime) {
      throw new HttpsError('invalid-argument', 'Missing required fields: candidateEmail, candidateName, interviewerEmail, interviewerName, scheduledDateTime');
    }

    // Validate timezone
    if (!isValidTimezone(timezone)) {
      throw new HttpsError('invalid-argument', 'Invalid timezone provided');
    }

    // Create interview start and end times
    const startTime = new Date(scheduledDateTime);
    const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));

    // Initialize Firestore
    const db = admin.firestore();

    let interviewDoc;
    let meetingLink = null;
    let calendarEventId = null;

    // Handle different actions
    switch (action) {
      case 'schedule':
        // Create meeting link if needed
        if (meetingPlatform !== 'in-person') {
          meetingLink = await createMeetingLink(meetingPlatform, {
            title: `${interviewType} - ${candidateName}`,
            startTime: startTime.toISOString(),
            duration
          });
        }

        // Create calendar event if integration is enabled
        if (calendarIntegration && interviewerCalendarToken) {
          try {
            const calendarService = createGoogleCalendarClient(interviewerCalendarToken);

            const eventDetails = {
              title: `${interviewType} - ${candidateName}`,
              description: `Interview with ${candidateName} (${candidateEmail})\n\nType: ${interviewType}\nDuration: ${duration} minutes\n\nNotes: ${additionalNotes}`,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              timezone,
              attendees: [candidateEmail, interviewerEmail],
              meetingPlatform
            };

            const calendarEvent = await createCalendarEvent(calendarService, eventDetails);
            calendarEventId = calendarEvent.id;

            // Get meeting link from Google Meet if applicable
            if (meetingPlatform === 'google-meet' && calendarEvent.conferenceData) {
              meetingLink = calendarEvent.conferenceData.entryPoints[0].uri;
            }
          } catch (calendarError) {
            logger.error('Calendar integration error:', calendarError);
            // Continue without calendar integration
          }
        }

        // Store interview details in database
        interviewDoc = await db.collection('interviews').add({
          candidateId,
          candidateEmail,
          candidateName,
          interviewerId,
          interviewerEmail,
          interviewerName,
          interviewType,
          scheduledDateTime: admin.firestore.Timestamp.fromDate(startTime),
          endDateTime: admin.firestore.Timestamp.fromDate(endTime),
          duration,
          timezone,
          meetingPlatform,
          meetingLink,
          calendarEventId,
          additionalNotes,
          status: 'scheduled',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: auth.uid
        });

        // Send invitation email
        try {
          await sendInvitationEmail({
            to: candidateEmail,
            candidateName,
            interviewerName,
            scheduledTime: startTime.toLocaleString('en-US', {
              timeZone: timezone,
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            meetingLink,
            timezone,
            interviewType
          });
        } catch (emailError) {
          logger.error('Email sending error:', emailError);
          // Continue even if email fails
        }

        return {
          success: true,
          interviewId: interviewDoc.id,
          meetingLink,
          calendarEventId,
          message: 'Interview scheduled successfully'
        };

      case 'reschedule': {
        const { interviewId, newScheduledDateTime } = data;

        if (!interviewId || !newScheduledDateTime) {
          throw new HttpsError('invalid-argument', 'interviewId and newScheduledDateTime required for rescheduling');
        }

        const newStartTime = new Date(newScheduledDateTime);
        const newEndTime = new Date(newStartTime.getTime() + (duration * 60 * 1000));

        // Update interview in database
        await db.collection('interviews').doc(interviewId).update({
          scheduledDateTime: admin.firestore.Timestamp.fromDate(newStartTime),
          endDateTime: admin.firestore.Timestamp.fromDate(newEndTime),
          status: 'rescheduled',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: auth.uid
        });

        return {
          success: true,
          message: 'Interview rescheduled successfully'
        };
      }

      case 'cancel': {
        const { interviewId: cancelInterviewId, reason = 'No reason provided' } = data;

        if (!cancelInterviewId) {
          throw new HttpsError('invalid-argument', 'interviewId required for cancellation');
        }

        // Update interview status in database
        await db.collection('interviews').doc(cancelInterviewId).update({
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          cancelledBy: auth.uid
        });

        return {
          success: true,
          message: 'Interview cancelled successfully'
        };
      }

      default:
        throw new HttpsError('invalid-argument', 'Invalid action. Must be one of: schedule, reschedule, cancel');
    }

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('Error in schedule-interview function:', error);
    throw new HttpsError('internal', error.message || 'Internal server error');
  }
});
