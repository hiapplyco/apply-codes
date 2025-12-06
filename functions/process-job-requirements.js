const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.processJobRequirements = onCall(
  {
    secrets: [geminiApiKey]
  },
  async (request) => {
    console.log('Process job requirements function called');

    const { data, auth } = request;
    const { content, searchType, companyName, userId, source } = data;

    // Validate required fields
    if (!content) {
      throw new HttpsError(
        'invalid-argument',
        'Job requirements content is required'
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

      // Generate boolean search string
      const prompt = `You are an expert recruiter creating LinkedIn boolean search strings.

JOB REQUIREMENTS:
${content}

${companyName ? `Company: ${companyName}` : ''}

Create a comprehensive LinkedIn boolean search string based on these requirements.

Focus on:
1. Job titles (current and previous variations)
2. Required skills and technologies
3. Industry/domain experience
4. Education if specified
5. Location if mentioned

Use proper boolean operators:
- OR for alternatives: (Developer OR Engineer)
- AND to require multiple criteria
- NOT to exclude terms
- Quotation marks for exact phrases

Return ONLY the boolean search string, no explanations or formatting.`;

      console.log('Generating boolean search for job requirements');
      const result = await model.generateContent(prompt);
      const searchString = result.response.text().trim();

      console.log('Generated search string:', searchString);

      if (!searchString) {
        throw new Error('Failed to generate boolean search string');
      }

      // Store in Firestore if userId is provided
      let jobId = null;
      // Use userId from data or auth uid
      const effectiveUserId = userId || (auth && auth.uid);

      if (effectiveUserId) {
        try {
          const db = admin.firestore();
          const jobDoc = await db.collection('jobs').add({
            user_id: effectiveUserId,
            job_requirements: content,
            generated_search_string: searchString,
            company_name: companyName,
            source: source || 'default',
            search_type: searchType || 'standard',
            created_at: admin.firestore.Timestamp.now()
          });
          jobId = jobDoc.id;
          console.log('Job requirements saved with ID:', jobId);
        } catch (dbError) {
          console.error('Error saving to Firestore:', dbError);
          // Don't fail the main operation
        }
      }

      // Handle special workflows for clarvida source
      let workflowResults = null;
      if (source === 'clarvida') {
        // Simplified workflow for Clarvida
        workflowResults = {
          status: 'initiated',
          message: 'Clarvida workflow initiated for candidate sourcing',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        searchString: searchString,
        jobId: jobId,
        workflowResults: workflowResults,
        usingFirebase: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in process-job-requirements function:', error);

      if (error.message?.includes('API key')) {
        throw new HttpsError(
          'failed-precondition',
          'API configuration error. Please check server configuration.'
        );
      }

      throw new HttpsError(
        'internal',
        error.message || 'Failed to process job requirements',
        {
          error: error.message,
          content: content?.substring(0, 100)
        }
      );
    }
  }
);
