// Extracted handler logic for testing
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import { GoogleAIFileManager } from "npm:@google/generative-ai/server"

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export interface Dependencies {
  supabaseClient?: any;
  googleAI?: any;
  fileManager?: any;
}

export async function handleRequest(req: Request, deps: Dependencies = {}): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting document parse request...')
    console.log('Request method:', req.method)
    console.log('Content-Type:', req.headers.get('content-type'))
    
    const formData = await req.formData()
    console.log('FormData parsed successfully')
    
    const file = formData.get('file')
    const userId = formData.get('userId')
    
    console.log('Form fields:', {
      hasFile: !!file,
      fileType: file ? (file as File).type : 'none',
      fileName: file ? (file as File).name : 'none',
      userId: userId
    })

    if (!file || !userId) {
      console.error('Missing required fields:', { file: !!file, userId: !!userId })
      throw new Error('No file uploaded or missing user ID')
    }

    if (!(file instanceof File)) {
      console.error('File is not a File instance:', typeof file)
      throw new Error('Invalid file format received')
    }

    console.log('Processing file:', (file as File).name, 'of type:', (file as File).type, 'size:', (file as File).size)
    
    // Validate file size (20MB limit)
    if ((file as File).size > 20 * 1024 * 1024) {
      throw new Error('File size exceeds 20MB limit. Please use a smaller file.');
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
      // Common variations for .docx files
      'application/octet-stream',
      'application/zip',
      // Additional Word document types
      'application/vnd.ms-word',
      'application/vnd.ms-word.document.macroEnabled.12'
    ];
    
    // Check both MIME type and file extension for better compatibility
    const fileName = (file as File).name.toLowerCase();
    const supportedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!supportedTypes.includes((file as File).type) && !hasValidExtension) {
      console.error(`File validation failed:`, {
        fileName: (file as File).name,
        fileType: (file as File).type,
        hasValidExtension,
        supportedTypes,
        supportedExtensions
      });
      throw new Error(`Unsupported file type: ${(file as File).type}. Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG`);
    }
    
    console.log('File validation passed:', {
      fileType: (file as File).type,
      fileName: (file as File).name,
      hasValidExtension
    });

    // Create Supabase client
    const supabase = deps.supabaseClient || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate unique file path with sanitized filename
    const sanitizedFileName = (file as File).name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${crypto.randomUUID()}-${sanitizedFileName}`

    // Get file data as ArrayBuffer
    const arrayBuffer = await (file as File).arrayBuffer()

    // If it's a text file, process it directly
    if ((file as File).type === 'text/plain') {
      const text = new TextDecoder().decode(arrayBuffer)
      console.log('Processing text file directly')
      
      return new Response(
        JSON.stringify({ 
          success: true,
          text,
          filePath,
          message: 'Text file processed successfully'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // For PDFs, use Gemini's native PDF processing with inline data
    if ((file as File).type === 'application/pdf') {
      console.log('Processing PDF with Gemini native PDF support...')
      return await processPDFWithGemini(arrayBuffer, (file as File).name, geminiApiKey)
    }

    // For DOCX files, convert to PDF first then process
    if ((file as File).type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        fileName.endsWith('.docx')) {
      console.log('Converting DOCX to PDF for Gemini processing...')
      return await processDOCXWithGemini(arrayBuffer, (file as File).name, geminiApiKey)
    }

    // Upload file to Supabase Storage
    console.log('Attempting to upload file to docs bucket...')
    const { error: uploadError } = await supabase.storage
      .from('docs')
      .upload(filePath, arrayBuffer, {
        contentType: (file as File).type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // Continue processing even if storage fails
      console.warn('Storage upload failed, but continuing with text extraction...')
    }

    console.log('File uploaded, starting Gemini processing...')

    // Check for Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured. Please contact support.');
    }

    // Initialize Gemini
    const genAI = deps.googleAI || new GoogleGenerativeAI(geminiApiKey);
    const fileManager = deps.fileManager || new GoogleAIFileManager(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let uploadedFile = null;

    try {
      // Upload file to Gemini
      console.log('Uploading file to Gemini...');
      console.log('File details - name:', (file as File).name, 'type:', (file as File).type, 'size:', (file as File).size);
      
      // Create a File object for Gemini API
      const fileForGemini = new File([arrayBuffer], (file as File).name, {
        type: (file as File).type
      });
      
      console.log('Created File object for Gemini, attempting upload...');
      
      uploadedFile = await fileManager.uploadFile(fileForGemini, {
        mimeType: (file as File).type,
        displayName: (file as File).name,
      });
      
      console.log('Successfully uploaded file to Gemini:', uploadedFile.file.name);
      console.log('File URI:', uploadedFile.file.uri);
      console.log('Initial file state:', uploadedFile.file.state);

      // Poll for file to become active
      let fileState = uploadedFile.file.state;
      let retries = 10; // Max 20 seconds wait
      while (fileState !== 'ACTIVE' && retries > 0) {
        if (fileState === 'FAILED') {
          throw new Error("File processing failed on Google's end.");
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
        const fileStatus = await fileManager.getFile({ name: uploadedFile.file.name });
        fileState = fileStatus.state;
        console.log(`File state: ${fileState}, retries remaining: ${retries}`);
        retries--;
      }

      if (fileState !== 'ACTIVE') {
        throw new Error("File processing timed out.");
      }

      console.log('File is active, generating content...');
      
      // Process with Gemini using file type-specific handling
      let prompt = 'Extract all text from the document, preserving the original structure, formatting, and any relevant details.';
      
      if ((file as File).type.includes('pdf')) {
        prompt = 'System: You are an expert in parsing PDF documents. Your task is to accurately extract all text content, including headers, footers, tables, and lists. Preserve the original structure and formatting as closely as possible. Pay special attention to details like contact information, skills, experience, and job requirements.';
      } else if ((file as File).type.includes('sheet') || (file as File).type.includes('excel')) {
        prompt = 'System: You are an expert in parsing spreadsheet documents. Your task is to accurately extract all data, including formulas, charts, and tables. Preserve the original structure and formatting as closely as possible. Pay special attention to maintaining the relationships between data points.';
      } else if ((file as File).type.includes('word') || (file as File).type.includes('document')) {
        prompt = 'System: You are an expert in parsing Word documents. Your task is to accurately extract all text content, including tables, lists, and formatting. Preserve the original structure and formatting as closely as possible. Pay special attention to details like contact information, skills, experience, and job requirements.';
      }

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadedFile.file.mimeType,
            fileUri: uploadedFile.file.uri,
          },
        },
        { text: prompt }
      ]);

      const extractedText = result.response.text();
      console.log('Gemini processing completed successfully');

      return new Response(
        JSON.stringify({ 
          success: true,
          text: extractedText,
          filePath,
          message: 'Document processed successfully'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (processingError) {
      console.error('Gemini processing error:', processingError)
      console.error('Error stack:', processingError instanceof Error ? processingError.stack : 'No stack trace')
      
      let errorMessage = 'Unknown processing error'
      if (processingError instanceof Error) {
        errorMessage = processingError.message
        
        // Provide more specific error messages based on the error content
        if (errorMessage.includes('uploadFile')) {
          errorMessage = 'Failed to upload file to Gemini AI. Please try again or contact support.'
        } else if (errorMessage.includes('FAILED')) {
          errorMessage = 'Google AI could not process this file. Please try a different file format.'
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          errorMessage = 'File processing timed out. Please try a smaller file.'
        } else if (errorMessage.includes('mimeType') || errorMessage.includes('mime')) {
          errorMessage = 'File format not supported by AI processor. Please use PDF, DOC, DOCX, or image files.'
        }
      }
      
      throw new Error(`Document processing failed: ${errorMessage}`)
    } finally {
      // Clean up uploaded file
      if (uploadedFile) {
        try {
          console.log('Deleting file:', uploadedFile.file.name);
          await fileManager.deleteFile({ name: uploadedFile.file.name });
        } catch (deleteError) {
          console.warn('Failed to delete uploaded file:', deleteError);
        }
      }
    }

  } catch (error) {
    console.error('Error processing document:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Provide more detailed error messages
    let errorMessage = 'An unexpected error occurred while processing the document.';
    if (error instanceof Error && error.message?.includes('File processing failed')) {
      errorMessage = 'File processing error: Google was unable to process the file. Please try a different file format.';
    } else if (error instanceof Error && error.message?.includes('File processing timed out')) {
      errorMessage = 'Processing timeout: The file took too long to process. Please try a smaller file.';
    } else if (error instanceof Error && error.message?.includes('uploadFile')) {
      errorMessage = 'Upload error: Failed to upload the file to Google. Please check your internet connection.';
    } else if (error instanceof Error && (error.message?.includes('Gemini') || error.message?.includes('model'))) {
      errorMessage = 'AI processing error: The AI model failed to process the document. Please try again later.';
    } else if (error instanceof Error && error.message?.includes('storage')) {
      errorMessage = 'File storage error: There was a problem saving the file. Please check your connection and try again.';
    } else if (error instanceof Error && error.message?.includes('size')) {
      errorMessage = 'File too large: The file exceeds the maximum allowed size. Please upload a smaller file.';
    } else if (error instanceof Error && error.message?.includes('No file uploaded')) {
      errorMessage = 'No file found: Please select a file to upload.';
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    )
  }
}

// Helper function to process PDFs using Gemini's native PDF support
async function processPDFWithGemini(arrayBuffer: ArrayBuffer, fileName: string, apiKey: string) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  try {
    console.log('Starting native PDF processing with Gemini...')
    
    // Convert ArrayBuffer to base64
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: 'Extract all text from this document, preserving the original structure, formatting, and any relevant details. Pay special attention to contact information, skills, experience, and job requirements.' },
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
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!extractedText) {
      throw new Error('No text extracted from PDF')
    }

    console.log('PDF processing completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        text: extractedText,
        message: 'PDF processed successfully with native Gemini support'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('PDF processing error:', error)
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to process DOCX files by converting to PDF first
async function processDOCXWithGemini(arrayBuffer: ArrayBuffer, fileName: string, apiKey: string) {
  try {
    console.log('Starting DOCX to PDF conversion...')
    
    // Check for ConvertAPI key
    const convertApiKey = Deno.env.get('CONVERTAPI_KEY')
    if (!convertApiKey) {
      console.log('ConvertAPI key not found, falling back to file manager approach')
      // Fall back to the original file manager approach
      return await processWithFileManager(arrayBuffer, fileName, apiKey, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    }

    // Convert DOCX to PDF using ConvertAPI
    const formData = new FormData()
    formData.append('File', new Blob([arrayBuffer]), fileName)
    
    const convertResponse = await fetch(`https://v2.convertapi.com/convert/docx/to/pdf?Secret=${convertApiKey}`, {
      method: 'POST',
      body: formData
    })

    if (!convertResponse.ok) {
      console.error('ConvertAPI error:', convertResponse.status, convertResponse.statusText)
      // Fall back to file manager approach
      return await processWithFileManager(arrayBuffer, fileName, apiKey, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    }

    const convertResult = await convertResponse.json()
    const pdfUrl = convertResult.Files?.[0]?.Url

    if (!pdfUrl) {
      console.error('No PDF URL returned from ConvertAPI')
      // Fall back to file manager approach
      return await processWithFileManager(arrayBuffer, fileName, apiKey, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    }

    console.log('DOCX converted to PDF, downloading...')
    
    // Download the converted PDF
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      throw new Error('Failed to download converted PDF')
    }
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer()
    
    // Process the PDF with Gemini
    console.log('Processing converted PDF with Gemini...')
    return await processPDFWithGemini(pdfArrayBuffer, fileName.replace('.docx', '.pdf'), apiKey)
    
  } catch (error) {
    console.error('DOCX processing error:', error)
    console.log('Falling back to file manager approach...')
    // Fall back to the original file manager approach
    return await processWithFileManager(arrayBuffer, fileName, apiKey, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  }
}

