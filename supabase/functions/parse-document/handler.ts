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
    const formData = await req.formData()
    const file = formData.get('file')
    const userId = formData.get('userId')

    if (!file || !userId) {
      throw new Error('No file uploaded or missing user ID')
    }

    console.log('Processing file:', (file as File).name, 'of type:', (file as File).type)

    // Create Supabase client
    const supabase = deps.supabaseClient || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate unique file path
    const filePath = `${crypto.randomUUID()}-${(file as File).name}`

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

    // Initialize Gemini
    const genAI = deps.googleAI || new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const fileManager = deps.fileManager || new GoogleAIFileManager(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let uploadedFile = null;

    try {
      // Upload file to Gemini
      console.log('Uploading file to Gemini...');
      uploadedFile = await fileManager.uploadFile(arrayBuffer, {
        mimeType: (file as File).type,
        displayName: (file as File).name,
      });
      console.log('Uploaded file:', uploadedFile.file.name);

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
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown error'
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