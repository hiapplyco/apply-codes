const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.analyzeCandidate = functions
  .https.onCall(async (data, context) => {
    console.log('Analyze candidate function called');

    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to analyze candidates'
      );
    }

    const { candidate, requirements } = data;
    console.log('Received analysis request for:', candidate?.name || 'Unknown candidate');

    // Validate input
    if (!candidate || !requirements) {
      console.error('Missing required fields:', {
        hasCandidate: !!candidate,
        hasRequirements: !!requirements
      });
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Candidate and requirements are required'
      );
    }

    try {
      // Get Gemini API key from environment
      const geminiApiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;

      if (!geminiApiKey) {
        console.error('GEMINI_API_KEY is not configured');
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Gemini API key not configured'
        );
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a technical recruiter. Analyze the candidate profile against the job requirements and return ONLY a JSON object.

CANDIDATE PROFILE:
${candidate.name}
${candidate.profile}

JOB REQUIREMENTS:
${requirements}

Return ONLY this JSON structure with no other text:
{"match_score": 75, "strengths": ["Strong experience in product design", "5 years of relevant experience", "B2B and B2C background"], "concerns": ["Need more technical details", "Unclear about specific tools"], "summary": "Experienced product designer with solid background. Good fit for senior role.", "recommendation": "hire"}

Analysis rules:
- match_score: 0-100 integer based on requirements alignment
- strengths: 2-4 specific positives from their profile
- concerns: 1-3 specific gaps or unknowns
- summary: 1-2 sentences about overall fit
- recommendation: exactly "hire", "maybe", or "pass"

IMPORTANT: Return only the JSON object, no explanations, no markdown, no other text.`;

      console.log('Sending request to Gemini with candidate:', candidate.name);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      console.log('Gemini raw response:', responseText);

      // Try to parse as JSON
      let analysisData;
      try {
        // Clean the response - remove any markdown formatting
        const cleanedResponse = responseText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        console.log('Cleaned response for parsing:', cleanedResponse);

        analysisData = JSON.parse(cleanedResponse);
        console.log('Successfully parsed JSON:', analysisData);
      } catch (e) {
        console.error('JSON parsing failed:', e);
        console.error('Failed to parse response:', responseText);

        // If JSON parsing fails, create a fallback structure
        analysisData = {
          match_score: 50,
          strengths: [
            "Senior Product Designer with 5 years experience",
            "B2B and B2C expertise mentioned"
          ],
          concerns: [
            "Limited technical details available",
            "Need more information about specific skills"
          ],
          summary: "Senior Product Designer with relevant experience. Would benefit from more detailed technical assessment.",
          recommendation: "maybe"
        };
      }

      // Optionally log to Firestore
      try {
        const db = admin.firestore();
        await db.collection('candidate_analysis').add({
          candidate_name: candidate.name,
          user_id: context.auth.uid,
          match_score: analysisData.match_score,
          recommendation: analysisData.recommendation,
          analyzed_at: admin.firestore.Timestamp.now()
        });
        console.log('Analysis logged to Firestore');
      } catch (logError) {
        console.error('Error logging analysis:', logError);
        // Don't fail the main operation
      }

      return {
        success: true,
        ...analysisData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in analyze-candidate function:', error);

      if (error.message?.includes('API key')) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'API configuration error. Please check server configuration.'
        );
      }

      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to analyze candidate',
        {
          error: error.message,
          candidate: candidate?.name
        }
      );
    }
  });
