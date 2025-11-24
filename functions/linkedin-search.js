const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

/**
 * LinkedIn Search Firebase Cloud Function
 * Migrated from Supabase Edge Function
 *
 * This function provides LinkedIn-specific candidate search capabilities:
 * - Generates AI-powered boolean search queries optimized for LinkedIn
 * - Executes searches via Google Custom Search Engine
 * - Returns formatted LinkedIn profile results
 * - Supports pagination and location-based filtering
 *
 * @param {Object} request - HTTP request object
 * @param {string} request.body.keywords - Search keywords/job description
 * @param {string} request.body.location - Geographic location (optional)
 * @param {number} request.body.maxResults - Maximum results to return (default: 20, max: 100)
 * @param {number} request.body.page - Page number for pagination (default: 1)
 * @param {string} request.body.experienceLevel - Experience level filter (optional)
 * @param {boolean} request.body.useAIGeneration - Whether to use AI for boolean query generation (default: true)
 */
const linkedinSearch = onRequest(
  {
    cors: true,
    timeoutSeconds: 120,
    memory: '256MiB'
  },
  async (request, response) => {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      response.set(corsHeaders);
      response.status(200).send();
      return;
    }

    // Set CORS headers for all responses
    response.set(corsHeaders);

    try {
      logger.info('LinkedIn search function called', {
        method: request.method,
        hasBody: !!request.body
      });

      // Validate request method
      if (request.method !== 'POST') {
        response.status(405).json({
          success: false,
          error: 'Method not allowed. Use POST.'
        });
        return;
      }

      // Extract and validate request parameters
      const {
        keywords,
        location,
        maxResults = 20,
        page = 1,
        experienceLevel,
        useAIGeneration = true
      } = request.body;

      // Validate required parameters
      if (!keywords || typeof keywords !== 'string' || keywords.trim() === '') {
        response.status(400).json({
          success: false,
          error: 'Keywords parameter is required and must be a non-empty string'
        });
        return;
      }

      // Validate maxResults
      const validatedMaxResults = Math.min(Math.max(parseInt(maxResults) || 20, 1), 100);
      const validatedPage = Math.max(parseInt(page) || 1, 1);

      logger.info('Processing LinkedIn search request', {
        keywords: keywords.substring(0, 50) + '...',
        location,
        maxResults: validatedMaxResults,
        page: validatedPage,
        useAIGeneration
      });

      // Step 1: Generate optimized boolean search query
      let booleanQuery;
      try {
        if (useAIGeneration) {
          booleanQuery = await generateAIBooleanQuery(keywords, location, experienceLevel);
        } else {
          booleanQuery = generateBasicBooleanQuery(keywords, location, experienceLevel);
        }
        logger.info('Boolean query generated', {
          queryLength: booleanQuery.length,
          method: useAIGeneration ? 'AI' : 'Basic'
        });
      } catch (error) {
        logger.error('Failed to generate boolean query', error);
        // Fallback to basic query generation
        booleanQuery = generateBasicBooleanQuery(keywords, location, experienceLevel);
        logger.info('Using fallback boolean query generation');
      }

      // Step 2: Execute LinkedIn search via Google Custom Search
      let searchResults;
      try {
        searchResults = await executeLinkedInSearch(
          booleanQuery,
          validatedMaxResults,
          validatedPage
        );
        logger.info('LinkedIn search completed', {
          resultsFound: searchResults.length
        });
      } catch (error) {
        logger.error('LinkedIn search failed', error);
        throw error;
      }

      // Step 3: Process and format results
      const formattedResults = formatLinkedInResults(searchResults, keywords);

      // Step 4: Calculate match scores and sort by relevance
      const scoredResults = calculateMatchScores(formattedResults, keywords, experienceLevel);

      // Prepare response
      const responseData = {
        success: true,
        data: {
          profiles: scoredResults,
          metadata: {
            totalFound: scoredResults.length,
            page: validatedPage,
            maxResults: validatedMaxResults,
            location: location || 'Any location',
            keywords,
            experienceLevel,
            booleanQuery,
            searchTime: new Date().toISOString(),
            source: 'linkedin-search-firebase'
          }
        }
      };

      logger.info('LinkedIn search successful', {
        profilesReturned: scoredResults.length,
        topMatchScore: scoredResults[0]?.matchScore || 0
      });

      response.status(200).json(responseData);

    } catch (error) {
      logger.error('LinkedIn search function error', error);

      response.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        details: 'An error occurred while processing the LinkedIn search request'
      });
    }
  }
);

