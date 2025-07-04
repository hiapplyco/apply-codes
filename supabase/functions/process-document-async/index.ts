import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessingRequest {
  storage_path: string;
  user_id: string;
  bucket_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting async document processing...')
    
    const { storage_path, user_id, bucket_id }: ProcessingRequest = await req.json()
    
    console.log('Processing request:', { storage_path, user_id, bucket_id })

    if (!storage_path || !user_id || !bucket_id) {
      throw new Error('Missing required fields: storage_path, user_id, or bucket_id')
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update status to processing
    console.log('Updating status to processing...')
    await supabase.rpc('update_document_status', {
      p_storage_path: storage_path,
      p_status: 'processing'
    })

    // Download the file from storage
    console.log('Downloading file from storage...')
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucket_id)
      .download(storage_path)

    if (downloadError) {
      console.error('Download error:', downloadError)
      await supabase.rpc('update_document_status', {
        p_storage_path: storage_path,
        p_status: 'failed',
        p_error: `Failed to download file: ${downloadError.message}`
      })
      throw downloadError
    }

    // Get file buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const fileName = storage_path.split('/').pop() || 'unknown'
    
    console.log('File downloaded successfully:', { fileName, size: arrayBuffer.byteLength })

    // Determine file type and process accordingly
    const fileExtension = fileName.toLowerCase().split('.').pop()
    let extractedText = ''

    if (fileExtension === 'txt') {
      // Process text files directly
      extractedText = new TextDecoder().decode(arrayBuffer)
      console.log('Text file processed directly')
    } else {
      // Process with Gemini AI
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured')
      }

      extractedText = await processWithGemini(arrayBuffer, fileName, geminiApiKey)
    }

    // Update status to completed with extracted content
    console.log('Updating status to completed...')
    await supabase.rpc('update_document_status', {
      p_storage_path: storage_path,
      p_status: 'completed',
      p_content: extractedText
    })

    console.log('Document processing completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Document processed successfully',
        storage_path,
        content_length: extractedText.length
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in async document processing:', error)
    
    // Try to update the status to failed if we have the storage path
    try {
      const body = await req.text()
      const { storage_path } = JSON.parse(body)
      if (storage_path) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        await supabase.rpc('update_document_status', {
          p_storage_path: storage_path,
          p_status: 'failed',
          p_error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})

async function processWithGemini(arrayBuffer: ArrayBuffer, fileName: string, apiKey: string): Promise<string> {
  const fileExtension = fileName.toLowerCase().split('.').pop()
  
  // Determine MIME type
  let mimeType = 'application/octet-stream'
  if (fileExtension === 'pdf') {
    mimeType = 'application/pdf'
  } else if (fileExtension === 'docx') {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  } else if (fileExtension === 'doc') {
    mimeType = 'application/msword'
  } else if (['jpg', 'jpeg'].includes(fileExtension || '')) {
    mimeType = 'image/jpeg'
  } else if (fileExtension === 'png') {
    mimeType = 'image/png'
  }

  console.log('Processing with Gemini:', { fileName, mimeType, size: arrayBuffer.byteLength })

  // Use direct API approach for better reliability
  const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
  
  // Create appropriate prompt based on file type
  let prompt = 'Extract all text from this document, preserving the original structure, formatting, and any relevant details.'
  
  if (mimeType.includes('pdf')) {
    prompt = 'System: You are an expert in parsing PDF documents. Your task is to accurately extract all text content, including headers, footers, tables, and lists. Preserve the original structure and formatting as closely as possible. Pay special attention to details like contact information, skills, experience, and job requirements.'
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    prompt = 'System: You are an expert in parsing Word documents. Your task is to accurately extract all text content, including tables, lists, and formatting. Preserve the original structure and formatting as closely as possible. Pay special attention to details like contact information, skills, experience, and job requirements.'
  } else if (mimeType.includes('image')) {
    prompt = 'System: You are an expert in extracting text from images. Your task is to accurately read and extract all text content, including any structured data like tables or forms. Preserve the original layout and formatting as closely as possible.'
  }

  const requestBody = {
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
  }
  
  console.log('Making Gemini API call...')
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!extractedText) {
    throw new Error('No text extracted from document')
  }

  console.log('Gemini processing completed successfully')
  return extractedText
}