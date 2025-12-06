const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const axios = require('axios');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

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

exports.processTextExtraction = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: '1GiB',
    secrets: [geminiApiKey]
  },
  async (req, res) => {
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
        upload.single('file')(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const file = req.file;
      const userId = req.body?.userId;
      const extractionOptions = {
        preserveFormatting: req.body?.preserveFormatting !== 'false',
        extractTables: req.body?.extractTables !== 'false',
        ocrEnabled: req.body?.ocrEnabled !== 'false',
        language: req.body?.language || 'en',
        outputFormat: req.body?.outputFormat || 'structured'
      };

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      console.log('Processing file:', file.originalname, 'of type:', file.mimetype, 'size:', file.size);

      // Validate file size
      if (file.size > 20 * 1024 * 1024) {
        res.status(400).json({
          success: false,
          error: 'File size exceeds 20MB limit. Please use a smaller file.'
        });
        return;
      }

      // Initialize Gemini
      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      // Process based on file type
      let extractionResult;

      if (file.mimetype === 'text/plain') {
        console.log('Processing plain text file directly');
        const text = file.buffer.toString('utf-8');
        extractionResult = {
          text: text,
          metadata: {
            originalFormat: 'text/plain',
            encoding: 'utf-8',
            characterCount: text.length,
            wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
            lineCount: text.split('\n').length
          }
        };
      } else {
        // Use Gemini for all other supported types
        console.log('Processing document with Gemini...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Extract all text from this document.
        Options:
        - Preserve formatting: ${extractionOptions.preserveFormatting}
        - Extract tables: ${extractionOptions.extractTables}
        - Output format: ${extractionOptions.outputFormat}
        
        Return the extracted text clearly.`;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: file.buffer.toString('base64'),
              mimeType: file.mimetype
            }
          }
        ]);

        const text = result.response.text();
        extractionResult = {
          text: text,
          metadata: {
            originalFormat: file.mimetype,
            extractionMethod: 'gemini-1.5-flash'
          }
        };
      }

      // Clean and format extracted text
      const cleanedText = cleanAndFormatText(extractionResult.text, extractionOptions);

      // Prepare response with structured data
      const response = {
        success: true,
        data: {
          text: cleanedText,
          originalText: extractionResult.text,
          metadata: {
            ...extractionResult.metadata,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            processingTimestamp: new Date().toISOString()
          }
        },
        message: 'Text extraction completed successfully'
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('Error processing text extraction:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process file'
      });
    }
  }
);

// Text cleaning and formatting helper
function cleanAndFormatText(text, options) {
  if (!text) return '';

  let cleaned = text;

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Reduce multiple line breaks
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Normalize spaces
  cleaned = cleaned.trim();

  // Handle different output formats
  if (options.outputFormat === 'plain') {
    // Strip all formatting for plain text
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Remove italic
    cleaned = cleaned.replace(/#{1,6}\s/g, ''); // Remove headers
  } else if (options.outputFormat === 'structured') {
    // Enhance structure for better readability
    cleaned = cleaned.replace(/^(#{1,6})\s/gm, '$1 '); // Ensure space after headers
    cleaned = cleaned.replace(/^\s*[-*+]\s/gm, '• '); // Normalize bullet points
  }

  return cleaned;
}