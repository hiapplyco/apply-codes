
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
    const supabase = createClient(
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
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
      // Convert array buffer to base64 for Gemini processing
      const uint8Array = new Uint8Array(arrayBuffer);
      // Use btoa with String.fromCharCode for base64 encoding
      const base64Data = btoa(String.fromCharCode(...uint8Array));
      
      // Process with Gemini using file type-specific handling
      let prompt = 'Please extract all text content from this document, maintaining proper structure and formatting.';
      
      if ((file as File).type.includes('pdf')) {
        prompt = 'Please extract and format all the text content from this PDF document, maintaining proper structure and formatting. Focus on preserving all important information including skills, experience, job requirements, and other relevant details.';
      } else if ((file as File).type.includes('word') || (file as File).type.includes('document')) {
        prompt = 'Please extract and format all the text content from this Word document, maintaining proper structure, formatting, and bullet points. Focus on preserving all important information including skills, experience, job requirements, and other relevant details.';
      } else if ((file as File).type.includes('sheet') || (file as File).type.includes('excel')) {
        prompt = 'Please extract and format all the text content from this spreadsheet, maintaining table structure and relationships between data. Present the data in a clear, readable format.';
      }

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: (file as File).type,
          },
        },
        prompt
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
    }

  } catch (error) {
    console.error('Error processing document:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
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
})
