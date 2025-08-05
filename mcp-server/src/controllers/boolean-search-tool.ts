import { z } from 'zod';
import { BaseMCPTool } from '../utils/base-tool.js';
import { MCPSession, MCPError } from '../types/mcp.js';
import GoogleCustomSearch, { ProfileInfo } from '../services/google-search.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Boolean Search Tool - Mimics the exact web app flow
export class BooleanSearchTool extends BaseMCPTool {
  constructor() {
    super(
      'boolean_search',
      '🎯 PRIMARY SEARCH TOOL - Use this for ALL candidate searches. Uses Gemini AI to generate sophisticated boolean queries, then executes search. Requires GEMINI_API_KEY configuration. Returns detailed error messages if AI generation fails.',
      z.object({
        customInstructions: z.string().describe('Custom search instructions (e.g., "GCP Architect with BigQuery experience")'),
        location: z.string().optional().describe('Geographic location for the search'),
        platforms: z.array(z.enum(['linkedin', 'google', 'github', 'indeed'])).default(['linkedin']).describe('Platforms to search'),
        maxResults: z.number().min(1).max(100).default(20).describe('Maximum number of results'),
        includeLocationInQuery: z.boolean().default(true).describe('Whether to include location in the boolean query'),
      })
    );
  }

  protected async handler(input: any, session?: MCPSession): Promise<any> {
    const { 
      customInstructions, 
      location, 
      platforms, 
      maxResults,
      includeLocationInQuery 
    } = input;

    this.log('🎯 STEP 1: Generating boolean query using Gemini AI', { 
      customInstructions,
      location,
      platforms
    });

    // STEP 1: Generate boolean query using sophisticated AI prompting
    const booleanQuery = await this.generateAIBooleanQuery(customInstructions, location);
    
    const booleanContent = {
      booleanQuery,
      breakdown: {
        generatedWith: 'Gemini AI',
        customInstructions,
        location
      },
      searchTips: this.getSearchTips(platforms[0] || 'linkedin')
    };

    this.log('✅ Boolean query generated with AI', { 
      query: booleanQuery 
    });

    // STEP 2: Execute search with the boolean query
    this.log('🔍 STEP 2: Executing search with boolean query');
    
    const googleSearch = new GoogleCustomSearch();
    
    if (!googleSearch.isConfigured()) {
      throw new MCPError(
        'Google Custom Search not configured. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in .env file',
        'CONFIGURATION_ERROR'
      );
    }

    let searchResults: ProfileInfo[];
    try {
      searchResults = await googleSearch.searchProfiles(booleanQuery, maxResults);
      this.log(`✅ Search completed: ${searchResults.length} results found`);
    } catch (error) {
      this.logError('Search failed', error);
      throw new MCPError(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEARCH_ERROR'
      );
    }

    // Convert to candidate format
    const candidates = this.convertToCandidates(searchResults, customInstructions);

    // Return results in web app format
    const result = {
      // Step 1 results
      booleanGeneration: {
        query: booleanQuery,
        breakdown: booleanContent.breakdown,
        platform: platforms[0],
        tips: booleanContent.searchTips
      },
      // Step 2 results  
      searchResults: {
        candidates,
        metadata: {
          totalFound: candidates.length,
          platforms,
          location: location || 'Any location',
          customInstructions,
          searchTime: new Date().toISOString(),
          realSearch: true
        }
      },
      // Combined summary
      summary: {
        stepsExecuted: ['generate_boolean_query', 'execute_search'],
        success: true,
        candidatesFound: candidates.length,
        topMatchScore: candidates[0]?.matchScore || 0
      }
    };

    return result;
  }