/**
 * Generate AI-powered boolean search query using Gemini
 * @param {string} keywords - Search keywords
 * @param {string} location - Location filter
 * @param {string} experienceLevel - Experience level filter
 * @returns {Promise<string>} Generated boolean query
 */
async function generateAIBooleanQuery(keywords, location, experienceLevel) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const locationPrompt = location ? `
LOCATION TARGETING:
Location: ${location}

Create comprehensive location OR terms including:
- City name and common variations
- State full name and abbreviation
- County/region names
- Metropolitan area terms
- "Greater [City]" variations
- Remote work variations if applicable
` : '';

  const experiencePrompt = experienceLevel ? `
EXPERIENCE LEVEL:
Target Experience: ${experienceLevel}

Include appropriate seniority keywords:
- Senior, Lead, Principal, Staff for senior roles
- Junior, Entry, Associate for entry-level roles
- Mid-level, Intermediate for mid-level roles
` : '';

  const prompt = `You are an expert LinkedIn recruiter creating sophisticated boolean search strings specifically for LinkedIn profiles. Generate a comprehensive LinkedIn boolean search string for this job posting.

Job Description/Requirements: ${keywords}

${locationPrompt}
${experiencePrompt}

Create a multi-layered LinkedIn-optimized boolean search strategy:

1. **Core Job Titles** (3-5 variations with OR):
   - Include exact matches, abbreviated forms, and industry variations
   - Consider both current and previous titles commonly found on LinkedIn
   - Example: ("Software Engineer" OR "Software Developer" OR "SWE" OR "Full Stack Developer")

2. **Required Skills & Technologies**:
   - Extract primary technical skills (programming languages, frameworks, tools)
   - Include both full names and common abbreviations as they appear on LinkedIn profiles
   - Group related technologies with OR, separate groups with AND
   - Example: (JavaScript OR JS OR "Node.js") AND (React OR ReactJS OR "React.js")

3. **Experience Level Indicators**:
   - Add seniority keywords if mentioned: Senior, Lead, Principal, Staff, Junior, Entry
   - Include years of experience if specified
   - Example: ("Senior" OR "Lead" OR "Principal" OR "Sr.")

4. **LinkedIn Profile Optimization**:
   - Structure for LinkedIn's profile search algorithm
   - Target headline and summary content
   - Include common LinkedIn terminology and phrases
   - Optimize for how professionals describe themselves on LinkedIn

5. **Location Targeting** (if specified):
   - Create comprehensive location OR groups with all variations
   - Include city, state (full and abbreviated), metropolitan areas
   - Add remote work terms: ("remote" OR "work from home" OR "distributed" OR "anywhere")
   - Example: ("San Francisco" OR "SF" OR "Bay Area" OR "Silicon Valley" OR remote)

6. **Advanced Optimization**:
   - Use NOT operators to exclude irrelevant results
   - Include variations in spelling and terminology
   - Consider LinkedIn-specific phrases and job descriptions

Output a single, production-ready boolean search string optimized for LinkedIn that balances:
- Precision (finds qualified candidates)
- Recall (doesn't miss good candidates)
- LinkedIn platform specificity

Return ONLY the boolean search string with no explanation, markdown, or formatting.`;

  try {
    logger.info('Calling Gemini AI for boolean query generation');
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout after 30 seconds')), 30000)
      )
    ]);

    const searchString = result.response.text().trim();

    if (!searchString) {
      throw new Error('Gemini AI returned an empty response');
    }

    return searchString;
  } catch (error) {
    logger.error('Gemini AI boolean generation failed', error);
    throw error;
  }
}

/**
 * Generate basic boolean search query without AI
 * @param {string} keywords - Search keywords
 * @param {string} location - Location filter
 * @param {string} experienceLevel - Experience level filter
 * @returns {string} Basic boolean query
 */
