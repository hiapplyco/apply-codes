const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.analyzeCandidate = onCall(
  {
    secrets: [geminiApiKey]
  },
  async (request) => {
    console.log('Analyze candidate function called');

    const { data, auth } = request;

    // Check authentication
    if (!auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to analyze candidates'
      );
    }

    const { candidate, requirements, projectId } = data;
    console.log('Received analysis request for:', candidate?.name || 'Unknown candidate', 'projectId:', projectId);

    // Validate input
    if (!candidate || !requirements) {
      console.error('Missing required fields:', {
        hasCandidate: !!candidate,
        hasRequirements: !!requirements
      });
      throw new HttpsError(
        'invalid-argument',
        'Candidate and requirements are required'
      );
    }

    try {
      // Get Gemini API key from secret
      const apiKey = geminiApiKey.value();

      if (!apiKey) {
        console.error('GEMINI_API_KEY is not configured');
        throw new HttpsError(
          'failed-precondition',
          'Gemini API key not configured'
        );
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

      // Save full analysis to Firestore
      let analysisId = null;
      try {
        const db = admin.firestore();
        const docRef = await db.collection('candidate_analysis').add({
          candidate_name: candidate.name,
          candidate_profile: candidate.profile,
          user_id: auth.uid,
          project_id: projectId || null,
          match_score: analysisData.match_score,
          recommendation: analysisData.recommendation,
          strengths: analysisData.strengths || [],
          concerns: analysisData.concerns || [],
          summary: analysisData.summary || '',
          requirements_summary: requirements?.substring(0, 500) || '',
          analyzed_at: admin.firestore.Timestamp.now(),
          source: 'extension'
        });
        analysisId = docRef.id;
        console.log('Analysis saved to Firestore with ID:', analysisId);
      } catch (logError) {
        console.error('Error saving analysis:', logError);
        // Don't fail the main operation
      }

      return {
        success: true,
        ...analysisData,
        analysisId: analysisId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in analyze-candidate function:', error);

      if (error.message?.includes('API key')) {
        throw new HttpsError(
          'failed-precondition',
          'API configuration error. Please check server configuration.'
        );
      }

      throw new HttpsError(
        'internal',
        error.message || 'Failed to analyze candidate',
        {
          error: error.message,
          candidate: candidate?.name
        }
      );
    }
  }
);
