const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const uploadMiddleware = upload.single('file');

exports.parseDocument = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  res.set(corsHeaders);

  // Process multipart form data
  return new Promise((resolve, reject) => {
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        res.status(400).json({
          success: false,
          error: err.message || 'File upload failed'
        });
        resolve();
        return;
      }

      try {
        console.log('Starting document parse request...');
        console.log('Request method:', req.method);

        const file = req.file;
        const userId = req.body?.userId;

        console.log('Form fields:', {
          hasFile: !!file,
          fileType: file?.mimetype,
          fileName: file?.originalname,
          fileSize: file?.size,
          userId: userId
        });

        if (!file || !userId) {
          console.error('Missing required fields:', { file: !!file, userId: !!userId });
          res.status(400).json({
            success: false,
            error: 'No file uploaded or missing user ID'
          });
          resolve();
          return;
        }

        console.log('Processing file:', file.originalname, 'of type:', file.mimetype, 'size:', file.size);

        // Validate file size
        if (file.size > 20 * 1024 * 1024) {
          res.status(400).json({
            success: false,
            error: 'File size exceeds 20MB limit. Please use a smaller file.'
          });
          resolve();
          return;
        }

        // Validate file type
        const supportedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'text/plain',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'application/octet-stream', // Common for .docx
          'application/zip', // Common for .docx
          'application/vnd.ms-word',
          'application/vnd.ms-word.document.macroEnabled.12'
        ];

        const fileName = file.originalname.toLowerCase();
        const supportedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
        const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext));

        if (!supportedTypes.includes(file.mimetype) && !hasValidExtension) {
          console.error(`File validation failed:`, {
            fileName: file.originalname,
            fileType: file.mimetype,
            hasValidExtension
          });
          res.status(400).json({
            success: false,
            error: `Unsupported file type: ${file.mimetype}. Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG`
          });
          resolve();
          return;
        }

        console.log('File validation passed');

        // Generate unique file path
        const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${Date.now()}-${sanitizedFileName}`;

        // If it's a text file, process it directly
        if (file.mimetype === 'text/plain') {
          const text = file.buffer.toString('utf-8');
          console.log('Processing text file directly');

          res.status(200).json({
            success: true,
            text,
            filePath,
            message: 'Text file processed successfully'
          });
          resolve();
          return;
        }

        // Check for Gemini API key
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
          res.status(500).json({
            success: false,
            error: 'Gemini API key not configured. Please contact support.'
          });
          resolve();
          return;
        }

        // Process with Gemini based on file type
        let extractedText;

        if (file.mimetype === 'application/pdf' || fileName.endsWith('.pdf')) {
          console.log('Processing PDF with Gemini...');
          extractedText = await processPDFWithGemini(file.buffer, file.originalname, geminiApiKey);
        } else if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileName.endsWith('.docx')
        ) {
          console.log('Processing DOCX with Gemini...');
          extractedText = await processDOCXWithGemini(file.buffer, file.originalname, geminiApiKey);
        } else {
          console.log('Processing general document with Gemini...');
          extractedText = await processGeneralDocument(file.buffer, file.originalname, file.mimetype, geminiApiKey);
        }

        // Upload to Firebase storage (optional - could be skipped for cost savings)
        try {
          const bucket = admin.storage().bucket();
          const fileRef = bucket.file(`docs/${userId}/${filePath}`);

          await fileRef.save(file.buffer, {
            metadata: {
              contentType: file.mimetype,
              metadata: {
                originalName: file.originalname,
                uploadedBy: userId,
                uploadedAt: new Date().toISOString()
              }
            }
          });

          console.log('File uploaded to Firebase Storage successfully');
        } catch (storageErr) {
          console.warn('Storage operation failed, but continuing:', storageErr);
        }

        res.status(200).json({
          success: true,
          text: extractedText,
          filePath,
          message: 'Document processed successfully'
        });
        resolve();

      } catch (error) {
        console.error('Error processing document:', error);

        let errorMessage = 'An unexpected error occurred while processing the document.';
        if (error.message?.includes('File processing failed')) {
          errorMessage = 'File processing error: Unable to process the file. Please try a different format.';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Processing timeout: The file took too long to process. Please try a smaller file.';
        } else if (error.message?.includes('size')) {
          errorMessage = 'File too large: The file exceeds the maximum allowed size.';
        }

        res.status(400).json({
          success: false,
          error: errorMessage,
          details: error.message
        });
        resolve();
      }
    });
  });
});

// Helper function to process PDFs
async function processPDFWithGemini(buffer, fileName, apiKey) {
  try {
    console.log('Starting native PDF processing with Gemini...');

    // Convert buffer to base64
    const base64Data = buffer.toString('base64');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Extract all text from this document, preserving the original structure, formatting, and any relevant details. Pay special attention to contact information, skills, experience, and job requirements.'
              },
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('No text extracted from PDF');
    }

    console.log('PDF processing completed successfully');
    return extractedText;

  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

// Helper function to process DOCX files
async function processDOCXWithGemini(buffer, fileName, apiKey) {
  try {
    console.log('Starting DOCX processing with Gemini...');

    // Convert buffer to base64
    const base64Data = buffer.toString('base64');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'You are an expert in parsing Word documents. Extract all text content, including tables, lists, and formatting. Preserve the original structure as closely as possible.'
              },
              {
                inline_data: {
                  mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('No text extracted from DOCX');
    }

    console.log('DOCX processing completed successfully');
    return extractedText;

  } catch (error) {
    console.error('DOCX processing error:', error);
    throw new Error(`DOCX processing failed: ${error.message}`);
  }
}

// Helper function for general documents
async function processGeneralDocument(buffer, fileName, mimeType, apiKey) {
  try {
    console.log('Processing general document with Gemini...');

    const base64Data = buffer.toString('base64');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Extract all text and information from this document. Preserve the original structure and formatting as closely as possible.'
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('No text extracted from document');
    }

    return extractedText;

  } catch (error) {
    console.error('Document processing error:', error);
    throw new Error(`Document processing failed: ${error.message}`);
  }
}