function generateBasicBooleanQuery(keywords, location, experienceLevel) {
  const keywordsLower = keywords.toLowerCase();
  const titleTerms = [];
  const skillTerms = [];
  const experienceTerms = [];

  // Extract job titles
  const jobTitlePatterns = [
    'software engineer', 'developer', 'architect', 'data scientist',
    'product manager', 'designer', 'analyst', 'consultant'
  ];

  for (const pattern of jobTitlePatterns) {
    if (keywordsLower.includes(pattern)) {
      titleTerms.push(`"${pattern}"`);
    }
  }

  // Extract technology skills
  const techSkills = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node',
    'typescript', 'go', 'rust', 'sql', 'aws', 'azure', 'gcp', 'docker',
    'kubernetes', 'tensorflow', 'pytorch', 'machine learning', 'ai'
  ];

  for (const skill of techSkills) {
    if (keywordsLower.includes(skill)) {
      skillTerms.push(`"${skill}"`);
    }
  }

  // Add experience level terms
  if (experienceLevel) {
    const expLevel = experienceLevel.toLowerCase();
    if (expLevel.includes('senior')) {
      experienceTerms.push('"Senior"', '"Sr."', '"Lead"');
    } else if (expLevel.includes('junior') || expLevel.includes('entry')) {
      experienceTerms.push('"Junior"', '"Entry"', '"Associate"');
    } else if (expLevel.includes('mid')) {
      experienceTerms.push('"Mid"', '"Intermediate"');
    }
  }

  // Build query
  let query = '';

  if (titleTerms.length > 0) {
    query += `(${titleTerms.slice(0, 4).join(' OR ')})`;
  }

  if (skillTerms.length > 0) {
    if (query) query += ' AND ';
    query += `(${skillTerms.slice(0, 6).join(' OR ')})`;
  }

  if (experienceTerms.length > 0) {
    if (query) query += ' AND ';
    query += `(${experienceTerms.join(' OR ')})`;
  }

  // Add location
  if (location) {
    if (query) query += ' AND ';
    query += `("${location}" OR remote)`;
  }

  // Fallback if no patterns matched
  if (!query) {
    const keywordTokens = keywords.split(' ').slice(0, 3);
    query = keywordTokens.map(word => `"${word}"`).join(' AND ');
  }

  return query;
}

/**
 * Execute LinkedIn search via Google Custom Search Engine
 * @param {string} booleanQuery - Boolean search query
 * @param {number} maxResults - Maximum results to return
 * @param {number} page - Page number for pagination
 * @returns {Promise<Array>} Search results
 */
