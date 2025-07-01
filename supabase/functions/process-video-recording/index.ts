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
    const { recordingId } = await req.json()
    
    if (!recordingId) {
      throw new Error('No recording ID provided')
    }

    // Get Daily.co API key from Supabase secrets
    const dailyApiKey = Deno.env.get('DAILY_API_KEY')
    if (!dailyApiKey) {
      throw new Error('DAILY_API_KEY not found')
    }

    // 1. Fetch recording from Daily.co
    console.log('Fetching recording from Daily.co:', recordingId)
    const recordingResponse = await fetch(`https://api.daily.co/v1/recordings/${recordingId}`, {
      headers: {
        'Authorization': `Bearer ${dailyApiKey}`,
      }
    })

    if (!recordingResponse.ok) {
      throw new Error(`Failed to fetch recording: ${recordingResponse.statusText}`)
    }

    const recordingData = await recordingResponse.json()
    if (!recordingData.download_url) {
      throw new Error('Recording not ready for download')
    }

    // 2. Download the recording
    console.log('Downloading recording...')
    const videoResponse = await fetch(recordingData.download_url)
    if (!videoResponse.ok) {
      throw new Error('Failed to download recording')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Upload to Supabase Storage
    console.log('Uploading to Supabase Storage...')
    const videoBlob = await videoResponse.blob()
    const filePath = `recordings/${recordingId}.mp4`
    
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(filePath, videoBlob, {
        contentType: 'video/mp4',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload to storage: ${uploadError.message}`)
    }

    // 4. Get public URL for Gemini processing
    const { data: { publicUrl } } = supabase.storage
      .from('recordings')
      .getPublicUrl(filePath)

    // 5. Process with Gemini
    console.log('Processing with Gemini...')
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '')
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const vanityFairPrompt = `
      Please analyze this video recording in the style of a Vanity Fair article, focusing on the environment and setting. 
      Consider the following aspects:
      
      - The ambiance and decor of the space, described with the magazine's characteristic attention to detail and subtle wit
      - The lighting and its effect on the mood, as if capturing a carefully staged photoshoot
      - Any notable design elements or personal touches that might reveal something about the participants
      - The overall aesthetic and what it suggests about the meeting's dynamics
      - How the environment might influence the interaction between participants
      
      Write the analysis as if it were a feature piece for Vanity Fair, complete with sophisticated observations and cultural commentary.
      Include both factual descriptions and interpretive elements that paint a vivid picture of the scene.
    `

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "video/mp4",
          data: await videoBlob.arrayBuffer()
        }
      },
      vanityFairPrompt
    ])

    const analysis = result.response.text()
    console.log('Gemini analysis complete')

    // 6. Store analysis results
    const { error: dbError } = await supabase
      .from('meeting_analyses')
      .insert({
        recording_id: recordingId,
        video_url: publicUrl,
        analysis,
        processed_at: new Date().toISOString()
      })

    if (dbError) {
      throw new Error(`Failed to store analysis: ${dbError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis,
        videoUrl: publicUrl
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error processing video:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
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