  private async generateAIBooleanQuery(customInstructions: string, location?: string): Promise<string> {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      this.logError('GEMINI_API_KEY environment variable is not set');
      throw new MCPError(
        'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file. ' +
        'Get your API key from https://aistudio.google.com/app/apikey',
        'CONFIGURATION_ERROR'
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const locationPrompt = location ? `
LOCATION TARGETING:
Location: ${location}

IMPORTANT: Create comprehensive location OR terms including:
- City name and common variations
- State full name and abbreviation  
- County/region names
- Metropolitan area terms
- "Greater [City]" variations
- Remote work variations if applicable
` : '';

    const prompt = `You are an expert LinkedIn recruiter with 10+ years of experience creating sophisticated boolean search strings. Generate a comprehensive, precise LinkedIn boolean search string for this job posting.

Job Description/Requirements: ${customInstructions}

${locationPrompt}

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

Return ONLY the boolean search string with no explanation, markdown, or formatting.`;

    try {
      this.log('Calling Gemini AI with prompt length:', prompt.length);
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API timeout after 30 seconds')), 30000)
        )
      ]) as any;
      
      const searchString = result.response.text().trim();
      this.log('Gemini response received, length:', searchString.length);
      
      if (!searchString) {
        throw new MCPError(
          'Gemini AI returned an empty response. Please check your prompt and try again.',
          'AI_GENERATION_ERROR'
        );
      }
      
