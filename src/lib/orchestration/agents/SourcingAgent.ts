import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentCapability } from '@/types/orchestration';
import { supabase } from '@/integrations/supabase/client';
import { generateBooleanQuery } from '@/utils/booleanQueryGenerator';
import { parseJobDescription } from '@/utils/jobDescriptionParser';
import { searchGoogleJobs } from '@/services/googleJobsService';

interface SourcingTaskInput {
  jobDescription?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  location?: string;
  experienceLevel?: string;
  searchPlatforms?: ('linkedin' | 'indeed' | 'google_jobs' | 'github')[];
  maxResults?: number;
}

interface SourcingResult {
  candidates: Array<{
    id: string;
    name: string;
    title: string;
    location: string;
    skills: string[];
    experience: string;
    profileUrl: string;
    source: string;
    matchScore: number;
  }>;
  booleanQuery: string;
  totalFound: number;
  searchMetadata: {
    platforms: string[];
    searchTime: number;
    filters: any;
  };
}

export class SourcingAgent extends BaseAgent {
  protected initialize(): void {
    this.capabilities = [
      {
        name: 'candidate_search',
        description: 'Search for candidates across multiple platforms',
        inputSchema: {
          type: 'object',
          properties: {
            jobDescription: { type: 'string' },
            requiredSkills: { type: 'array', items: { type: 'string' } },
            location: { type: 'string' },
            searchPlatforms: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      {
        name: 'boolean_generation',
        description: 'Generate advanced boolean search queries',
        inputSchema: {
          type: 'object',
          properties: {
            requiredTerms: { type: 'array', items: { type: 'string' } },
            optionalTerms: { type: 'array', items: { type: 'string' } },
            excludeTerms: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      {
        name: 'profile_matching',
        description: 'Match candidate profiles against job requirements',
        inputSchema: {
          type: 'object',
          properties: {
            candidateProfiles: { type: 'array' },
            jobRequirements: { type: 'object' }
          }
        }
      }
    ];

    this.metrics.capabilities = this.capabilities.map(c => c.name);
  }

  public canHandle(task: AgentTask): boolean {
    return task.type === 'sourcing' || 
           task.type === 'candidate_search' || 
           task.type === 'boolean_generation';
  }

  protected async executeTask(task: AgentTask): Promise<SourcingResult> {
    const input = task.input as SourcingTaskInput;
    const startTime = Date.now();

    try {
      // Parse job description if provided
      let requirements: any = {};
      if (input.jobDescription) {
        requirements = await this.parseJobRequirements(input.jobDescription);
      }

      // Merge with explicit requirements
      const searchCriteria = {
        requiredSkills: [...(requirements.requiredSkills || []), ...(input.requiredSkills || [])],
        preferredSkills: [...(requirements.preferredSkills || []), ...(input.preferredSkills || [])],
        location: input.location || requirements.location,
        experienceLevel: input.experienceLevel || requirements.experienceLevel
      };

      // Generate boolean query
      const booleanQuery = this.generateSearchQuery(searchCriteria);

      // Search across platforms
      const platforms = input.searchPlatforms || ['linkedin', 'google_jobs'];
      const searchResults = await this.searchAcrossPlatforms(
        booleanQuery,
        searchCriteria,
        platforms,
        input.maxResults || 50
      );

      // Score and rank candidates
      const rankedCandidates = await this.rankCandidates(
        searchResults,
        searchCriteria
      );

      // Log search activity
      await this.logSearchActivity(task.id, booleanQuery, platforms, rankedCandidates.length);

      return {
        candidates: rankedCandidates.slice(0, input.maxResults || 50),
        booleanQuery,
        totalFound: searchResults.length,
        searchMetadata: {
          platforms,
          searchTime: Date.now() - startTime,
          filters: searchCriteria
        }
      };
    } catch (error) {
      console.error('Sourcing task failed:', error);
      throw error;
    }
  }

  private async parseJobRequirements(jobDescription: string): Promise<any> {
    const prompt = `Extract the following from this job description:
    1. Required skills (technical and soft skills)
    2. Preferred/nice-to-have skills
    3. Years of experience required
    4. Location requirements
    5. Industry/domain knowledge

    Job Description:
    ${jobDescription}`;

    const response = await this.callGeminiAPI(prompt);
    return response.requirements || {};
  }

  private generateSearchQuery(criteria: any): string {
    const requiredTerms = criteria.requiredSkills || [];
    const preferredTerms = criteria.preferredSkills || [];
    
    // Use the existing boolean query generator
    return generateBooleanQuery({
      requiredSkills: requiredTerms,
      niceToHaveSkills: preferredTerms,
      experienceYears: criteria.experienceLevel,
      jobTitles: criteria.jobTitles || []
    });
  }

  private async searchAcrossPlatforms(
    query: string,
    criteria: any,
    platforms: string[],
    maxResults: number
  ): Promise<any[]> {
    const searchPromises = platforms.map(platform => 
      this.searchPlatform(platform, query, criteria, maxResults)
    );

    const results = await Promise.allSettled(searchPromises);
    
    // Combine successful results
    return results
      .filter(r => r.status === 'fulfilled')
      .flatMap((r: any) => r.value);
  }

  private async searchPlatform(
    platform: string,
    query: string,
    criteria: any,
    maxResults: number
  ): Promise<any[]> {
    switch (platform) {
      case 'google_jobs':
        return this.searchGoogleJobs(query, criteria, maxResults);
      case 'linkedin':
        return this.searchLinkedIn(query, criteria, maxResults);
      case 'indeed':
        return this.searchIndeed(query, criteria, maxResults);
      case 'github':
        return this.searchGitHub(criteria, maxResults);
      default:
        console.warn(`Unsupported platform: ${platform}`);
        return [];
    }
  }

  private async searchGoogleJobs(query: string, criteria: any, maxResults: number): Promise<any[]> {
    try {
      // Use the existing Google Jobs service
      const results = await searchGoogleJobs({
        query,
        location: criteria.location,
        limit: maxResults
      });

      return results.map((job: any) => ({
        id: job.job_id,
        name: job.company_name,
        title: job.title,
        location: job.location,
        skills: job.detected_extensions?.qualifications || [],
        experience: job.detected_extensions?.job_experience || 'Not specified',
        profileUrl: job.share_link,
        source: 'google_jobs',
        rawData: job
      }));
    } catch (error) {
      console.error('Google Jobs search failed:', error);
      return [];
    }
  }

  private async searchLinkedIn(query: string, criteria: any, maxResults: number): Promise<any[]> {
    // LinkedIn search implementation would go here
    // For now, return mock data or integrate with LinkedIn API
    console.log('LinkedIn search not yet implemented');
    return [];
  }

  private async searchIndeed(query: string, criteria: any, maxResults: number): Promise<any[]> {
    // Indeed search implementation would go here
    console.log('Indeed search not yet implemented');
    return [];
  }

  private async searchGitHub(criteria: any, maxResults: number): Promise<any[]> {
    // GitHub developer search implementation would go here
    console.log('GitHub search not yet implemented');
    return [];
  }

  private async rankCandidates(
    candidates: any[],
    criteria: any
  ): Promise<any[]> {
    const prompt = `Score and rank these candidates based on the following criteria:
    Required Skills: ${criteria.requiredSkills.join(', ')}
    Preferred Skills: ${criteria.preferredSkills.join(', ')}
    Experience Level: ${criteria.experienceLevel}
    
    For each candidate, provide a match score from 0-100 and explain why.
    
    Candidates:
    ${JSON.stringify(candidates.slice(0, 20))}`;

    const response = await this.callGeminiAPI(prompt);
    const scores = response.scores || {};

    // Apply scores and sort
    return candidates
      .map(candidate => ({
        ...candidate,
        matchScore: scores[candidate.id] || this.calculateBasicScore(candidate, criteria)
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  private calculateBasicScore(candidate: any, criteria: any): number {
    let score = 50; // Base score

    // Match required skills
    const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase());
    const requiredSkills = (criteria.requiredSkills || []).map((s: string) => s.toLowerCase());
    
    const matchedRequired = requiredSkills.filter(skill => 
      candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
    );
    
    score += (matchedRequired.length / Math.max(requiredSkills.length, 1)) * 30;

    // Match preferred skills
    const preferredSkills = (criteria.preferredSkills || []).map((s: string) => s.toLowerCase());
    const matchedPreferred = preferredSkills.filter(skill => 
      candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
    );
    
    score += (matchedPreferred.length / Math.max(preferredSkills.length, 1)) * 20;

    return Math.min(Math.round(score), 100);
  }

  private async logSearchActivity(
    taskId: string,
    query: string,
    platforms: string[],
    resultCount: number
  ): Promise<void> {
    try {
      await supabase.from('sourcing_activity').insert({
        task_id: taskId,
        agent_id: this.id,
        boolean_query: query,
        platforms_searched: platforms,
        results_found: resultCount,
        context: this.context,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log sourcing activity:', error);
    }
  }

  protected async handleRequest(message: AgentMessage): Promise<void> {
    switch (message.action) {
      case 'refine_search':
        await this.handleRefineSearch(message);
        break;
      case 'expand_search':
        await this.handleExpandSearch(message);
        break;
      default:
        await super.handleRequest(message);
    }
  }

  private async handleRefineSearch(message: AgentMessage): Promise<void> {
    const { filters, currentResults } = message.payload;
    
    // Apply additional filters to refine results
    const refinedResults = currentResults.filter((candidate: any) => {
      // Apply custom filtering logic
      return true; // Placeholder
    });

    this.sendMessage(message.from, 'search_refined', {
      results: refinedResults,
      appliedFilters: filters
    });
  }

  private async handleExpandSearch(message: AgentMessage): Promise<void> {
    const { currentQuery, additionalPlatforms } = message.payload;
    
    // Expand search to additional platforms
    const expandedResults = await this.searchAcrossPlatforms(
      currentQuery,
      {},
      additionalPlatforms,
      50
    );

    this.sendMessage(message.from, 'search_expanded', {
      results: expandedResults,
      platforms: additionalPlatforms
    });
  }
}