// Fallback function using the original file manager approach
async function processWithFileManager(arrayBuffer: ArrayBuffer, fileName: string, apiKey: string, mimeType: string) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  // This is the original implementation that was in the try block
  const { GoogleGenerativeAI } = await import("npm:@google/generative-ai")
  const { GoogleAIFileManager } = await import("npm:@google/generative-ai/server")
  
  const genAI = new GoogleGenerativeAI(apiKey)
  const fileManager = new GoogleAIFileManager(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  let uploadedFile = null

  try {
    console.log('Using file manager approach as fallback...')
    
    // Create a File object for Gemini API
    const fileForGemini = new File([arrayBuffer], fileName, { type: mimeType })
    
    uploadedFile = await fileManager.uploadFile(fileForGemini, {
      mimeType: mimeType,
      displayName: fileName,
    })
    
    console.log('Successfully uploaded file to Gemini:', uploadedFile.file.name)

    // Poll for file to become active
    let fileState = uploadedFile.file.state
    let retries = 10 // Max 20 seconds wait
    while (fileState !== 'ACTIVE' && retries > 0) {
      if (fileState === 'FAILED') {
        throw new Error("File processing failed on Google's end.")
      }
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2-second delay
      const fileStatus = await fileManager.getFile({ name: uploadedFile.file.name })
      fileState = fileStatus.state
      console.log(`File state: ${fileState}, retries remaining: ${retries}`)
      retries--
    }

    if (fileState !== 'ACTIVE') {
      throw new Error("File processing timed out.")
    }

    console.log('File is active, generating content...')
    
    // Process with Gemini using file type-specific handling
    let prompt = 'Extract all text from the document, preserving the original structure, formatting, and any relevant details.'
    
    if (mimeType.includes('pdf')) {
      prompt = 'System: You are an expert in parsing PDF documents. Your task is to accurately extract all text content, including headers, footers, tables, and lists. Preserve the original structure and formatting as closely as possible. Pay special attention to details like contact information, skills, experience, and job requirements.'
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      prompt = 'System: You are an expert in parsing Word documents. Your task is to accurately extract all text content, including tables, lists, and formatting. Preserve the original structure and formatting as closely as possible. Pay special attention to details like contact information, skills, experience, and job requirements.'
    }

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadedFile.file.mimeType,
          fileUri: uploadedFile.file.uri,
        },
      },
      { text: prompt }
    ])

    const extractedText = result.response.text()
    console.log('File manager processing completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        text: extractedText,
        message: 'Document processed successfully'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } finally {
    // Clean up uploaded file
    if (uploadedFile) {
      try {
        console.log('Deleting file:', uploadedFile.file.name)
        await fileManager.deleteFile({ name: uploadedFile.file.name })
      } catch (deleteError) {
        console.warn('Failed to delete uploaded file:', deleteError)
      }
    }
  }
}