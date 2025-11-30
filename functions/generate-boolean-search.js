const { onCall, HttpsError } = require('firebase-functions/v2/https');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.generateBooleanSearch = onCall(
  {
    cors: true,
    maxInstances: 10,
    secrets: ['GEMINI_API_KEY']
  },
  async (request) => {
    console.log('Generate boolean search function called');

    // In v2, data and auth are on the request object
    const data = request.data;
    const auth = request.auth;

    // Check authentication if userId is provided
    if (data.userId && !auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to save search history'
      );
    }

    const { description, jobTitle, userId, contextItems, projectContext } = data;

    console.log('🔍 RAW DATA RECEIVED:', {
      hasDescription: !!description,
      descriptionType: typeof description,
      descriptionValue: description,
      hasContextItems: !!contextItems,
      contextItemsType: typeof contextItems,
      contextItemsIsArray: Array.isArray(contextItems),
      contextItemsLength: contextItems?.length,
      jobTitle,
      projectContext: projectContext ? 'present' : 'absent'
    });

    // Validate required fields - either description OR context items must be provided
    const hasDescription = description !== undefined &&
      description !== null &&
      typeof description === 'string' &&
      description.trim() !== '';

    const hasContextItems = contextItems !== undefined &&
      contextItems !== null &&
      Array.isArray(contextItems) &&
      contextItems.length > 0;

    console.log('✅ VALIDATION RESULTS:', {
      hasDescription,
      hasContextItems,
      willProceed: hasDescription || hasContextItems
    });

    if (!hasDescription && !hasContextItems) {
      console.error('❌ VALIDATION FAILED - Neither description nor context items provided');
      throw new HttpsError(
        'invalid-argument',
        'Either description or context items must be provided',
        {
          received: {
            hasDescription,
            hasContextItems,
            descriptionType: typeof description,
            descriptionValue: description === undefined ? 'undefined' : (description === null ? 'null' : description),
            contextItemsType: typeof contextItems,
            contextItemsLength: contextItems?.length || 0
          }
        }
      );
    }

    console.log('🎯 BOOLEAN GENERATION - Full Context Received:');
    console.log('  - Job Title:', jobTitle || 'Not provided');
    console.log('  - Description:', hasDescription ? `${description.length} chars` : 'Not provided');
    console.log('  - Context Items:', contextItems?.length || 0);
    console.log('  - Project Context:', projectContext ? `${projectContext.name} (${projectContext.id})` : 'Not provided');
    console.log('  - Context Item Types:', contextItems?.map(item => item.type).join(', ') || 'None');

    try {
      // Get Gemini API key from secret (injected by Firebase)
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error('GEMINI_API_KEY is not configured');
        throw new HttpsError(
          'failed-precondition',
          'GEMINI_API_KEY is not configured'
        );
      }

      console.log('Gemini API key found from secret manager');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

      // Extract location information from context items
      const locationItems = contextItems?.filter(item =>
        item.type === 'location_input' ||
        (item.type === 'manual_input' && item.metadata?.isLocationContext) ||
        (item.type === 'manual_input' && item.title?.includes('Location:'))
      ) || [];

      console.log('🎯 CLOUD FUNCTION LOCATION PROCESSING:');
      console.log('1. Total context items received:', contextItems?.length || 0);
      console.log('2. Location items found:', locationItems.length);
      console.log('3. Location items details:', locationItems.map(item => ({
        type: item.type,
        title: item.title,
        hasMetadata: !!item.metadata,
        hasParsedLocation: !!item.metadata?.parsedLocation,
        metadata: item.metadata
      })));

      const locationInfo = locationItems.map(item => {
        if (item.metadata?.parsedLocation) {
          const loc = item.metadata.parsedLocation;
          console.log('   ✅ Processing location with parsed data:', {
            formatted_address: item.metadata.formatted_address,
            parsedLocation: loc
          });
          return {
            formatted_address: item.metadata.formatted_address,
            city: loc.city,
            state: loc.state,
            stateShort: loc.stateShort,
            county: loc.county,
            country: loc.country,
            zipCode: loc.zipCode
          };
        } else {
          console.log('   ⚠️ Location item missing parsed data:', {
            type: item.type,
            title: item.title,
            hasMetadata: !!item.metadata,
            metadata: item.metadata
          });
        }
        return null;
      }).filter(Boolean);

      console.log('4. Final location info for prompt:', locationInfo);

      // Organize context items by type for better prompt structure
      const perplexityItems = contextItems?.filter(item => item.type === 'perplexity' || item.type === 'perplexity_search') || [];
      const firecrawlItems = contextItems?.filter(item => item.type === 'url_scrape') || [];
      const documentItems = contextItems?.filter(item => item.type === 'document_upload') || [];
      const manualItems = contextItems?.filter(item => item.type === 'manual_input' && !item.metadata?.isLocationContext) || [];

      const prompt = `You are an expert LinkedIn recruiter with 10+ years of experience creating sophisticated boolean search strings. Generate a comprehensive, precise LinkedIn boolean search string using ALL available context.

${projectContext ? `
🏢 PROJECT CONTEXT:
- Project Name: ${projectContext.name}
- Project Description: ${projectContext.description || 'N/A'}
Use this project context to understand the broader hiring goals and organizational needs.
` : ''}

📋 PRIMARY REQUIREMENTS:
Job Title: ${jobTitle || 'Not specified'}
${hasDescription ? `Job Description: ${description}` : '** No explicit job description provided - rely entirely on context items below **'}

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

${perplexityItems.length > 0 ? `
🔍 PERPLEXITY AI RESEARCH (${perplexityItems.length} items):
${perplexityItems.map((item, index) => `
${index + 1}. ${item.title}
   ${item.summary || item.content.substring(0, 300) + (item.content.length > 300 ? '...' : '')}
   ${item.metadata?.citations ? `Citations: ${item.metadata.citations.length}` : ''}
`).join('')}
** Use these AI-researched insights to add industry-specific terms, emerging skills, and market context to your boolean search **
` : ''}

${firecrawlItems.length > 0 ? `
🌐 WEB SCRAPED CONTENT (${firecrawlItems.length} items):
${firecrawlItems.map((item, index) => `
${index + 1}. ${item.title}
   Source: ${item.source_url || 'N/A'}
   ${item.summary || item.content.substring(0, 300) + (item.content.length > 300 ? '...' : '')}
`).join('')}
** Extract specific requirements, tech stacks, and qualifications from these job postings/company pages **
` : ''}

${documentItems.length > 0 ? `
📄 UPLOADED DOCUMENTS (${documentItems.length} items):
${documentItems.map((item, index) => `
${index + 1}. ${item.file_name || item.title}
   ${item.summary || item.content.substring(0, 300) + (item.content.length > 300 ? '...' : '')}
`).join('')}
** Parse requirements, qualifications, and skills from these formal documents **
` : ''}

${manualItems.length > 0 ? `
✍️ MANUAL CONTEXT NOTES (${manualItems.length} items):
${manualItems.map((item, index) => `
${index + 1}. ${item.title}
   ${item.content.substring(0, 300) + (item.content.length > 300 ? '...' : '')}
`).join('')}
** Incorporate these user-provided notes and special requirements **
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

🎯 CRITICAL INSTRUCTIONS:
1. **USE ALL AVAILABLE CONTEXT**: Synthesize information from ALL sections above (project context, location, Perplexity research, scraped content, documents, and manual notes)
2. **Be Comprehensive**: Include terms from every provided context source
3. **Prioritize Specificity**: Use exact technologies, frameworks, and skills mentioned in context items
4. **Location Integration**: If location is specified, create comprehensive location OR groups
5. **Balance Precision & Recall**: Don't be too narrow (miss good candidates) or too broad (irrelevant results)

Output a single, production-ready boolean search string that:
- Incorporates insights from ALL ${(perplexityItems.length + firecrawlItems.length + documentItems.length + manualItems.length + (projectContext ? 1 : 0) + locationInfo.length)} context sources provided
- Balances precision (finds qualified candidates) with recall (doesn't miss good candidates)
- Is optimized for LinkedIn's search algorithm

Return ONLY the boolean search string with no explanation, markdown, or formatting.`;

      console.log('5. Generating content with Gemini using FULL CONTEXT:');
      console.log('   - Project Context:', projectContext ? 'YES' : 'NO');
      console.log('   - Location count:', locationInfo.length);
      console.log('   - Perplexity items:', perplexityItems.length);
      console.log('   - Firecrawl items:', firecrawlItems.length);
      console.log('   - Document items:', documentItems.length);
      console.log('   - Manual context items:', manualItems.length);
      console.log('   - Total context sources:', (perplexityItems.length + firecrawlItems.length + documentItems.length + manualItems.length + (projectContext ? 1 : 0) + locationInfo.length));
      console.log('   - Prompt length:', prompt.length, 'chars');

      const result = await model.generateContent(prompt);
      const searchString = result.response.text().trim();
      console.log('6. Generated search string:', searchString);

      if (!searchString) {
        console.error('Empty search string generated');
        throw new Error('Failed to generate boolean search string');
      }

      // Save to Firestore if userId is provided
      if (userId && auth) {
        try {
          const db = admin.firestore();
          await db.collection('search_history').add({
            user_id: userId,
            query: searchString,
            search_type: 'job_boolean',
            source: 'generate-boolean-search',
            metadata: {
              job_title: jobTitle,
              generated_at: new Date()
            },
            created_at: new Date()
          });
          console.log('Search history saved to Firestore');
        } catch (dbError) {
          console.error('Failed to save search history:', dbError);
          // Don't fail the request if saving history fails
        }
      }

      return {
        success: true,
        searchString,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating boolean search:', error);

      if (error.message?.includes('API key')) {
        throw new HttpsError(
          'failed-precondition',
          'API configuration error. Please check server configuration.'
        );
      }

      throw new HttpsError(
        'internal',
        error.message || 'Failed to generate boolean search',
        error.details
      );
    }
  });
