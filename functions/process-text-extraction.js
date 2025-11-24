const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const axios = require('axios');

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

exports.processTextExtraction = functions.https.onRequest(async (req, res) => {
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
        console.log('Starting text extraction request...');
        console.log('Request method:', req.method);

        const file = req.file;
        const userId = req.body?.userId;
        const extractionOptions = {
          preserveFormatting: req.body?.preserveFormatting !== 'false',
          extractTables: req.body?.extractTables !== 'false',
          ocrEnabled: req.body?.ocrEnabled !== 'false',
          language: req.body?.language || 'en',
          outputFormat: req.body?.outputFormat || 'structured'
        };

        console.log('Form fields:', {
          hasFile: !!file,
          fileType: file?.mimetype,
          fileName: file?.originalname,
          fileSize: file?.size,
          userId: userId,
          extractionOptions
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

        // Extended supported file types for text extraction
        const supportedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'text/plain',
          'text/csv',
          'text/rtf',
          'application/rtf',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'image/gif',
          'image/bmp',
          'image/tiff',
          'image/webp',
          'application/octet-stream',
          'application/zip',
          'application/vnd.ms-word',
          'application/vnd.ms-word.document.macroEnabled.12',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-powerpoint'
        ];

        const fileName = file.originalname.toLowerCase();
        const supportedExtensions = [
          '.pdf', '.doc', '.docx', '.txt', '.csv', '.rtf',
          '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp',
          '.xlsx', '.xls', '.pptx', '.ppt'
        ];
        const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext));

        if (!supportedTypes.includes(file.mimetype) && !hasValidExtension) {
          console.error(`File validation failed:`, {
            fileName: file.originalname,
            fileType: file.mimetype,
            hasValidExtension
          });
          res.status(400).json({
            success: false,
            error: `Unsupported file type: ${file.mimetype}. Supported formats: PDF, DOC, DOCX, TXT, CSV, RTF, Images (JPG, PNG, GIF, BMP, TIFF, WebP), Excel, PowerPoint`
          });
          resolve();
          return;
        }

        console.log('File validation passed');

        // Initialize Supabase client for auth validation
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error('Supabase configuration missing');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Validate user authorization if auth token provided
        const authHeader = req.headers.authorization;
        if (authHeader) {
          try {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (authError || !user) {
              res.status(401).json({
                success: false,
                error: 'Invalid authentication token'
              });
              resolve();
              return;
            }
          } catch (authErr) {
            console.warn('Auth validation failed:', authErr);
          }
        }

        // Generate unique file path
        const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `text-extraction/${Date.now()}-${sanitizedFileName}`;

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
        } else if (file.mimetype === 'text/csv') {
          console.log('Processing CSV file');
          extractionResult = await processCSVFile(file.buffer, extractionOptions);
        } else if (isImageFile(file.mimetype, fileName)) {
          console.log('Processing image file with OCR');
          extractionResult = await processImageWithOCR(file.buffer, file.originalname, file.mimetype, geminiApiKey, extractionOptions);
        } else if (file.mimetype === 'application/pdf' || fileName.endsWith('.pdf')) {
          console.log('Processing PDF with advanced text extraction');
          extractionResult = await processPDFWithAdvancedExtraction(file.buffer, file.originalname, geminiApiKey, extractionOptions);
        } else if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileName.endsWith('.docx')
        ) {
          console.log('Processing DOCX with advanced text extraction');
          extractionResult = await processDOCXWithAdvancedExtraction(file.buffer, file.originalname, geminiApiKey, extractionOptions);
        } else if (isSpreadsheetFile(file.mimetype, fileName)) {
          console.log('Processing spreadsheet file');
          extractionResult = await processSpreadsheetFile(file.buffer, file.originalname, file.mimetype, geminiApiKey, extractionOptions);
        } else if (isPresentationFile(file.mimetype, fileName)) {
          console.log('Processing presentation file');
          extractionResult = await processPresentationFile(file.buffer, file.originalname, file.mimetype, geminiApiKey, extractionOptions);
        } else {
          console.log('Processing general document with enhanced extraction');
          extractionResult = await processGeneralDocumentAdvanced(file.buffer, file.originalname, file.mimetype, geminiApiKey, extractionOptions);
        }

        // Clean and format extracted text
        const cleanedText = cleanAndFormatText(extractionResult.text, extractionOptions);

        // Detect language if not specified
        const detectedLanguage = extractionOptions.language === 'auto'
          ? await detectLanguage(cleanedText, geminiApiKey)
          : extractionOptions.language;

        // Upload to Supabase storage for archival (optional)
        try {
          const { error: uploadError } = await supabase.storage
            .from('docs')
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: false
            });

          if (uploadError) {
            console.warn('Storage upload failed, but continuing:', uploadError);
          }
        } catch (storageErr) {
          console.warn('Storage operation failed:', storageErr);
        }

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
              detectedLanguage: detectedLanguage,
              extractionOptions: extractionOptions,
              processingTimestamp: new Date().toISOString(),
              filePath: filePath
            }
          },
          message: 'Text extraction completed successfully'
        };

        res.status(200).json(response);
        resolve();

      } catch (error) {
        console.error('Error processing text extraction:', error);

        let errorMessage = 'An unexpected error occurred during text extraction.';
        if (error.message?.includes('File processing failed')) {
          errorMessage = 'File processing error: Unable to extract text from the file. Please try a different format.';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Processing timeout: The file took too long to process. Please try a smaller file.';
        } else if (error.message?.includes('OCR')) {
          errorMessage = 'OCR processing error: Unable to extract text from the image. Please ensure the image contains readable text.';
        } else if (error.message?.includes('language')) {
          errorMessage = 'Language detection error: Unable to detect the document language. Please specify the language manually.';
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

// Helper function to check if file is an image
function isImageFile(mimeType, fileName) {
  const imageMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'image/bmp', 'image/tiff', 'image/webp'
  ];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp'];

  return imageMimeTypes.includes(mimeType) ||
         imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

// Helper function to check if file is a spreadsheet
function isSpreadsheetFile(mimeType, fileName) {
  const spreadsheetTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  const spreadsheetExtensions = ['.xlsx', '.xls'];

  return spreadsheetTypes.includes(mimeType) ||
         spreadsheetExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

// Helper function to check if file is a presentation
function isPresentationFile(mimeType, fileName) {
  const presentationTypes = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ];
  const presentationExtensions = ['.pptx', '.ppt'];

  return presentationTypes.includes(mimeType) ||
         presentationExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

// Enhanced PDF processing with better structure preservation
async function processPDFWithAdvancedExtraction(buffer, fileName, apiKey, options) {
  try {
    console.log('Starting advanced PDF processing with Gemini...');

    const base64Data = buffer.toString('base64');

    const prompt = options.extractTables
      ? 'Extract all text from this PDF document with special attention to preserving table structures, headers, footers, and formatting. For tables, use clear delimiters like | for columns and preserve row structures. Include all metadata like page numbers, headers, and footers. Pay attention to contact information, skills, experience, job requirements, and any structured data.'
      : 'Extract all text from this PDF document, preserving the original structure and formatting. Pay special attention to contact information, skills, experience, and job requirements.';

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Data
                }
              }
            ]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const extractedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('No text extracted from PDF');
    }

    console.log('Advanced PDF processing completed successfully');

    return {
      text: extractedText,
      metadata: {
        originalFormat: 'application/pdf',
        extractionMethod: 'gemini-advanced',
        tablesExtracted: options.extractTables,
        structurePreserved: options.preserveFormatting
      }
    };

  } catch (error) {
    console.error('Advanced PDF processing error:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

// Enhanced DOCX processing
async function processDOCXWithAdvancedExtraction(buffer, fileName, apiKey, options) {
  try {
    console.log('Starting advanced DOCX processing with Gemini...');

    const base64Data = buffer.toString('base64');

    const prompt = `You are an expert in parsing Word documents. Extract all text content including:
    ${options.extractTables ? '- Tables with proper structure and formatting' : ''}
    - Lists and bullet points with hierarchy
    - Headers and footers
    - Document metadata
    - Comments and track changes (if any)
    ${options.preserveFormatting ? '- Preserve original formatting and structure as closely as possible' : ''}
    Pay special attention to contact information, skills, experience, and job requirements.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  data: base64Data
                }
              }
            ]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const extractedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('No text extracted from DOCX');
    }

    console.log('Advanced DOCX processing completed successfully');

    return {
      text: extractedText,
      metadata: {
        originalFormat: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extractionMethod: 'gemini-advanced',
        tablesExtracted: options.extractTables,
        structurePreserved: options.preserveFormatting
      }
    };

  } catch (error) {
    console.error('Advanced DOCX processing error:', error);
    throw new Error(`DOCX processing failed: ${error.message}`);
  }
}

// Image OCR processing with enhanced capabilities
async function processImageWithOCR(buffer, fileName, mimeType, apiKey, options) {
  try {
    console.log('Starting OCR processing for image...');

    if (!options.ocrEnabled) {
      throw new Error('OCR is disabled for this request');
    }

    const base64Data = buffer.toString('base64');

    const prompt = `Perform OCR (Optical Character Recognition) on this image to extract all text content.
    Instructions:
    - Extract ALL visible text, including small text, watermarks, and embedded text
    - Preserve the spatial layout and structure of the text
    - Include any tables, lists, or structured data
    - Handle multiple languages if present (primary language: ${options.language})
    - If the image contains forms, extract field labels and any filled-in data
    - Pay attention to contact information, names, addresses, phone numbers, emails
    - Note any handwritten text separately from printed text
    - If text is unclear or ambiguous, indicate uncertainty
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const extractedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('No text extracted from image via OCR');
    }

    console.log('OCR processing completed successfully');

    return {
      text: extractedText,
      metadata: {
        originalFormat: mimeType,
        extractionMethod: 'gemini-ocr',
        ocrEnabled: true,
        language: options.language,
        imageType: mimeType
      }
    };

  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

// CSV file processing
async function processCSVFile(buffer, options) {
  try {
    console.log('Processing CSV file...');

    const text = buffer.toString('utf-8');
    const lines = text.split('\n');
    const headers = lines[0]?.split(',') || [];

    let processedText = text;

    if (options.outputFormat === 'structured') {
      // Convert CSV to more readable format
      const rows = lines.slice(1).filter(line => line.trim());
      processedText = `CSV Data with ${headers.length} columns and ${rows.length} rows:\n\n`;
      processedText += `Headers: ${headers.join(' | ')}\n\n`;
      processedText += 'Data:\n';

      rows.slice(0, 100).forEach((row, index) => { // Limit to first 100 rows
        const values = row.split(',');
        processedText += `Row ${index + 1}: ${values.join(' | ')}\n`;
      });

      if (rows.length > 100) {
        processedText += `\n... and ${rows.length - 100} more rows`;
      }
    }

    return {
      text: processedText,
      metadata: {
        originalFormat: 'text/csv',
        rowCount: lines.length - 1,
        columnCount: headers.length,
        headers: headers,
        extractionMethod: 'csv-parser'
      }
    };

  } catch (error) {
    console.error('CSV processing error:', error);
    throw new Error(`CSV processing failed: ${error.message}`);
  }
}

// Spreadsheet processing
async function processSpreadsheetFile(buffer, fileName, mimeType, apiKey, options) {
  try {
    console.log('Processing spreadsheet file with Gemini...');

    const base64Data = buffer.toString('base64');

    const prompt = `Extract all data from this spreadsheet document. Include:
    - All sheet names and their content
    - Table headers and data with proper structure
    - Formulas (if visible)
    - Charts and graph descriptions
    - Cell formatting information where relevant
    - Preserve the relationship between data points
    ${options.preserveFormatting ? '- Maintain original structure and formatting' : ''}
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const extractedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('No data extracted from spreadsheet');
    }

    return {
      text: extractedText,
      metadata: {
        originalFormat: mimeType,
        extractionMethod: 'gemini-spreadsheet',
        structurePreserved: options.preserveFormatting
      }
    };

  } catch (error) {
    console.error('Spreadsheet processing error:', error);
    throw new Error(`Spreadsheet processing failed: ${error.message}`);
  }
}

// Presentation processing
async function processPresentationFile(buffer, fileName, mimeType, apiKey, options) {
  try {
    console.log('Processing presentation file with Gemini...');

    const base64Data = buffer.toString('base64');

    const prompt = `Extract all content from this presentation document. Include:
    - Slide titles and content
    - Bullet points and lists with hierarchy
    - Speaker notes (if any)
    - Image descriptions and chart data
    - Slide transitions and animations (if described)
    - Footer and header information
    ${options.preserveFormatting ? '- Preserve the slide structure and flow' : ''}
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const extractedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('No content extracted from presentation');
    }

    return {
      text: extractedText,
      metadata: {
        originalFormat: mimeType,
        extractionMethod: 'gemini-presentation',
        structurePreserved: options.preserveFormatting
      }
    };

  } catch (error) {
    console.error('Presentation processing error:', error);
    throw new Error(`Presentation processing failed: ${error.message}`);
  }
}

// General document processing with enhanced capabilities
async function processGeneralDocumentAdvanced(buffer, fileName, mimeType, apiKey, options) {
  try {
    console.log('Processing general document with enhanced extraction...');

    const base64Data = buffer.toString('base64');

    const prompt = `Extract all text and information from this document.
    Requirements:
    - Preserve original structure and formatting
    - Extract all readable content including headers, footers, and metadata
    - Handle multiple languages and character encodings
    - Include table structures if present
    - Note any embedded objects or images
    - Extract contact information, dates, and structured data
    - Maintain document hierarchy and organization
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const extractedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('No text extracted from document');
    }

    return {
      text: extractedText,
      metadata: {
        originalFormat: mimeType,
        extractionMethod: 'gemini-general',
        structurePreserved: options.preserveFormatting
      }
    };

  } catch (error) {
    console.error('General document processing error:', error);
    throw new Error(`Document processing failed: ${error.message}`);
  }
}

// Language detection helper
async function detectLanguage(text, apiKey) {
  try {
    const prompt = `Detect the primary language of the following text. Respond with just the ISO 639-1 language code (e.g., 'en', 'es', 'fr', 'de', etc.): "${text.substring(0, 500)}"`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    const detectedLang = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    return detectedLang || 'en';

  } catch (error) {
    console.warn('Language detection failed:', error);
    return 'en'; // Default to English
  }
}

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

  // Clean up common OCR artifacts
  cleaned = cleaned.replace(/[^\S\n]+/g, ' '); // Replace non-breaking spaces
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between words if missing

  return cleaned;
}