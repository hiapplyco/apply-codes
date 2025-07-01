
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from 'npm:@mendable/firecrawl-js';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a professional content analyzer. Given webpage content, create a clear summary focusing on:

1. Key Information:
   - Main points and takeaways
   - Important dates or deadlines
   - Requirements or qualifications
   - Responsibilities or expectations
   
2. Content Organization:
   - Break down into clear sections
   - Highlight important details
   - Remove any irrelevant content
   
Format the response as a clear, professional summary that would be appropriate for business use.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Starting crawl for URL:', url);

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      throw new Error('Firecrawl API key not configured');
    }

    const firecrawl = new FirecrawlApp({ apiKey });
    const crawlResponse = await firecrawl.crawlUrl(url, {
      limit: 1,
      scrapeOptions: {
        formats: ['json', 'markdown'],
        selectors: ['main', 'article', '.content', '#content', '.job-description'],
        removeSelectors: ['nav', 'header', 'footer', '.advertisement'],
        blockAds: true,
        removeBase64Images: true,
        timeout: 60000,
        waitUntil: 'networkidle0'
      }
    });

    console.log('Crawl response received:', crawlResponse);

    if (!crawlResponse.success || !crawlResponse.data?.[0]) {
      throw new Error('Failed to crawl URL');
    }

    const scrapedContent = crawlResponse.data[0].content;
    
    if (!scrapedContent) {
      throw new Error('No content found on webpage');
    }

    // Use Gemini to analyze and summarize the content
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log('Processing content with Gemini...');
    const result = await model.generateContent({
      contents: [{ 
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nWebpage content:\n${scrapedContent}` }]
      }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1000,
      }
    });

    const summarizedText = result.response.text();
    console.log('Content successfully summarized');

    return new Response(
      JSON.stringify({
        success: true,
        text: summarizedText,
        rawContent: scrapedContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in firecrawl-url function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
