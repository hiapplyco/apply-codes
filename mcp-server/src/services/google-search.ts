import { google } from 'googleapis';
import { secretsManager } from './secrets-manager.js';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

export interface ProfileInfo {
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  skills?: string[];
  profileUrl: string;
  source: 'linkedin' | 'github' | 'other';
  snippet: string;
}

export class GoogleCustomSearch {
  private customsearch;

  constructor() {
    this.customsearch = google.customsearch('v1');
  }

  private getApiKey(): string {
    return secretsManager.get('GOOGLE_CSE_API_KEY') || '';
  }

  private getSearchEngineId(): string {
    return secretsManager.get('GOOGLE_CSE_ID') || '';
  }

  public isConfigured(): boolean {
    const apiKey = this.getApiKey();
    const searchEngineId = this.getSearchEngineId();
    
    if (!apiKey || !searchEngineId) {
      console.error('⚠️  Google CSE API key or Search Engine ID not configured');
      console.error('   Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID via Supabase or .env file');
    }
    
    return !!(apiKey && searchEngineId);
  }

  public async searchProfiles(booleanQuery: string, maxResults: number = 10): Promise<ProfileInfo[]> {
    if (!this.isConfigured()) {
      throw new Error('Google Custom Search not configured. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID environment variables.');
    }

    try {
      console.error(`🔍 Executing Google CSE search: "${booleanQuery}"`);
      
      const response = await this.customsearch.cse.list({
        auth: this.getApiKey(),
        cx: this.getSearchEngineId(),
        q: booleanQuery,
        num: Math.min(maxResults, 10), // Google CSE limits to 10 per request
        start: 1,
        safe: 'off',
        fields: 'items(title,link,snippet,displayLink,pagemap/metatags)'
      });

      const items = response.data.items || [];
      console.error(`📊 Google CSE returned ${items.length} results`);

      // Parse search results into profile information
      const profiles: ProfileInfo[] = [];
      
      for (const item of items) {
        const profile = this.parseSearchResult(item);
        if (profile) {
          profiles.push(profile);
        }
      }

      console.error(`✅ Parsed ${profiles.length} valid profiles`);
      return profiles;

    } catch (error) {
      console.error('❌ Google CSE search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseSearchResult(item: any): ProfileInfo | null {
    const title = item.title || '';
    const link = item.link || '';
    const snippet = item.snippet || '';
    const displayLink = item.displayLink || '';

    // Determine source platform
    let source: 'linkedin' | 'github' | 'other' = 'other';
    if (link.includes('linkedin.com')) {
      source = 'linkedin';
    } else if (link.includes('github.com')) {
      source = 'github';
    }

    // Extract profile information from title and snippet
    const name = this.extractName(title, snippet);
    const jobTitle = this.extractJobTitle(title, snippet);
    const company = this.extractCompany(title, snippet);
    const location = this.extractLocationFromPagemap(item) || this.extractLocation(snippet);
    const skills = this.extractSkills(snippet);

    // Only return profiles where we could extract meaningful information
    if (!name && !jobTitle) {
      console.error(`⚠️  Skipping result with insufficient data: ${title}`);
      return null;
    }

    return {
      name: name || 'Not specified',
      title: jobTitle || 'Not specified',
      company: company || 'Not specified',
      location: location || 'Not specified',
      skills: skills,
      profileUrl: link,
      source: source,
      snippet: snippet
    };
  }

  private extractName(title: string, snippet: string): string | null {
    // LinkedIn profiles often have "Name - Title - Company" format
    const linkedinNameMatch = title.match(/^([^-|]+)(?:\s*[-|]\s*)/);
    if (linkedinNameMatch) {
      const name = linkedinNameMatch[1].trim();
      // Filter out generic words
      if (!this.isGenericWord(name) && name.split(' ').length >= 2) {
        return name;
      }
    }

    // Look for name patterns in snippet
    const namePatterns = [
      /(?:^|\s)([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s|,|$)/,
      /View ([A-Z][a-z]+\s+[A-Z][a-z]+)'s profile/,
    ];

    for (const pattern of namePatterns) {
      const match = snippet.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (!this.isGenericWord(name)) {
          return name;
        }
      }
    }

    return null;
  }

  private extractJobTitle(title: string, snippet: string): string | null {
    // LinkedIn title format: "Name - Job Title - Company"
    const linkedinTitleMatch = title.match(/[^-|]+[-|]\s*([^-|]+?)(?:\s*[-|]\s*|$)/);
    if (linkedinTitleMatch) {
      const jobTitle = linkedinTitleMatch[1].trim();
      if (!this.isGenericWord(jobTitle) && jobTitle.length > 3) {
        return jobTitle;
      }
    }

    // Look for job titles in snippet
    const titlePatterns = [
      /(Software Engineer|Data Scientist|Product Manager|Designer|Developer|Architect|Engineer|Manager|Director|VP|CEO|CTO|Lead)/i,
      /(?:works as|position as|title of)\s+([^.,]+)/i,
    ];

    for (const pattern of titlePatterns) {
      const match = snippet.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractCompany(title: string, snippet: string): string | null {
    // LinkedIn title format: "Name - Job Title - Company"
    const parts = title.split(' - ');
    if (parts.length >= 3) {
      const company = parts[2].trim();
      if (!this.isGenericWord(company)) {
        return company;
      }
    }

    // Look for company mentions in snippet
    const companyPatterns = [
      /(?:works at|employed at|company)\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|\.|\|)/,
      /at\s+([A-Z][a-zA-Z\s&]{2,20})(?:\s|,|\.)/,
    ];

    for (const pattern of companyPatterns) {
      const match = snippet.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        if (!this.isGenericWord(company) && company.length > 2) {
          return company;
        }
      }
    }

    return null;
  }

  private extractLocationFromPagemap(item: any): string | null {
    try {
      const metatags = item.pagemap?.metatags?.[0];
      if (!metatags) return null;

      // LinkedIn puts location in geo.placename or og:description
      if (metatags['geo.placename']) {
        return metatags['geo.placename'];
      }
      if (metatags['geo.region']) {
        return metatags['geo.region'];
      }

      // og:description often contains "Location · Company" pattern
      const ogDesc = metatags['og:description'] || '';
      const locationMatch = ogDesc.match(/^([^·]+?)(?:\s*·)/);
      if (locationMatch) {
        const candidate = locationMatch[1].trim();
        // Validate it looks like a location (not a job title)
        if (/[A-Z][a-z]+,\s*[A-Z]/.test(candidate) || /\b(?:Area|Metro|Region)\b/i.test(candidate)) {
          return candidate;
        }
      }
    } catch {
      // Pagemap parsing failed, fall through to snippet extraction
    }
    return null;
  }

  private extractLocation(snippet: string): string | null {
    const locationPatterns = [
      /(?:located in|based in|from)\s+([A-Z][a-zA-Z\s,]+?)(?:\s|\.|\|)/,
      /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2})\b/, // City, State (e.g., "San Francisco, CA")
      /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?\s+(?:Area|Metropolitan Area|Metro))/i, // "Greater Austin Area"
      /(Greater\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?:\s+Area)?)/i, // "Greater Boston"
      /(San Francisco|New York|Austin|Seattle|Boston|Chicago|Los Angeles|Denver|Dallas|Houston|Atlanta|Miami|Portland|Phoenix|Minneapolis|Charlotte|Nashville|Raleigh|Tampa|Orlando|Salt Lake City|San Diego|San Jose|San Antonio|Indianapolis|Columbus|Jacksonville|Washington|Philadelphia|Pittsburgh|Baltimore|Detroit|Cleveland|St\.\s*Louis|Kansas City|Milwaukee|Sacramento|Richmond|Virginia Beach|Cincinnati|Memphis|Louisville|Oklahoma City|Las Vegas|Albuquerque|Tucson|Boise|Remote)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = snippet.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractSkills(snippet: string): string[] {
    const skills: string[] = [];

    const skillPatterns = [
      /\b(JavaScript|Python|Java|TypeScript|React|Angular|Vue|Node\.js|AWS|GCP|Azure|Docker|Kubernetes)\b/gi,
      /\b(Machine Learning|AI|Data Science|BigQuery|Vertex AI|TensorFlow|PyTorch|LLM|GenAI|NLP)\b/gi,
      /\b(C\+\+|C#|Go|Rust|Scala|Kotlin|Swift|Ruby|PHP|R|MATLAB|Dart|Flutter)\b/gi,
      /\b(PostgreSQL|MySQL|MongoDB|Redis|DynamoDB|Elasticsearch|Cassandra|Neo4j|Snowflake|Databricks)\b/gi,
      /\b(Terraform|Ansible|Jenkins|GitLab|CircleCI|Spark|Kafka|Airflow|dbt|Tableau|Power BI|Figma|Sketch)\b/gi,
      /\b(Spring Boot|Django|FastAPI|Express|Next\.js|Nuxt|Svelte|GraphQL|REST API|gRPC|Microservices)\b/gi,
      /\b(Salesforce|SAP|Oracle|ServiceNow|Workday|HubSpot|Marketo|Jira|Confluence)\b/gi,
    ];

    for (const pattern of skillPatterns) {
      const matches = snippet.match(pattern);
      if (matches) {
        matches.forEach(skill => {
          const normalized = skill.trim();
          if (!skills.some(s => s.toLowerCase() === normalized.toLowerCase())) {
            skills.push(normalized);
          }
        });
      }
    }

    return skills;
  }

  private isGenericWord(text: string): boolean {
    const genericWords = [
      'linkedin', 'profile', 'view', 'connect', 'about', 'experience', 'education',
      'skills', 'recommendations', 'github', 'repository', 'code', 'projects'
    ];
    
    return genericWords.some(word => text.toLowerCase().includes(word));
  }
}

export default GoogleCustomSearch;