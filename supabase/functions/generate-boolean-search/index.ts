import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

interface ContextItem {
  type: 'url_scrape' | 'file_upload' | 'perplexity_search' | 'manual_input' | 'location_input';
  title: string;
  content: string;
  summary?: string;
  source_url?: string;
  file_name?: string;
  metadata?: {
    formatted_address?: string;
    place_id?: string;
    parsedLocation?: {
      city?: string;
      state?: string;
      stateShort?: string;
      county?: string;
      country?: string;
      countryShort?: string;
      zipCode?: string;
    };
  };
}

interface RequestPayload {
  description: string
  jobTitle?: string
  userId?: string
  contextItems?: ContextItem[]
}

interface BooleanSearchResponse {
  success: boolean
  searchString?: string
  error?: string
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Generate boolean search function called')
    
    let requestBody
    try {
      requestBody = await req.json() as RequestPayload
      console.log('Request payload received:', { hasDescription: !!requestBody?.description, hasJobTitle: !!requestBody?.jobTitle, hasUserId: !!requestBody?.userId })
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { description, jobTitle, userId, contextItems } = requestBody

    if (!description || typeof description !== 'string' || description.trim() === '') {
      console.error('Description is missing or invalid:', { description, type: typeof description })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Description is required and must be a non-empty string',
          received: { description, type: typeof description }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable is not set')
      throw new Error('GEMINI_API_KEY is not set')
    }
    console.log('Gemini API key found')

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Extract location information from context items
    const locationItems = contextItems?.filter(item => item.type === 'location_input') || []
    const locationInfo = locationItems.map(item => {
      if (item.metadata?.parsedLocation) {
        const loc = item.metadata.parsedLocation
        return {
          formatted_address: item.metadata.formatted_address,
          city: loc.city,
          state: loc.state,
          stateShort: loc.stateShort,
          county: loc.county,
          country: loc.country,
          zipCode: loc.zipCode
        }
      }
      return null
    }).filter(Boolean)

    const prompt = `You are an expert LinkedIn recruiter with 10+ years of experience creating sophisticated boolean search strings. Generate a comprehensive, precise LinkedIn boolean search string for this job posting.

Job Title: ${jobTitle || 'Not specified'}
Job Description: ${description}

${locationInfo.length > 0 ? `
LOCATION TARGETING (${locationInfo.length} location(s) specified):
${locationInfo.map((loc, index) => `
${index + 1}. ${loc.formatted_address}
   - City: ${loc.city || 'N/A'}
   - State: ${loc.state || 'N/A'} (${loc.stateShort || 'N/A'})
   - County: ${loc.county || 'N/A'}
   - ZIP: ${loc.zipCode || 'N/A'}
`).join('')}

IMPORTANT: Create comprehensive location OR terms including:
- City name and common variations
- State full name and abbreviation  
- County/region names
- ZIP code
- Metropolitan area terms
- "Greater [City]" variations
- Remote work variations if applicable
` : ''}

${contextItems && contextItems.length > 0 ? `
Additional Context (${contextItems.length} items):
${contextItems.map((item, index) => `
${index + 1}. ${item.type.replace('_', ' ').toUpperCase()} - ${item.title}
   ${item.summary || item.content.substring(0, 200) + (item.content.length > 200 ? '...' : '')}
   ${item.source_url ? `Source: ${item.source_url}` : ''}
   ${item.file_name ? `File: ${item.file_name}` : ''}
`).join('')}

Use this additional context to enhance the boolean search string with more specific terms, requirements, and qualifications mentioned in the context items.
` : ''}

Create a multi-layered boolean search strategy:

1. **Core Job Titles** (3-5 variations with OR):
   - Include exact matches, abbreviated forms, and industry variations
   - Consider both current and previous titles
   - Example: ("Software Engineer" OR "Software Developer" OR "SWE" OR "Application Developer")

2. **Required Skills & Technologies**:
   - Extract primary technical skills (programming languages, frameworks, tools)
   - Include both full names and common abbreviations
   - Group related technologies with OR, separate groups with AND
   - Example: (JavaScript OR JS OR Node.js) AND (React OR ReactJS)

3. **Experience Level Indicators**:
   - Add seniority keywords if mentioned: Senior, Lead, Principal, Staff, Junior, Entry
   - Include years of experience if specified
   - Example: ("Senior" OR "Lead" OR "Principal")

4. **Industry Context**:
   - Include relevant industry terms, company types, or domains
   - Add certifications or education requirements if mentioned

5. **Location Targeting** (if specified):
   - Create comprehensive location OR groups with all variations
   - Include city, state (full and abbreviated), county, ZIP code
   - Add metropolitan area terms ("Greater [City]", "[City] Metro", "[City] Area")
   - Include remote work terms if applicable ("remote", "work from home", "distributed")
   - Example: ("San Francisco" OR "SF" OR "Bay Area" OR "Silicon Valley" OR "94102" OR "94103" OR remote)

6. **Advanced Optimization**:
   - Use NOT operators to exclude irrelevant results
   - Include variations in spelling and terminology

7. **LinkedIn-Specific Optimization**:
   - Structure for LinkedIn's search algorithm
   - Use proper parentheses for operator precedence
   - Optimize for profile headline and summary matching

Output a single, production-ready boolean search string that balances:
- Precision (finds qualified candidates)
- Recall (doesn't miss good candidates)
- LinkedIn platform optimization

Return ONLY the boolean search string with no explanation, markdown, or formatting.`

    console.log('Generating content with Gemini...')
    const result = await model.generateContent(prompt)
    const searchString = result.response.text().trim()
    console.log('Generated search string:', searchString)

    if (!searchString) {
      console.error('Empty search string generated')
      throw new Error('Failed to generate boolean search string')
    }

    if (userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      await supabase
        .from('search_history')
        .insert({
          user_id: userId,
          query: searchString,
          search_type: 'job_boolean',
          source: 'generate-boolean-search',
          metadata: {
            job_title: jobTitle,
            generated_at: new Date().toISOString()
          }
        })
    }

    const response: BooleanSearchResponse = {
      success: true,
      searchString
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error generating boolean search:', error)
    
    const response: BooleanSearchResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})