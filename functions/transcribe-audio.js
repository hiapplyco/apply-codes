const functions = require('firebase-functions');
const axios = require('axios');
const FormData = require('form-data');

// Get OpenAI API key from environment
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';

exports.transcribeAudio = functions.https.onCall(async (data, context) => {
  console.log('Transcribing audio with OpenAI Whisper');

  // Check for API key
  if (!openaiApiKey) {
    console.error('Missing OPENAI_API_KEY environment variable');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'OpenAI API key not configured'
    );
  }

  const { audio } = data;

  if (!audio) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'No audio data provided'
    );
  }

  try {
    // Convert base64 audio to Buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    console.log('Audio buffer size:', audioBuffer.length);

    // Create form data
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    formData.append('model', 'whisper-1');

    // Send to OpenAI Whisper API
    console.log('Sending to OpenAI Whisper API...');
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${openaiApiKey}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('Transcription successful');
    return {
      success: true,
      text: response.data.text
    };

  } catch (error) {
    console.error('Error transcribing audio:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Invalid OpenAI API key'
      );
    } else if (error.response?.status === 429) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'OpenAI API rate limit exceeded'
      );
    } else if (error.response?.status === 400) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        error.response.data?.error?.message || 'Invalid audio format'
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to transcribe audio'
    );
  }
});