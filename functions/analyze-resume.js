const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// Removed Supabase dependency - now using Firebase Storage and Firestore
const multer = require('multer');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.analyzeResume = functions.https.onRequest(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set(corsHeaders);
      res.status(200).send();
      return;
    }

    // Set CORS headers for all responses
    res.set(corsHeaders);

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Parse multipart form data
      await new Promise((resolve, reject) => {
        upload.fields([
          { name: 'file', maxCount: 1 },
          { name: 'jobId', maxCount: 1 },
          { name: 'userId', maxCount: 1 }
        ])(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const file = req.files?.file?.[0];
      const jobId = req.body?.jobId;
      const userId = req.body?.userId;

      if (!file || !jobId || !userId) {
        res.status(400).json({
          error: 'Missing required fields: file, jobId, and userId are required'
        });
        return;
      }

      console.log('Analyzing resume for user:', userId, 'job:', jobId);

      // Initialize Firebase services
      const db = admin.firestore();
      const bucket = admin.storage().bucket();

      // Get job description from Firestore
      const jobDoc = await db.collection('jobs').doc(jobId).get();
      
      if (!jobDoc.exists) {
        throw new Error('Job description not found');
      }
      
      const jobData = jobDoc.data();
      if (!jobData?.content) {
        throw new Error('Job description content not found');
      }

      // Upload file to Firebase Storage
      const fileExt = file.originalname.split('.').pop() || 'txt';
      const filePath = `resumes/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const fileRef = bucket.file(filePath);
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype
        }
      });

      console.log('File uploaded successfully:', filePath);

      // Initialize Gemini
      const geminiApiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;

      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Convert resume to text and clean it
      let resumeText = file.buffer.toString('utf-8');

      // Clean the text by removing null bytes and invalid characters
      resumeText = resumeText
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Remove specific Unicode replacement characters
        .replace(/[^\x20-\x7E\x0A\x0D\u00A0-\u024F\u1E00-\u1EFF]/g, '') // Keep basic Latin, Latin-1 Supplement, and Latin Extended
        .trim();

      console.log('Resume text length after cleaning:', resumeText.length);

      // Analyze with Gemini
      const prompt = `You are a resume analyzer. Compare this resume against the job description and return a JSON object (do not include markdown backticks) with the following fields:
- similarityScore (0-100)
- parsedResume (extracted skills, experience, education)
- parsedJob (required skills, qualifications, responsibilities)
- matchingKeywords (array of matching terms)
- matchingEntities (array of matching company names, technologies, etc.)

Job Description:
${jobData.content}

Resume:
${resumeText}

Return ONLY the JSON object, no other text.
`;

      console.log('Sending analysis request to Gemini');
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Remove any markdown formatting if present
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();

      console.log('Received response from Gemini, parsing JSON');

      let analysis;
      try {
        analysis = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        console.error('Raw response:', responseText);

        // Fallback analysis structure
        analysis = {
          similarityScore: 50,
          parsedResume: {
            skills: ['Unable to parse - manual review required'],
            experience: 'Unable to parse - manual review required',
            education: 'Unable to parse - manual review required'
          },
          parsedJob: {
            requiredSkills: ['Unable to parse - manual review required'],
            qualifications: 'Unable to parse - manual review required',
            responsibilities: 'Unable to parse - manual review required'
          },
          matchingKeywords: [],
          matchingEntities: []
        };
      }

      // Store the analysis results in Firestore
      await db.collection('resumeMatches').add({
        jobId: jobId,
        userId: userId,
        resumeFilePath: filePath,
        resumeText: resumeText,
        similarityScore: analysis.similarityScore,
        parsedResume: analysis.parsedResume,
        parsedJob: analysis.parsedJob,
        matchingKeywords: analysis.matchingKeywords,
        matchingEntities: analysis.matchingEntities,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('Analysis completed successfully for user:', userId);

      // Log to Firestore for additional tracking
      try {
        const db = admin.firestore();
        await db.collection('resume_analyses').add({
          user_id: userId,
          job_id: jobId,
          file_path: filePath,
          similarity_score: analysis.similarityScore,
          analyzed_at: admin.firestore.Timestamp.now(),
          success: true
        });
      } catch (logError) {
        console.error('Error logging to Firestore:', logError);
        // Don't fail the main operation
      }

      res.status(200).json({
        success: true,
        filePath,
        resumeText,
        ...analysis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error in analyze-resume function:', error);

      // Log error to Firestore
      try {
        const db = admin.firestore();
        await db.collection('resume_analyses').add({
          user_id: req.body?.userId || 'unknown',
          job_id: req.body?.jobId || 'unknown',
          error: error.message,
          analyzed_at: admin.firestore.Timestamp.now(),
          success: false
        });
      } catch (logError) {
        console.error('Error logging error to Firestore:', logError);
      }

      res.status(500).json({
        error: error.message || 'Failed to analyze resume',
        timestamp: new Date().toISOString()
      });
    }
  });
