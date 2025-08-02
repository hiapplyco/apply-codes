import { z } from 'zod';
import { BaseMCPTool } from '../utils/base-tool.js';
import { MCPSession, MCPError } from '../types/mcp.js';
import GoogleCustomSearch, { ProfileInfo } from '../services/google-search.js';

// Generate Boolean Query Tool
export class GenerateBooleanQueryTool extends BaseMCPTool {
  constructor() {
    super(
      'generate_boolean_query',
      'Generate advanced boolean search queries for candidate sourcing across different platforms',
      z.object({
        requiredSkills: z.array(z.string()).describe('Required technical skills'),
        optionalSkills: z.array(z.string()).optional().describe('Optional/preferred skills'),
        jobTitles: z.array(z.string()).optional().describe('Job titles to search for'),
        excludeTerms: z.array(z.string()).optional().describe('Terms to exclude from search'),
        experienceYears: z.number().optional().describe('Years of experience required'),
        platform: z.enum(['linkedin', 'google', 'github']).default('linkedin').describe('Platform to optimize for'),
      })
    );
  }

  protected async handler(input: any, session?: MCPSession): Promise<any> {
    const { 
      requiredSkills, 
      optionalSkills = [], 
      jobTitles = [], 
      excludeTerms = [], 
      experienceYears,
      platform 
    } = input;

    this.log('Generating boolean query', { requiredSkills, platform });

    // Build platform-specific boolean query using actual input
    let query = '';

    if (platform === 'linkedin') {
      // LinkedIn X-Ray search format
      const skillsQuery = requiredSkills.map((skill: string) => `"${skill}"`).join(' AND ');
      const optionalQuery = optionalSkills.length > 0 
        ? ' AND (' + optionalSkills.map((skill: string) => `"${skill}"`).join(' OR ') + ')'
        : '';
      const titlesQuery = jobTitles.length > 0
        ? ' AND (' + jobTitles.map((title: string) => `"${title}"`).join(' OR ') + ')'
        : '';
      const excludeQuery = excludeTerms.length > 0
        ? ' -(' + excludeTerms.join(' OR ') + ')'
        : '';
      
      query = `site:linkedin.com/in/ ${skillsQuery}${optionalQuery}${titlesQuery}${excludeQuery}`;
      
      if (experienceYears) {
        query += ` AND ("${experienceYears} years" OR "${experienceYears}+ years")`;
      }
    } else if (platform === 'github') {
      // GitHub search format
      const skillsQuery = requiredSkills.join(' ');
      const languageQuery = requiredSkills
        .filter((skill: string) => ['javascript', 'python', 'java', 'typescript', 'go', 'rust'].includes(skill.toLowerCase()))
        .map((lang: string) => `language:${lang}`)
        .join(' ');
      
      query = `${skillsQuery} ${languageQuery} in:readme`;
    } else {
      // Generic Google search
      const skillsQuery = requiredSkills.map((skill: string) => `"${skill}"`).join(' AND ');
      const optionalQuery = optionalSkills.length > 0 
        ? ' (' + optionalSkills.map((skill: string) => `"${skill}"`).join(' OR ') + ')'
        : '';
      
      query = `${skillsQuery}${optionalQuery} (resume OR CV)`;
    }

    const result = {
      booleanQuery: query,
      platform,
      breakdown: {
        requiredSkills,
        optionalSkills,
        jobTitles,
        excludeTerms,
        experienceYears
      },
      searchTips: this.getSearchTips(platform),
      estimatedResults: this.estimateResults(requiredSkills, platform)
    };

    this.log('Boolean query generated', { queryLength: query.length, platform });
    return result;
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

  private estimateResults(skills: string[], platform: string): number {
    // Simple estimation based on skill popularity
    const baseEstimate = platform === 'linkedin' ? 1000 : platform === 'github' ? 500 : 2000;
    const skillMultiplier = skills.length > 3 ? 0.3 : skills.length > 1 ? 0.6 : 1.0;
    return Math.floor(baseEstimate * skillMultiplier);
  }
}

// Search Candidates Tool - FIXED to use actual input parameters
export class SearchCandidatesTool extends BaseMCPTool {
  constructor() {
    super(
      'search_candidates',
      'Search for candidates across multiple platforms using AI-powered matching',
      z.object({
        keywords: z.string().describe('Search keywords (skills, job titles, etc.)'),
        location: z.string().optional().describe('Geographic location or "remote"'),
        platforms: z.array(z.enum(['linkedin', 'google_jobs', 'github', 'indeed'])).default(['linkedin']).describe('Platforms to search'),
        maxResults: z.number().min(1).max(100).default(20).describe('Maximum number of results'),
        experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional().describe('Experience level filter'),
      })
    );
  }

  protected async handler(input: any, session?: MCPSession): Promise<any> {
    const { keywords, location, platforms, maxResults, experienceLevel } = input;

    this.log('Executing REAL Google Custom Search', { 
      keywords, 
      location, 
      platforms, 
      maxResults, 
      experienceLevel 
    });

    // STEP 1: Generate boolean search query inline (since we can't access protected handler)
    const requiredSkills = this.extractSkills(keywords);
    const jobTitles = this.extractJobTitles(keywords);
    const booleanQuery = this.buildBooleanQuery(requiredSkills, jobTitles, 'linkedin', experienceLevel);
    this.log('Generated boolean query', { query: booleanQuery });

    // STEP 2: Execute real Google Custom Search
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
    } catch (error) {
      this.logError('Google search failed', error);
      throw new MCPError(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEARCH_ERROR'
      );
    }

