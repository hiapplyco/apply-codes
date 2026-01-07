const { onRequest } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Generate sophisticated boolean search strings with variant support and re-roll capability
 *
 * Payload:
 * - jobContext: Structured job information (title, location, skills, etc.)
 * - generatedDescription: The job description text
 * - previousGenerations: Array of previously generated strings (for re-roll deduplication)
 * - variant: 'strict' | 'balanced' | 'broad'
 * - isReroll: boolean
 */
exports.generateSophisticatedBoolean = onRequest(
  {
    cors: true,
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (req, res) => {
    // Set CORS headers
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    try {
      const {
        jobContext,
        generatedDescription,
        previousGenerations = [],
        variant = 'balanced',
        isReroll = false
      } = req.body;

      console.log('[generateSophisticatedBoolean] Request received:', {
        hasJobContext: !!jobContext,
        variant,
        isReroll,
        previousCount: previousGenerations.length
      });

      // Validate required fields
      if (!jobContext || !jobContext.title) {
        res.status(400).json({
          success: false,
          error: 'jobContext with title is required'
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Build variant-specific instructions
      const variantInstructions = {
        strict: `STRICT MODE: Create a highly precise search that prioritizes exact matches.
- Use exact job title matches with few variations
- Require ALL must-have skills (AND operators)
- Strict location matching
- Include experience level requirements
- Result: Fewer but highly qualified candidates`,

        balanced: `BALANCED MODE: Create a well-rounded search that balances precision with reach.
- Include 3-5 job title variations (OR operators)
- Require core skills, make others optional
- Include location variations and remote options
- Balance specificity with discoverability
- Result: Good quality candidates with reasonable volume`,

        broad: `BROAD MODE: Create an expansive search to maximize candidate pool.
- Include many job title variations and related roles
- Use OR operators liberally for skills
- Include wide location radius and remote options
- Focus on transferable skills and potential
- Result: Maximum candidate volume for pipeline building`
      };

      // Build the prompt
      const prompt = `You are an expert LinkedIn recruiter creating optimized boolean search strings.

## Job Context
- **Title:** ${jobContext.title}
${jobContext.specialty ? `- **Specialty:** ${jobContext.specialty}` : ''}
${jobContext.location ? `- **Location:** ${jobContext.location.city}, ${jobContext.location.state} (${jobContext.location.workArrangement})` : ''}
- **Employment Type:** ${jobContext.employmentType || 'Full-time'}
${jobContext.level ? `- **Level:** ${jobContext.level}` : ''}
${jobContext.experienceYears ? `- **Experience:** ${jobContext.experienceYears}+ years` : ''}
${jobContext.industry ? `- **Industry:** ${jobContext.industry}` : ''}

## Skills & Requirements
${jobContext.mustHaveSkills?.length ? `**Must Have:** ${jobContext.mustHaveSkills.join(', ')}` : ''}
${jobContext.niceToHaveSkills?.length ? `**Nice to Have:** ${jobContext.niceToHaveSkills.join(', ')}` : ''}
${jobContext.technicalSkills?.length ? `**Technical Skills:** ${jobContext.technicalSkills.join(', ')}` : ''}
${jobContext.certifications?.length ? `**Certifications:** ${jobContext.certifications.join(', ')}` : ''}
${jobContext.licensure?.length ? `**Licensure:** ${jobContext.licensure.join(', ')}` : ''}
${jobContext.keywords?.length ? `**Keywords:** ${jobContext.keywords.join(', ')}` : ''}

${generatedDescription ? `## Job Description Summary
${generatedDescription.substring(0, 1000)}${generatedDescription.length > 1000 ? '...' : ''}` : ''}

## Search Strategy
${variantInstructions[variant] || variantInstructions.balanced}

${isReroll && previousGenerations.length > 0 ? `
## RE-ROLL REQUIREMENT
This is a re-roll request. You MUST generate a DIFFERENT search string.
Previously generated strings (DO NOT repeat these):
${previousGenerations.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Create a meaningfully different approach:
- Try different job title variations
- Emphasize different skills combinations
- Use alternative industry terms
- Vary the structure and operator placement
` : ''}

## Output Requirements
1. Create a production-ready LinkedIn boolean search string
2. Use proper boolean syntax: AND, OR, NOT, parentheses, quotes
3. Optimize for LinkedIn's search algorithm
4. Include job titles, skills, location (if specified), and experience indicators

Return ONLY the boolean search string with no explanation, markdown, or formatting.`;

      console.log('[generateSophisticatedBoolean] Generating with variant:', variant);

      const result = await model.generateContent(prompt);
      const searchString = result.response.text().trim();

      if (!searchString) {
        throw new Error('Empty search string generated');
      }

      // Generate explanation of the boolean components
      const explanation = generateExplanation(searchString, jobContext, variant);

      console.log('[generateSophisticatedBoolean] Generated:', {
        length: searchString.length,
        variant,
        hasExplanation: !!explanation
      });

      res.status(200).json({
        success: true,
        searchString,
        explanation,
        variant,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[generateSophisticatedBoolean] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate boolean search'
      });
    }
  }
);

/**
 * Generate a basic explanation of the boolean search components
 */
function generateExplanation(searchString, jobContext, variant) {
  const components = [];

  // Analyze the search string for common patterns
  const hasAnd = searchString.includes(' AND ');
  const hasOr = searchString.includes(' OR ');
  const hasNot = searchString.includes(' NOT ');
  const hasQuotes = searchString.includes('"');
  const hasParens = searchString.includes('(');

  // Title component
  if (jobContext.title) {
    components.push({
      type: 'Job Titles',
      purpose: 'Matches candidates with relevant job titles',
      terms: [jobContext.title]
    });
  }

  // Skills component
  const allSkills = [
    ...(jobContext.mustHaveSkills || []),
    ...(jobContext.technicalSkills || [])
  ].filter(Boolean);

  if (allSkills.length > 0) {
    components.push({
      type: 'Skills',
      purpose: 'Filters for required technical competencies',
      terms: allSkills.slice(0, 5)
    });
  }

  // Location component
  if (jobContext.location?.city) {
    components.push({
      type: 'Location',
      purpose: 'Targets candidates in the specified area',
      terms: [`${jobContext.location.city}, ${jobContext.location.state}`]
    });
  }

  return {
    components,
    willInclude: [
      `Candidates with ${jobContext.title} or similar titles`,
      allSkills.length > 0 ? `People with ${allSkills[0]} skills` : null,
      jobContext.location?.city ? `Profiles in ${jobContext.location.city} area` : null
    ].filter(Boolean),
    willExclude: hasNot ? ['Results matching NOT terms'] : [],
    proTips: [
      variant === 'strict' ? 'Strict mode may miss candidates with non-standard titles' : null,
      variant === 'broad' ? 'Broad mode may include less qualified candidates - review carefully' : null,
      hasParens ? 'Parentheses control operator precedence for precise matching' : null,
      'Try different variants if results are too narrow or broad'
    ].filter(Boolean)
  };
}