async function executeLinkedInSearch(booleanQuery, maxResults, page) {
  const googleCseApiKey = process.env.GOOGLE_CSE_API_KEY;
  const googleCseId = process.env.GOOGLE_CSE_ID;

  if (!googleCseApiKey || !googleCseId) {
    throw new Error('Google Custom Search Engine not configured. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID');
  }

  // LinkedIn-specific search query
  const linkedinQuery = `site:linkedin.com/in/ ${booleanQuery}`;
  const startIndex = ((page - 1) * 10) + 1; // Google CSE uses 1-based indexing

  const searchUrl = 'https://www.googleapis.com/customsearch/v1';
  const params = {
    key: googleCseApiKey,
    cx: googleCseId,
    q: linkedinQuery,
    num: Math.min(maxResults, 10), // Google CSE max is 10 per request
    start: startIndex,
    safe: 'off'
  };

  try {
    logger.info('Executing Google Custom Search', {
      query: linkedinQuery.substring(0, 100) + '...',
      startIndex,
      maxResults
    });

    const response = await axios.get(searchUrl, {
      params,
      timeout: 30000 // 30 second timeout
    });

    if (!response.data || !response.data.items) {
      logger.warn('No search results returned from Google CSE');
      return [];
    }

    return response.data.items;
  } catch (error) {
    logger.error('Google Custom Search request failed', error);

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 403) {
        throw new Error('Google Custom Search API quota exceeded or access denied');
      } else if (status === 400) {
        throw new Error('Invalid search query or parameters');
      } else {
        throw new Error(`Google Custom Search API error: ${status} - ${data.error?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Search request timed out');
    } else {
      throw new Error(`Search request failed: ${error.message}`);
    }
  }
}

/**
 * Format Google Custom Search results for LinkedIn profiles
 * @param {Array} searchResults - Raw search results from Google CSE
 * @param {string} keywords - Original search keywords
 * @returns {Array} Formatted LinkedIn profiles
 */
function formatLinkedInResults(searchResults, keywords) {
  return searchResults.map((item, index) => {
    // Extract LinkedIn profile information from search result
    const profileUrl = item.link;
    const title = item.title || '';
    const snippet = item.snippet || '';

    // Parse LinkedIn profile data from title and snippet
    const { name, jobTitle, company, location } = parseLinkedInProfile(title, snippet);

    return {
      id: `linkedin-${Date.now()}-${index}`,
      name: name || 'Name not available',
      title: jobTitle || 'Title not specified',
      company: company || 'Company not specified',
      location: location || 'Location not specified',
      profileUrl,
      source: 'LinkedIn',
      summary: snippet,
      skills: extractSkillsFromSnippet(snippet),
      isRealProfile: true,
      searchRank: index + 1
    };
  });
}

/**
 * Parse LinkedIn profile information from search result title and snippet
 * @param {string} title - Search result title
 * @param {string} snippet - Search result snippet
 * @returns {Object} Parsed profile data
 */
function parseLinkedInProfile(title, snippet) {
  // LinkedIn titles often follow pattern: "Name | Job Title at Company"
  const titleParts = title.split(' | ');
  let name = '';
  let jobTitle = '';
  let company = '';
  let location = '';

  if (titleParts.length >= 2) {
    name = titleParts[0].replace(/^LinkedIn$/, '').trim();
    const roleAndCompany = titleParts[1];

    // Try to split role and company
    const atIndex = roleAndCompany.lastIndexOf(' at ');
    if (atIndex > -1) {
      jobTitle = roleAndCompany.substring(0, atIndex).trim();
      company = roleAndCompany.substring(atIndex + 4).trim();
    } else {
      jobTitle = roleAndCompany;
    }
  }

  // Extract location from snippet if available
  const locationMatch = snippet.match(/(?:Location:|Based in:|Located in:)\s*([^.]+)/i);
  if (locationMatch) {
    location = locationMatch[1].trim();
  }

  return { name, jobTitle, company, location };
}

/**
 * Extract skills from LinkedIn profile snippet
 * @param {string} snippet - Profile snippet text
 * @returns {Array} Extracted skills
 */
function extractSkillsFromSnippet(snippet) {
  const skills = [];
  const commonTechSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Angular', 'Vue', 'Node.js',
    'TypeScript', 'Go', 'Rust', 'C++', 'C#', 'SQL', 'PostgreSQL', 'MySQL',
    'MongoDB', 'Redis', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'TensorFlow', 'PyTorch', 'Machine Learning', 'AI', 'Data Science'
  ];

  const snippetLower = snippet.toLowerCase();

  for (const skill of commonTechSkills) {
    if (snippetLower.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }

  return skills;
}

/**
 * Calculate match scores for search results
 * @param {Array} profiles - Formatted LinkedIn profiles
 * @param {string} keywords - Original search keywords
 * @param {string} experienceLevel - Experience level filter
 * @returns {Array} Profiles with match scores, sorted by relevance
 */
function calculateMatchScores(profiles, keywords, experienceLevel) {
  const keywordsLower = keywords.toLowerCase();
  const keywordTokens = keywordsLower.split(/\s+/);

  return profiles.map(profile => {
    const titleLower = profile.title.toLowerCase();
    const summaryLower = profile.summary.toLowerCase();
    const combinedText = `${titleLower} ${summaryLower}`;

    let score = 0.5; // Base score
    let matchedTokens = 0;

    // Check keyword matches
    keywordTokens.forEach(token => {
      if (combinedText.includes(token)) {
        matchedTokens++;
      }
    });

    // Calculate match percentage
    const matchPercentage = matchedTokens / keywordTokens.length;
    score = 0.3 + (matchPercentage * 0.5);

    // Boost for title matches
    if (titleLower.includes('engineer') || titleLower.includes('developer') ||
        titleLower.includes('architect') || titleLower.includes('manager')) {
      score += 0.1;
    }

    // Experience level boost
    if (experienceLevel) {
      const expLower = experienceLevel.toLowerCase();
      if ((expLower.includes('senior') && (titleLower.includes('senior') || titleLower.includes('lead'))) ||
          (expLower.includes('junior') && (titleLower.includes('junior') || titleLower.includes('entry')))) {
        score += 0.1;
      }
    }

    // Skills match boost
    if (profile.skills.length > 0) {
      score += Math.min(profile.skills.length * 0.02, 0.1);
    }

    // Ensure score is between 0 and 1
    profile.matchScore = Math.min(Math.max(score, 0), 1);
    return profile;
  }).sort((a, b) => b.matchScore - a.matchScore);
}

// Export the function
module.exports = {
  linkedinSearch
};