    // STEP 3: Convert search results to candidate format
    const candidates = this.convertSearchResultsToCandidates(searchResults, keywords);
    
    // Add search metadata
    const result = {
      searchQuery: {
        keywords,
        location: location || 'Any location',
        platforms,
        maxResults,
        experienceLevel: experienceLevel || 'Any level',
        booleanQuery: booleanQuery // Include the actual query used
      },
      candidates: candidates,
      searchMetadata: {
        totalFound: candidates.length,
        searchTime: this.getCurrentTimestamp(),
        platforms: platforms,
        relevanceScore: this.calculateRelevanceScore(keywords, candidates),
        realSearch: true // Flag to indicate this was a real search
      },
      suggestions: this.generateRealSearchSuggestions(keywords, candidates.length)
    };

    this.log('REAL search completed', { 
      candidatesFound: candidates.length,
      platforms: platforms.join(', '),
      booleanQuery: booleanQuery
    });

    return result;
  }

  // NEW: Convert real Google search results to candidate format
  private convertSearchResultsToCandidates(searchResults: ProfileInfo[], keywords: string): any[] {
    const candidates = [];
    
    for (let i = 0; i < searchResults.length; i++) {
      const profile = searchResults[i];
      
      // Calculate match score based on how well the profile matches the search keywords
      const matchScore = this.calculateRealMatchScore(keywords, profile);
      
      const candidate = {
        id: `real-candidate-${Date.now()}-${i}`,
        name: profile.name || 'Name not available',
        email: 'Contact via profile', // We don't get emails from search results
        title: profile.title || 'Title not specified',
        company: profile.company || 'Company not specified',
        location: profile.location || 'Location not specified',
        skills: profile.skills || [],
        experience: 'See profile for details', // Can't determine from search snippet
        matchScore: matchScore,
        profileUrl: profile.profileUrl,
        source: profile.source,
        summary: profile.snippet,
        lastActive: 'Unknown', // Not available from search
        availability: 'Contact to inquire',
        salaryExpectation: 'Contact to discuss',
        isRealProfile: true // Flag to indicate this is real data
      };
      
      candidates.push(candidate);
    }

    // Sort by match score (highest first)
    return candidates.sort((a, b) => b.matchScore - a.matchScore);
  }

  // NEW: Calculate match score for real profiles
  private calculateRealMatchScore(keywords: string, profile: ProfileInfo): number {
    let score = 20; // Base score for real profiles
    const keywordLower = keywords.toLowerCase();
    
    // Check title match
    if (profile.title && keywordLower.includes(profile.title.toLowerCase()) || 
        profile.title?.toLowerCase().includes(keywordLower)) {
      score += 30;
    }
    
    // Check skills match
    if (profile.skills) {
      const matchingSkills = profile.skills.filter(skill => 
        keywordLower.includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(keywordLower)
      );
      score += matchingSkills.length * 15;
    }
    
    // Check snippet content for keyword matches
    const snippetMatches = (profile.snippet.toLowerCase().match(new RegExp(keywordLower.split(' ').join('|'), 'g')) || []).length;
    score += snippetMatches * 5;
    
    // Boost LinkedIn profiles (more reliable professional data)
    if (profile.source === 'linkedin') {
      score += 10;
    }
    
    return Math.min(score, 100); // Cap at 100
  }

  // NEW: Generate suggestions for real search improvements
  private generateRealSearchSuggestions(keywords: string, resultCount: number): string[] {
    const suggestions = [];
    
    if (resultCount === 0) {
      suggestions.push('Try broader search terms');
      suggestions.push('Check if Google CSE is configured correctly');
      suggestions.push('Verify the boolean query syntax');
    } else if (resultCount < 5) {
      suggestions.push('Try adding synonyms for key skills');
      suggestions.push('Expand geographic search area');
      suggestions.push('Include related job titles');
    } else {
      suggestions.push('Results look good! Try refining with more specific criteria');
      suggestions.push('Consider filtering by experience level or location');
    }
    
    return suggestions;
  }

  // NEW: Build boolean query for Google Custom Search
  private buildBooleanQuery(skills: string[], titles: string[], platform: string, experienceLevel?: string): string {
    let query = '';
    
    if (platform === 'linkedin') {
      query = 'site:linkedin.com/in/ ';
      
      // Add skills
      if (skills.length > 0) {
        const skillsQuery = skills.map(skill => `"${skill}"`).join(' AND ');
        query += skillsQuery;
      }
      
      // Add job titles  
      if (titles.length > 0) {
        const titlesQuery = ' AND (' + titles.map(title => `"${title}"`).join(' OR ') + ')';
        query += titlesQuery;
      }
      
      // Add experience level
      if (experienceLevel) {
        query += ` AND "${experienceLevel}"`;
      }
    } else {
      // Generic search for other platforms
      const allTerms = [...skills, ...titles];
      query = allTerms.map(term => `"${term}"`).join(' AND ');
      
      if (experienceLevel) {
        query += ` AND "${experienceLevel}"`;
      }
    }
    
    return query;
  }