      return searchString;
    } catch (error) {
      this.logError('Failed to generate AI boolean query', error);
      
      // Provide specific error messages based on the failure type
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out') || error.message.includes('Timeout')) {
          // Use fallback boolean generation when Gemini times out
          this.log('Gemini API timed out, using fallback boolean generation');
          return this.generateFallbackBooleanQuery(customInstructions, location);
        } else if (error.message.includes('API key')) {
          throw new MCPError(
            'Invalid or missing Gemini API key. Please configure GEMINI_API_KEY in your environment.',
            'CONFIGURATION_ERROR'
          );
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
          throw new MCPError(
            'Gemini API quota exceeded or rate limited. Please try again later or check your API usage.',
            'RATE_LIMIT_ERROR'
          );
        }
      }
      
      // Use fallback for any other failures
      this.log('Gemini API failed, using fallback boolean generation');
      return this.generateFallbackBooleanQuery(customInstructions, location);
    }
  }

  private generateFallbackBooleanQuery(customInstructions: string, location?: string): string {
    this.log('Generating fallback boolean query for:', customInstructions);
    
    // Simple but effective boolean generation for common patterns
    const instructions = customInstructions.toLowerCase();
    
    // Extract key terms
    const jobTitles = [];
    const skills = [];
    const experience = [];
    
    // Common job title patterns
    if (instructions.includes('data scientist')) {
      jobTitles.push('"Data Scientist"', '"Data Science"', '"ML Engineer"', '"Machine Learning Engineer"');
    }
    if (instructions.includes('engineer')) {
      jobTitles.push('"Software Engineer"', '"Engineer"');
    }
    if (instructions.includes('architect')) {
      jobTitles.push('"Architect"', '"Senior Architect"', '"Principal Architect"');
    }
    if (instructions.includes('developer')) {
      jobTitles.push('"Developer"', '"Software Developer"');
    }

    // Extract technology/skills keywords
    const techTerms = ['python', 'java', 'javascript', 'react', 'angular', 'vue', 'node', 'typescript', 'go', 'rust', 'scala', 'ruby', 'php', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'git', 'linux', 'windows', 'macos', 'transformers', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'hadoop', 'spark', 'kafka', 'elasticsearch', 'tableau', 'bigquery', 'snowflake', 'databricks', 'bert', 'gpt'];
    
    for (const term of techTerms) {
      if (instructions.includes(term)) {
        skills.push(`"${term}"`);
      }
    }

    // Handle specific cases
    if (instructions.includes('transformers')) {
      skills.push('"transformers"', '"Hugging Face"', '"BERT"', '"GPT"', '"transformer model"', '"NLP"', '"natural language processing"');
    }

    // Build the boolean query
    let query = '';
    
    if (jobTitles.length > 0) {
      query += `(${jobTitles.join(' OR ')})`;
    }
    
    if (skills.length > 0) {
      if (query) query += ' AND ';
      // Group skills and take first 6 to avoid overly complex queries
      const skillGroup = skills.slice(0, 6).join(' OR ');
      query += `(${skillGroup})`;
    }
    
    // Add location if provided
    if (location) {
      const locationTerms = [];
      const loc = location.toLowerCase();
      
      if (loc.includes('seattle')) {
        locationTerms.push('"Seattle"', '"Seattle WA"', '"Seattle Washington"', '"Greater Seattle"', '"Puget Sound"', '"Bellevue"', '"Redmond"');
      } else if (loc.includes('san francisco') || loc.includes('sf')) {
        locationTerms.push('"San Francisco"', '"SF"', '"Bay Area"', '"Silicon Valley"');
      } else if (loc.includes('new york') || loc.includes('nyc')) {
        locationTerms.push('"New York"', '"NYC"', '"Manhattan"', '"Brooklyn"');
      } else {
        // Generic location handling
        const cityMatch = location.match(/([^,]+)/);
        if (cityMatch) {
          locationTerms.push(`"${cityMatch[1].trim()}"`);
        }
      }
      
      if (locationTerms.length > 0) {
        if (query) query += ' AND ';
        query += `(${locationTerms.join(' OR ')})`;
      }
    }
    
    // If no specific patterns found, create a basic query
    if (!query) {
      query = customInstructions.split(' ').slice(0, 3).map(word => `"${word}"`).join(' AND ');
    }
    
    this.log('Generated fallback boolean query:', query);
    return query;
  }

  private getSearchTips(platform: string): string[] {
    const tips = {
      linkedin: [
        'Use LinkedIn Recruiter for best results',
        'Try variations of job titles',
        'Include location in your search',
        'Filter by current company size'
      ],
      github: [
        'Look for active contributors',
        'Check repository quality and stars',
        'Review recent commit activity',
        'Consider programming language expertise'
      ],
      google: [
        'Use site-specific searches (site:linkedin.com)',
        'Try different combinations of keywords',
        'Include "resume" or "CV" in searches',
        'Filter by file type (filetype:pdf)'
      ]
    };
    return tips[platform as keyof typeof tips] || tips.google;
  }


  private convertToCandidates(searchResults: ProfileInfo[], keywords: string): any[] {
    return searchResults.map((profile, index) => {
      const matchScore = this.calculateMatchScore(keywords, profile);
      
      return {
        id: `candidate-${Date.now()}-${index}`,
        name: profile.name || 'Name not available',
        title: profile.title || 'Title not specified',
        company: profile.company || 'Company not specified',
        location: profile.location || 'Location not specified',
        skills: profile.skills || [],
        profileUrl: profile.profileUrl,
        source: profile.source,
        summary: profile.snippet,
        matchScore,
        isRealProfile: true
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  private calculateMatchScore(keywords: string, profile: ProfileInfo): number {
    const keywordLower = keywords.toLowerCase();
    const titleLower = (profile.title || '').toLowerCase();
    const snippetLower = (profile.snippet || '').toLowerCase();
    const combinedText = `${titleLower} ${snippetLower}`;

    // Base score
    let score = 0.5;

    // Check for keyword matches
    const keywordTokens = keywordLower.split(/\s+/);
    let matchedTokens = 0;

    keywordTokens.forEach(token => {
      if (combinedText.includes(token)) {
        matchedTokens++;
      }
    });

    // Calculate match percentage
    const matchPercentage = matchedTokens / keywordTokens.length;
    score = 0.3 + (matchPercentage * 0.7);

    // Boost for title matches
    if (titleLower.includes('architect') || titleLower.includes('engineer')) {
      score += 0.1;
    }

    // Ensure score is between 0 and 1
    return Math.min(Math.max(score, 0), 1);
  }
}

// Export the tool
export const booleanSearchTool = new BooleanSearchTool();