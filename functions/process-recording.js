const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const axios = require('axios');
const admin = require('firebase-admin');
const { DAILY_API_BASE, getDailyHeaders } = require('./utils/daily');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.processRecording = onCall(
  { timeoutSeconds: 300 },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Daily API key not configured');
    }

    try {
      const { recordingId, roomName, meetingSessionId } = data || {};
      if (!recordingId) {
        throw new HttpsError('invalid-argument', 'Recording ID is required');
      }

      const headers = getDailyHeaders(apiKey);

      // 1. Get recording details
      logger.info(`Fetching recording ${recordingId}`);
      const recordingResponse = await axios.get(
        `${DAILY_API_BASE}/recordings/${recordingId}`,
        { headers }
      );
      const recording = recordingResponse.data;

      // 2. Get recording access link (download URL with expiry)
      const accessResponse = await axios.get(
        `${DAILY_API_BASE}/recordings/${recordingId}/access-link`,
        { headers }
      );
      const accessLink = accessResponse.data.download_link;
      const accessLinkExpires = accessResponse.data.expires || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

      // 3. Fetch transcript if transcript-webvtt was generated
      let transcript = null;
      try {
        const transcriptResponse = await axios.get(
          `${DAILY_API_BASE}/recordings/${recordingId}/transcript`,
          { headers }
        );
        transcript = transcriptResponse.data;
      } catch (transcriptError) {
        if (transcriptError.response?.status !== 404) {
          logger.warn('Transcript fetch failed:', transcriptError.message);
        }
      }

      // 4. Store results in Firestore
      const db = admin.firestore();
      const analysisData = {
        recording_id: recordingId,
        room_name: roomName || recording.room_name || null,
        meeting_session_id: meetingSessionId || null,
        user_id: auth.uid,
        duration: recording.duration || null,
        max_participants: recording.max_participants || null,
        start_ts: recording.start_ts || null,
        status: recording.status || null,
        access_link: accessLink || null,
        access_link_expires: accessLinkExpires,
        transcript: transcript || null,
        processed_at: admin.firestore.Timestamp.now(),
        created_at: admin.firestore.Timestamp.now(),
      };

      await db.collection('recording_analyses').doc(recordingId).set(analysisData, { merge: true });

      logger.info(`Recording ${recordingId} processed successfully`);

      // Build transcript text for backward compatibility (analysis field)
      const transcriptText = transcript
        ? (typeof transcript === 'string' ? transcript : JSON.stringify(transcript))
        : '';

      return {
        success: true,
        recordingId,
        duration: recording.duration,
        accessLink,
        hasTranscript: !!transcript,
        status: recording.status,
        analysis: transcriptText,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('processRecording error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new HttpsError('not-found', 'Recording not found');
      }

      throw new HttpsError('internal', error.response?.data?.info || error.message || 'Failed to process recording');
    }
  }
);