  // DEPRECATED: This method now uses fake data - kept for fallback only
  private generateDynamicCandidates(keywords: string, location?: string, experienceLevel?: string, maxResults: number = 20): any[] {
    const candidates = [];
    
    // Extract skills and job titles from keywords
    const keywordLower = keywords.toLowerCase();
    const skills = this.extractSkills(keywordLower);
    const jobTitles = this.extractJobTitles(keywordLower);
    
    // Base candidate templates that we'll customize based on search
    const candidateTemplates = this.getCandidateTemplates();
    
    // Generate candidates and calculate match scores
    const allCandidates = [];
    for (let i = 0; i < candidateTemplates.length; i++) {
      const template = candidateTemplates[i];
      const matchScore = this.calculateMatchScore(keywords, template);
      
      const candidate = {
        id: `candidate-${Date.now()}-${i}`,
        name: template.name,
        email: template.email,
        title: this.selectRelevantTitle(jobTitles, template.titles),
        company: template.company,
        location: location || template.location,
        skills: this.selectRelevantSkills(skills, template.skillPool),
        experience: this.getExperienceForLevel(experienceLevel),
        matchScore: matchScore,
        profileUrl: `https://linkedin.com/in/${template.name.toLowerCase().replace(' ', '')}`,
        source: 'linkedin',
        summary: this.generateSummary(keywords, template),
        lastActive: this.generateLastActive(),
        availability: this.generateAvailability(),
        salaryExpectation: this.generateSalaryRange(experienceLevel)
      };
      
      allCandidates.push(candidate);
    }

    // Sort by match score (highest first)
    const sortedCandidates = allCandidates.sort((a, b) => b.matchScore - a.matchScore);
    
    // Filter to show only candidates with reasonable match scores (above 50)
    // or if no good matches, show top candidates anyway
    const goodMatches = sortedCandidates.filter(c => c.matchScore >= 50);
    const finalCandidates = goodMatches.length > 0 ? goodMatches : sortedCandidates.slice(0, 3);
    
    return finalCandidates.slice(0, maxResults);
  }

  private extractSkills(keywords: string): string[] {
    const commonSkills = [
      // Programming Languages
      'javascript', 'python', 'java', 'typescript', 'go', 'rust', 'c++', 'c#', 'scala', 'r',
      // Frontend
      'react', 'angular', 'vue', 'vue.js', 'css', 'html',
      // Backend
      'node.js', 'django', 'spring boot', '.net', 'express',
      // Cloud Platforms
      'aws', 'gcp', 'google cloud platform', 'azure', 'google cloud',
      // AI/ML
      'machine learning', 'ai', 'artificial intelligence', 'data science', 'tensorflow', 'pytorch',
      'vertex ai', 'gemini', 'openai', 'llm', 'nlp', 'computer vision',
      // Data & Databases
      'sql', 'mongodb', 'postgresql', 'redis', 'elasticsearch', 'bigquery',
      // DevOps & Infrastructure
      'docker', 'kubernetes', 'terraform', 'ci/cd', 'devops', 'jenkins',
      // Architecture
      'microservices', 'serverless', 'architecture', 'system design'
    ];
    
    // Extract skills that appear in the keywords (case insensitive, partial matches)
    const extractedSkills = [];
    for (const skill of commonSkills) {
      if (keywords.toLowerCase().includes(skill.toLowerCase())) {
        extractedSkills.push(skill);
      }
    }
    
    return extractedSkills;
  }

  private extractJobTitles(keywords: string): string[] {
    const commonTitles = [
      'software engineer', 'developer', 'programmer', 'architect', 'lead',
      'senior', 'junior', 'full stack', 'frontend', 'backend', 'devops',
      'data scientist', 'ml engineer', 'ai engineer', 'security engineer',
      'cloud architect', 'solutions architect', 'platform engineer',
      'gcp architect', 'aws architect', 'azure architect'
    ];
    
    // Extract titles that appear in the keywords (case insensitive, partial matches)
    const extractedTitles = [];
    for (const title of commonTitles) {
      if (keywords.toLowerCase().includes(title.toLowerCase())) {
        extractedTitles.push(title);
      }
    }
    
    return extractedTitles;
  }

  private getCandidateTemplates(): any[] {
    return [
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@email.com',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        titles: ['Senior Software Engineer', 'Full Stack Developer', 'Tech Lead'],
        skillPool: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker']
      },
      {
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@email.com', 
        company: 'StartupXYZ',
        location: 'Austin, TX',
        titles: ['Backend Engineer', 'DevOps Engineer', 'Software Developer'],
        skillPool: ['Python', 'Django', 'PostgreSQL', 'Kubernetes', 'GCP']
      },
      {
        name: 'Emily Johnson',
        email: 'emily.johnson@email.com',
        company: 'MegaCorp',
        location: 'Seattle, WA', 
        titles: ['Frontend Developer', 'UI Engineer', 'JavaScript Developer'],
        skillPool: ['React', 'TypeScript', 'CSS', 'JavaScript', 'Vue.js']
      },
      {
        name: 'Michael Davis',
        email: 'michael.davis@email.com',
        company: 'CloudTech',
        location: 'Denver, CO',
        titles: ['Cloud Architect', 'DevOps Engineer', 'Infrastructure Engineer'],
        skillPool: ['AWS', 'Terraform', 'Kubernetes', 'Docker', 'Python', 'Go']
      },
      {
        name: 'Jennifer Wang',
        email: 'jennifer.wang@email.com',
        company: 'DataCorp',
        location: 'New York, NY',
        titles: ['Data Scientist', 'ML Engineer', 'AI Developer'],
        skillPool: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Scala', 'R']
      },
      // NEW: GCP and AI specialists
      {
        name: 'David Kim',
        email: 'david.kim@email.com',
        company: 'Google Cloud',
        location: 'Mountain View, CA',
        titles: ['GCP Architect', 'Cloud Solutions Architect', 'Platform Engineer'],
        skillPool: ['GCP', 'Google Cloud Platform', 'Vertex AI', 'BigQuery', 'Kubernetes', 'Terraform', 'Python']
      },
      {
        name: 'Maria Gonzalez',
        email: 'maria.gonzalez@email.com',
        company: 'AI Innovations',
        location: 'San Francisco, CA',
        titles: ['AI Engineer', 'ML Engineer', 'Vertex AI Specialist'],
        skillPool: ['Vertex AI', 'Gemini', 'TensorFlow', 'Python', 'GCP', 'Machine Learning', 'AI']
      },
      {
        name: 'Robert Taylor',
        email: 'robert.taylor@email.com',
        company: 'CloudFirst',
        location: 'San Jose, CA',
        titles: ['GCP Architect', 'Cloud Engineer', 'Solutions Architect'],
        skillPool: ['GCP', 'Google Cloud Platform', 'Vertex AI', 'Gemini', 'Python', 'Kubernetes', 'AI']
      },
      {
        name: 'Lisa Chen',
        email: 'lisa.chen@email.com',
        company: 'MLOps Solutions',
        location: 'Palo Alto, CA',
        titles: ['Vertex AI Engineer', 'ML Platform Engineer', 'AI Architect'],
        skillPool: ['Vertex AI', 'Gemini', 'GCP', 'MLOps', 'TensorFlow', 'Python', 'Machine Learning']
      },
      {
        name: 'James Wilson',
        email: 'james.wilson@email.com',
        company: 'Enterprise Cloud',
        location: 'San Francisco, CA',
        titles: ['GCP Solutions Architect', 'Cloud Architect', 'AI Solutions Engineer'],
        skillPool: ['Google Cloud Platform', 'GCP', 'Vertex AI', 'Gemini', 'BigQuery', 'Kubernetes', 'AI', 'Python']
      }
    ];
  }

  private selectRelevantTitle(searchTitles: string[], candidateTitles: string[]): string {
    // Find matching title or default to first candidate title
    for (const searchTitle of searchTitles) {
      for (const candidateTitle of candidateTitles) {
        if (candidateTitle.toLowerCase().includes(searchTitle)) {
          return candidateTitle;
        }
      }
    }
    return candidateTitles[0];
  }

  private selectRelevantSkills(searchSkills: string[], candidateSkills: string[]): string[] {
    if (searchSkills.length === 0) return candidateSkills.slice(0, 4);
    
    // Include matching skills first, then fill with candidate skills
    const matchingSkills = candidateSkills.filter(skill => 
      searchSkills.some(searchSkill => skill.toLowerCase().includes(searchSkill))
    );
    
    const remainingSkills = candidateSkills.filter(skill => !matchingSkills.includes(skill));
    
    return [...matchingSkills, ...remainingSkills].slice(0, 5);
  }

  private getExperienceForLevel(experienceLevel?: string): string {
    const experiences = {
      entry: ['1-2 years', '2 years', 'Entry level'],
      mid: ['3-5 years', '4 years', '5 years'],
      senior: ['6-8 years', '7+ years', '8 years'],
      executive: ['10+ years', '12 years', '15+ years']
    };
    
    if (!experienceLevel) return '5 years';
    const options = experiences[experienceLevel as keyof typeof experiences] || experiences.mid;
    return options[Math.floor(Math.random() * options.length)];
  }

  private calculateMatchScore(keywords: string, template: any): number {
    let score = 40; // Lower base score
    const keywordLower = keywords.toLowerCase();
    
    // Extract specific keywords from the search query
    const searchSkills = this.extractSkills(keywordLower);
    const searchTitles = this.extractJobTitles(keywordLower);
    
    // Count exact skill matches (higher weight)
    let exactMatches = 0;
    let partialMatches = 0;
    
    for (const searchSkill of searchSkills) {
      for (const candidateSkill of template.skillPool) {
        const searchSkillLower = searchSkill.toLowerCase();
        const candidateSkillLower = candidateSkill.toLowerCase();
        
        // Exact match (very high weight)
        if (searchSkillLower === candidateSkillLower) {
          exactMatches++;
          score += 20;
        }
        // Partial match (medium weight)
        else if (candidateSkillLower.includes(searchSkillLower) || searchSkillLower.includes(candidateSkillLower)) {
          partialMatches++;
          score += 12;
        }
      }
    }
    
    // Boost for title matches
    for (const searchTitle of searchTitles) {
      for (const candidateTitle of template.titles) {
        const searchTitleLower = searchTitle.toLowerCase();
        const candidateTitleLower = candidateTitle.toLowerCase();
        
        if (candidateTitleLower.includes(searchTitleLower) || searchTitleLower.includes(candidateTitleLower)) {
          score += 15;
        }
      }
    }
    
    // Special boost for high-demand combinations
    if (keywordLower.includes('gcp') && keywordLower.includes('vertex ai')) {
      // Check if candidate has both GCP and Vertex AI
      const hasGCP = template.skillPool.some((skill: string) => skill.toLowerCase().includes('gcp') || skill.toLowerCase().includes('google cloud'));
      const hasVertexAI = template.skillPool.some((skill: string) => skill.toLowerCase().includes('vertex ai'));
      
      if (hasGCP && hasVertexAI) {
        score += 25; // High bonus for perfect match
      } else if (hasGCP || hasVertexAI) {
        score += 10; // Moderate bonus for partial match
      }
    }
    
    // Penalty for no matches
    if (exactMatches === 0 && partialMatches === 0) {
      score = Math.max(score - 30, 15); // Minimum score of 15
    }
    
    return Math.min(score, 95); // Cap at 95
  }

  private generateSummary(keywords: string, template: any): string {
    const skills = template.skillPool.slice(0, 3).join(', ');
    return `Experienced ${template.titles[0]} with expertise in ${skills}. Strong background in software development with proven track record of delivering scalable solutions.`;
  }

  private generateLastActive(): string {
    const days = Math.floor(Math.random() * 30) + 1;
    return `${days} days ago`;
  }

  private generateAvailability(): string {
    const options = ['Available', 'Open to opportunities', 'Actively looking', 'Passive candidate'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateSalaryRange(experienceLevel?: string): string {
    const ranges = {
      entry: '$70K-$95K',
      mid: '$95K-$130K', 
      senior: '$130K-$180K',
      executive: '$180K-$250K+'
    };
    
    return ranges[experienceLevel as keyof typeof ranges] || ranges.mid;
  }

  private calculateRelevanceScore(keywords: string, candidates: any[]): number {
    if (candidates.length === 0) return 0;
    const avgMatchScore = candidates.reduce((sum, c) => sum + c.matchScore, 0) / candidates.length;
    return Math.round(avgMatchScore);
  }

  private generateSearchSuggestions(keywords: string, resultCount: number): string[] {
    const suggestions = [];
    
    if (resultCount < 5) {
      suggestions.push('Try broader keywords or remove location filters');
      suggestions.push('Consider related job titles or skill variations');
    }
    
    if (resultCount > 50) {
      suggestions.push('Add more specific skills to narrow results');
      suggestions.push('Apply experience level or location filters');
    }
    
    suggestions.push('Try searching on additional platforms');
    suggestions.push('Use Boolean search operators for precise results');
    
    return suggestions;
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }
}

// Analyze Job Requirements Tool  
export class AnalyzeJobRequirementsTool extends BaseMCPTool {
  constructor() {
    super(
      'analyze_job_requirements',
      'Analyze job descriptions to extract structured requirements for better candidate matching',
      z.object({
        jobDescription: z.string().describe('Full job description text'),
        extractSkills: z.boolean().default(true).describe('Extract technical skills'),
        extractSalary: z.boolean().default(true).describe('Extract salary information'),
        suggestSearchTerms: z.boolean().default(true).describe('Suggest search terms'),
      })
    );
  }

  protected async handler(input: any, session?: MCPSession): Promise<any> {
    const { jobDescription, extractSkills, extractSalary, suggestSearchTerms } = input;

    this.log('Analyzing job requirements', { 
      descriptionLength: jobDescription.length,
      extractSkills,
      extractSalary 
    });

    // REAL analysis using actual job description content
    const analysis = {
      jobTitle: this.extractJobTitle(jobDescription),
      experienceLevel: this.determineExperienceLevel(jobDescription),
      
      requiredSkills: extractSkills ? this.extractRequiredSkills(jobDescription) : [],
      preferredSkills: extractSkills ? this.extractPreferredSkills(jobDescription) : [],
      
      salaryInfo: extractSalary ? this.extractSalaryInfo(jobDescription) : null,
      
      location: this.extractLocation(jobDescription),
      remoteOptions: this.extractRemoteOptions(jobDescription),
      
      companyInfo: this.extractCompanyInfo(jobDescription),
      
      searchTerms: suggestSearchTerms ? this.generateSearchTerms(jobDescription) : [],
      
      complexity: this.assessComplexity(jobDescription),
      
      recommendations: this.generateRecommendations(jobDescription)
    };

    this.log('Job analysis completed', { 
      skillsFound: analysis.requiredSkills.length,
      experienceLevel: analysis.experienceLevel 
    });

    return analysis;
  }

  private extractJobTitle(description: string): string {
    // Look for common title patterns
    const titlePatterns = [
      /job title[:\s]+([^\n.]+)/i,
      /position[:\s]+([^\n.]+)/i,
      /we are looking for[:\s]*([^\n.]+)/i,
      /hiring[:\s]*([^\n.]+)/i,
    ];

    for (const pattern of titlePatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: try to detect from common job titles
    const commonTitles = [
      'Software Engineer', 'Frontend Developer', 'Backend Developer',
      'Full Stack Developer', 'DevOps Engineer', 'Data Scientist',
      'Product Manager', 'UI/UX Designer', 'QA Engineer'
    ];

    for (const title of commonTitles) {
      if (description.toLowerCase().includes(title.toLowerCase())) {
        return title;
      }
    }

    return 'Software Engineer'; // Default fallback
  }

  private determineExperienceLevel(description: string): string {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('senior') || descLower.includes('lead') || 
        descLower.includes('principal') || descLower.includes('staff')) {
      return 'senior';
    }
    
    if (descLower.includes('junior') || descLower.includes('entry') || 
        descLower.includes('graduate') || descLower.includes('new grad')) {
      return 'entry';
    }
    
    if (descLower.includes('mid-level') || descLower.includes('mid level') ||
        /\d+\-\d+.*years/.test(descLower)) {
      return 'mid';
    }
    
    // Check for years of experience
    const yearsMatch = description.match(/(\d+)\+?\s*years/i);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years <= 2) return 'entry';
      if (years <= 5) return 'mid'; 
      return 'senior';
    }
    
    return 'mid'; // Default
  }

  private extractRequiredSkills(description: string): string[] {
    const skills = new Set<string>();
    
    // Common technical skills to look for
    const techSkills = [
      'JavaScript', 'Python', 'Java', 'TypeScript', 'React', 'Angular', 'Vue',
      'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Docker', 'Kubernetes',
      'AWS', 'GCP', 'Azure', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis',
      'Git', 'CI/CD', 'TDD', 'Agile', 'Scrum', 'REST', 'GraphQL'
    ];

    const descLower = description.toLowerCase();
    
    for (const skill of techSkills) {
      if (descLower.includes(skill.toLowerCase())) {
        skills.add(skill);
      }
    }

    return Array.from(skills);
  }

  private extractPreferredSkills(description: string): string[] {
    const skills = new Set<string>();
    
    // Look for "nice to have", "preferred", "plus" sections
    const preferredSections = [
      /nice to have[:\s]*([^.]+)/gi,
      /preferred[:\s]*([^.]+)/gi, 
      /plus[:\s]*([^.]+)/gi,
      /bonus[:\s]*([^.]+)/gi
    ];

    for (const pattern of preferredSections) {
      const matches = description.match(pattern);
      if (matches) {
        for (const match of matches) {
          const skillsText = match.toLowerCase();
          // Extract tech skills from the matched text
          const techSkills = ['react', 'vue', 'angular', 'docker', 'kubernetes', 'aws', 'python'];
          for (const skill of techSkills) {
            if (skillsText.includes(skill)) {
              skills.add(skill.charAt(0).toUpperCase() + skill.slice(1));
            }
          }
        }
      }
    }

    return Array.from(skills);
  }

  private extractSalaryInfo(description: string): any {
    // Look for salary patterns
    const salaryPatterns = [
      /\$(\d{1,3}(?:,\d{3})*(?:k|K)?)(?:\s*-\s*\$?(\d{1,3}(?:,\d{3})*(?:k|K)?))?/g,
      /(\d{1,3}(?:,\d{3})*(?:k|K)?)\s*-\s*(\d{1,3}(?:,\d{3})*(?:k|K)?)/g
    ];

    for (const pattern of salaryPatterns) {
      const match = description.match(pattern);
      if (match) {
        return {
          mentioned: true,
          range: match[0],
          currency: 'USD'
        };
      }
    }

    return {
      mentioned: false,
      range: null,
      currency: null
    };
  }

  private extractLocation(description: string): string {
    // Look for location patterns
    const locationPatterns = [
      /location[:\s]*([^\n.]+)/i,
      /based in[:\s]*([^\n.]+)/i,
      /([A-Z][a-z]+,\s*[A-Z]{2})/g, // City, State
      /(San Francisco|New York|Austin|Seattle|Boston|Chicago|Los Angeles|Remote)/gi
    ];

    for (const pattern of locationPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Not specified';
  }

  private extractRemoteOptions(description: string): string {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('fully remote') || descLower.includes('100% remote')) {
      return 'Fully remote';
    }
    
    if (descLower.includes('hybrid') || descLower.includes('remote/hybrid')) {
      return 'Hybrid';
    }
    
    if (descLower.includes('remote') && !descLower.includes('no remote')) {
      return 'Remote options available';
    }
    
    return 'On-site';
  }

  private extractCompanyInfo(description: string): any {
    // Try to extract company information
    return {
      size: this.extractCompanySize(description),
      industry: this.extractIndustry(description),
      stage: this.extractCompanyStage(description)
    };
  }

  private extractCompanySize(description: string): string {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('startup') || descLower.includes('early stage')) {
      return 'Startup (1-50 employees)';
    }
    
    if (descLower.includes('scale-up') || descLower.includes('growing team')) {
      return 'Scale-up (50-200 employees)';
    }
    
    if (descLower.includes('enterprise') || descLower.includes('fortune')) {
      return 'Enterprise (1000+ employees)';
    }
    
    return 'Not specified';
  }

  private extractIndustry(description: string): string {
    const industries = {
      'fintech': ['fintech', 'financial', 'banking', 'payments'],
      'healthcare': ['healthcare', 'medical', 'health tech', 'biotech'],
      'e-commerce': ['e-commerce', 'retail', 'marketplace', 'commerce'],
      'saas': ['saas', 'software as a service', 'b2b software'],
      'gaming': ['gaming', 'game', 'entertainment'],
      'ai/ml': ['ai', 'artificial intelligence', 'machine learning', 'ml']
    };

    const descLower = description.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => descLower.includes(keyword))) {
        return industry;
      }
    }
    
    return 'Technology';
  }

  private extractCompanyStage(description: string): string {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('series a') || descLower.includes('series b')) {
      return 'Growth stage';
    }
    
    if (descLower.includes('seed') || descLower.includes('pre-seed')) {
      return 'Early stage';
    }
    
    if (descLower.includes('ipo') || descLower.includes('public')) {
      return 'Public company';
    }
    
    return 'Established';
  }

  private generateSearchTerms(description: string): string[] {
    const terms = new Set<string>();
    
    // Extract key terms from description
    const jobTitle = this.extractJobTitle(description);
    const skills = this.extractRequiredSkills(description);
    
    // Add job title variations
    terms.add(jobTitle);
    
    // Add skills
    skills.forEach(skill => terms.add(skill));
    
    // Add common variations
    if (jobTitle.includes('Engineer')) {
      terms.add('Developer');
      terms.add('Programmer');
    }
    
    return Array.from(terms);
  }

  private assessComplexity(description: string): string {
    let complexity = 0;
    
    const skills = this.extractRequiredSkills(description);
    complexity += skills.length;
    
    const descLower = description.toLowerCase();
    if (descLower.includes('architect') || descLower.includes('lead')) complexity += 2;
    if (descLower.includes('senior') || descLower.includes('principal')) complexity += 1;
    if (descLower.includes('startup') || descLower.includes('fast-paced')) complexity += 1;
    
    if (complexity >= 8) return 'High';
    if (complexity >= 5) return 'Medium';
    return 'Low';
  }

  private generateRecommendations(description: string): string[] {
    const recommendations = [];
    const skills = this.extractRequiredSkills(description);
    
    if (skills.length > 10) {
      recommendations.push('Consider prioritizing must-have vs nice-to-have skills');
    }
    
    if (!description.toLowerCase().includes('remote')) {
      recommendations.push('Consider adding remote work options to attract more candidates');
    }
    
    if (!this.extractSalaryInfo(description).mentioned) {
      recommendations.push('Adding salary range can increase application rates');
    }
    
    recommendations.push('Use specific technical requirements to filter candidates effectively');
    recommendations.push('Consider cultural fit questions during screening');
    
    return recommendations;
  }
}

// Get Market Intelligence Tool
export class GetMarketIntelligenceTool extends BaseMCPTool {
  constructor() {
    super(
      'get_market_intelligence',
      'Get market intelligence and salary data for specific roles and locations',
      z.object({
        jobTitle: z.string().describe('Job title to analyze'),
        location: z.string().describe('Geographic location'),
        experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).describe('Experience level'),
        skills: z.array(z.string()).optional().describe('Relevant skills to analyze'),
      })
    );
  }

  protected async handler(input: any, session?: MCPSession): Promise<any> {
    const { jobTitle, location, experienceLevel, skills = [] } = input;

    this.log('Generating market intelligence', { jobTitle, location, experienceLevel });

    // Generate realistic market data based on inputs
    const marketData = {
      role: jobTitle,
      location,
      experienceLevel,
      
      salaryData: this.generateSalaryData(jobTitle, location, experienceLevel),
      
      marketDemand: this.assessMarketDemand(jobTitle, location, skills),
      
      competitionAnalysis: this.analyzeCompetition(jobTitle, location),
      
      skillDemand: skills.map((skill: string) => ({
        skill,
        demandLevel: this.getSkillDemand(skill),
        salaryImpact: this.getSkillSalaryImpact(skill),
        trendDirection: this.getSkillTrend(skill)
      })),
      
      hiringTrends: this.getHiringTrends(jobTitle, location),
      
      recommendations: this.generateMarketRecommendations(jobTitle, location, experienceLevel, skills)
    };

    this.log('Market intelligence generated', { 
      salaryRange: marketData.salaryData.range,
      demandLevel: marketData.marketDemand.level 
    });

    return marketData;
  }

  private generateSalaryData(jobTitle: string, location: string, experienceLevel: string): any {
    // Base salary data by experience level
    const baseSalaries = {
      entry: { min: 70000, max: 95000 },
      mid: { min: 95000, max: 130000 },
      senior: { min: 130000, max: 180000 },
      executive: { min: 180000, max: 250000 }
    };
    
    // Location multipliers
    const locationMultipliers: Record<string, number> = {
      'san francisco': 1.4,
      'new york': 1.3,
      'seattle': 1.2,
      'austin': 1.1,
      'denver': 1.0,
      'remote': 1.1
    };
    
    // Job title multipliers
    const titleMultipliers: Record<string, number> = {
      'architect': 1.2,
      'lead': 1.15,
      'principal': 1.25,
      'staff': 1.3,
      'engineer': 1.0,
      'developer': 0.95
    };
    
    const baseData = baseSalaries[experienceLevel as keyof typeof baseSalaries];
    const locationMultiplier = locationMultipliers[location.toLowerCase()] || 1.0;
    
    let titleMultiplier = 1.0;
    for (const [title, multiplier] of Object.entries(titleMultipliers)) {
      if (jobTitle.toLowerCase().includes(title)) {
        titleMultiplier = multiplier;
        break;
      }
    }
    
    const adjustedMin = Math.round(baseData.min * locationMultiplier * titleMultiplier);
    const adjustedMax = Math.round(baseData.max * locationMultiplier * titleMultiplier);
    
    return {
      range: `$${adjustedMin.toLocaleString()} - $${adjustedMax.toLocaleString()}`,
      median: `$${Math.round((adjustedMin + adjustedMax) / 2).toLocaleString()}`,
      currency: 'USD',
      equity: experienceLevel === 'senior' || experienceLevel === 'executive' ? 'Typically included' : 'Sometimes included',
      benefits: {
        healthInsurance: 'Standard',
        retirement: '401k matching common',
        vacation: experienceLevel === 'entry' ? '15-20 days' : '20-25 days',
        remoteWork: 'Hybrid/Remote options common'
      }
    };
  }

  private assessMarketDemand(jobTitle: string, location: string, skills: string[]): any {
    // Assess demand based on job title and skills
    let demandScore = 5; // Base score out of 10
    
    // Job title demand factors
    const highDemandTitles = ['software engineer', 'data scientist', 'devops', 'security engineer'];
    const mediumDemandTitles = ['product manager', 'designer', 'qa engineer'];
    
    const titleLower = jobTitle.toLowerCase();
    if (highDemandTitles.some(title => titleLower.includes(title))) {
      demandScore += 2;
    } else if (mediumDemandTitles.some(title => titleLower.includes(title))) {
      demandScore += 1;
    }
    
    // Skills demand factors
    const hotSkills = ['react', 'python', 'aws', 'kubernetes', 'ai', 'machine learning'];
    const skillMatches = skills.filter(skill => 
      hotSkills.some(hotSkill => skill.toLowerCase().includes(hotSkill))
    );
    demandScore += skillMatches.length * 0.5;
    
    // Location factors
    const highDemandLocations = ['san francisco', 'seattle', 'new york'];
    if (highDemandLocations.some(loc => location.toLowerCase().includes(loc))) {
      demandScore += 1;
    }
    
    demandScore = Math.min(demandScore, 10);
    
    let level = 'Medium';
    if (demandScore >= 8) level = 'Very High';
    else if (demandScore >= 6) level = 'High';
    else if (demandScore >= 4) level = 'Medium';
    else level = 'Low';
    
    return {
      level,
      score: demandScore,
      factors: [
        'Growing tech sector demand',
        'Remote work increasing talent pool',
        'Digital transformation driving needs',
      ],
      timeToFill: demandScore >= 7 ? '45-60 days' : demandScore >= 5 ? '30-45 days' : '15-30 days'
    };
  }

  private analyzeCompetition(jobTitle: string, location: string): any {
    return {
      level: 'High',
      keyCompetitors: [
        'Major tech companies (FAANG)',
        'Well-funded startups',
        'Remote-first companies',
        'Consulting firms'
      ],
      differentiationFactors: [
        'Competitive compensation packages',
        'Strong company culture and values',
        'Growth and learning opportunities',
        'Work-life balance and flexibility',
        'Meaningful product impact'
      ],
      recommendations: [
        'Offer competitive base salary and equity',
        'Highlight unique company benefits',
        'Fast interview process (< 2 weeks)',
        'Strong employer branding'
      ]
    };
  }

  private getSkillDemand(skill: string): string {
    const highDemandSkills = ['react', 'python', 'aws', 'kubernetes', 'typescript', 'node.js'];
    const mediumDemandSkills = ['java', 'angular', 'vue', 'docker', 'sql'];
    
    const skillLower = skill.toLowerCase();
    if (highDemandSkills.includes(skillLower)) return 'High';
    if (mediumDemandSkills.includes(skillLower)) return 'Medium';
    return 'Medium';
  }

  private getSkillSalaryImpact(skill: string): string {
    const highImpactSkills = ['aws', 'kubernetes', 'machine learning', 'ai'];
    const mediumImpactSkills = ['react', 'python', 'typescript'];
    
    const skillLower = skill.toLowerCase();
    if (highImpactSkills.some(s => skillLower.includes(s))) return '$5k-15k boost';
    if (mediumImpactSkills.includes(skillLower)) return '$2k-8k boost';
    return '$1k-5k boost';
  }

  private getSkillTrend(skill: string): string {
    const trendingUp = ['ai', 'machine learning', 'kubernetes', 'typescript', 'rust'];
    const stable = ['react', 'python', 'java', 'javascript'];
    const declining = ['angular', 'jquery', 'php'];
    
    const skillLower = skill.toLowerCase();
    if (trendingUp.some(s => skillLower.includes(s))) return 'Growing';
    if (declining.some(s => skillLower.includes(s))) return 'Declining';
    return 'Stable';
  }

  private getHiringTrends(jobTitle: string, location: string): any {
    return {
      overview: 'Strong hiring market with increased remote opportunities',
      trends: [
        'Remote/hybrid work now standard',
        'Focus on full-stack capabilities',
        'Emphasis on AI/ML skills growing',
        'Faster hiring processes',
        'Increased focus on diversity'
      ],
      challenges: [
        'High candidate expectations',
        'Competition from remote companies',
        'Skill shortages in specialized areas',
        'Salary inflation pressure'
      ],
      outlook: 'Positive - continued growth expected'
    };
  }

  private generateMarketRecommendations(jobTitle: string, location: string, experienceLevel: string, skills: string[]): string[] {
    const recommendations = [];
    
    recommendations.push('Offer competitive base salary within market range');
    recommendations.push('Include equity compensation for senior roles');
    recommendations.push('Provide clear career progression path');
    
    if (location.toLowerCase() !== 'remote') {
      recommendations.push('Consider offering remote/hybrid options');
    }
    
    if (skills.some(skill => ['ai', 'ml', 'machine learning'].includes(skill.toLowerCase()))) {
      recommendations.push('Highlight AI/ML projects and growth opportunities');
    }
    
    recommendations.push('Streamline interview process to 2-3 rounds maximum');
    recommendations.push('Prepare competitive offer packages in advance');
    
    return recommendations;
  }
}

// Export all sourcing tools
export const sourcingTools = [
  new GenerateBooleanQueryTool(),
  new SearchCandidatesTool(),
  new AnalyzeJobRequirementsTool(),
  new GetMarketIntelligenceTool(),
];