/**
 * New Agent System - Core Implementation
 * This is the target architecture we're migrating to
 */

export * from '@/supabase/functions/_shared/agents/Agent'; // The comprehensive Agent.ts you showed me

// Re-export with clearer names for migration
export { Agent as NewAgent } from '@/supabase/functions/_shared/agents/Agent';
export { ToolRegistry as NewToolRegistry } from '@/supabase/functions/_shared/agents/Agent';
export { PromptManager as NewPromptManager } from '@/supabase/functions/_shared/agents/Agent';

/**
 * Recruitment-specific agents that extend the base system
 */
import { Agent, PromptTemplate, ToolRegistry, BaseTool, ToolDefinition } from '@/supabase/functions/_shared/agents/Agent';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Boolean Search Agent - Generates optimized boolean search strings
 */
export class BooleanSearchAgent extends Agent<{ jobDescription: string; requirements?: string }> {
  constructor(model: GoogleGenerativeAI) {
    const template: PromptTemplate = {
      id: 'boolean_search',
      name: 'Boolean Search Generation',
      template: `You are an expert recruiter specializing in creating boolean search strings.

Job Description: {{jobDescription}}
Additional Requirements: {{requirements}}

Available tools:
{{tools}}

Create an optimized boolean search string that:
1. Includes 3-7 job title variations
2. Uses industry-standard abbreviations
3. Includes location variations
4. Adds experience level indicators
5. Includes relevant certifications
6. Excludes irrelevant results (junior/intern if senior role)

Use the web_search tool to research current terminology if needed.`,
      variables: ['jobDescription', 'requirements', 'tools']
    };

    const toolRegistry = new ToolRegistry();
    // Add search tool for terminology research
    toolRegistry.register(new SearchTool());
    
    super(model, template, toolRegistry);
  }
}

/**
 * Profile Enrichment Agent - Enriches candidate profiles
 */
export class ProfileEnrichmentAgent extends Agent<{ profileUrl: string; additionalData?: string }> {
  constructor(model: GoogleGenerativeAI) {
    const template: PromptTemplate = {
      id: 'profile_enrichment',
      name: 'Profile Enrichment',
      template: `You are an AI assistant that enriches candidate profiles with additional information.

Profile URL: {{profileUrl}}
Additional Data: {{additionalData}}

Available tools:
{{tools}}

Please:
1. Use the nymeria_lookup tool to get contact information
2. Use the web_search tool to find additional professional information
3. Compile a comprehensive profile with all available data
4. Format the output in a structured way`,
      variables: ['profileUrl', 'additionalData', 'tools']
    };

    const toolRegistry = new ToolRegistry();
    toolRegistry.register(new NymeriaLookupTool());
    toolRegistry.register(new SearchTool());
    
    super(model, template, toolRegistry);
  }
}

/**
 * Interview Planning Agent - Creates interview plans
 */
export class InterviewPlanningAgent extends Agent<{ role: string; candidateProfile: string; interviewType: string }> {
  constructor(model: GoogleGenerativeAI) {
    const template: PromptTemplate = {
      id: 'interview_planning',
      name: 'Interview Planning',
      template: `You are an expert interview planner.

Role: {{role}}
Candidate Profile: {{candidateProfile}}
Interview Type: {{interviewType}}

Available tools:
{{tools}}

Create a comprehensive interview plan that includes:
1. Relevant technical questions
2. Behavioral questions using STAR method
3. Role-specific scenarios
4. Culture fit assessment
5. Time allocation for each section

Use tools to research current best practices for the specific role and industry.`,
      variables: ['role', 'candidateProfile', 'interviewType', 'tools']
    };

    const toolRegistry = new ToolRegistry();
    toolRegistry.register(new SearchTool());
    toolRegistry.register(new FileSystemTool()); // For loading interview templates
    
    super(model, template, toolRegistry);
  }
}

/**
 * Recruitment-specific Tools
 */

/**
 * Nymeria Lookup Tool - Gets contact info from Nymeria API
 */
export class NymeriaLookupTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'nymeria_lookup',
    description: 'Look up contact information using Nymeria API',
    parameters: {
      profileUrl: {
        type: 'string',
        description: 'LinkedIn profile URL',
        required: true
      }
    }
  };

  async execute(params: any): Promise<any> {
    this.validateParams(params);
    
    try {
      // Call the existing enrich-profile edge function
      const response = await fetch('/api/enrich-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileUrl: params.profileUrl })
      });

      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to lookup profile'
      };
    }
  }
}

/**
 * LinkedIn Search Tool - Search LinkedIn profiles via Google CSE
 */
export class LinkedInSearchTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'linkedin_search',
    description: 'Search LinkedIn profiles using Google Custom Search',
    parameters: {
      query: {
        type: 'string',
        description: 'Boolean search query',
        required: true
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return',
        required: false
      }
    }
  };

  async execute(params: any): Promise<any> {
    this.validateParams(params);
    
    try {
      const { query, limit = 10 } = params;
      
      // Call the existing Google CSE function
      const response = await fetch('/api/search-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchString: query, limit })
      });

      const results = await response.json();
      
      return {
        success: true,
        results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }
}

/**
 * Enhanced Orchestrator for Recruitment Workflows
 */
export class RecruitmentOrchestrator {
  private agents: Map<string, Agent<any>> = new Map();
  private model: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.model = new GoogleGenerativeAI(apiKey);
    this.initializeAgents();
  }

  private initializeAgents() {
    this.agents.set('boolean_search', new BooleanSearchAgent(this.model));
    this.agents.set('profile_enrichment', new ProfileEnrichmentAgent(this.model));
    this.agents.set('interview_planning', new InterviewPlanningAgent(this.model));
  }

  /**
   * Execute a complete sourcing workflow
   */
  async executeSourcingWorkflow(jobDescription: string): Promise<{
    searchString: string;
    profiles: any[];
    enrichedProfiles: any[];
  }> {
    // Step 1: Generate boolean search
    const searchAgent = this.agents.get('boolean_search')!;
    const searchResult = await searchAgent.run({ 
      jobDescription,
      requirements: '' 
    });
    
    // Extract search string from result
    const searchString = this.extractSearchString(searchResult);

    // Step 2: Search for profiles
    const searchTool = new LinkedInSearchTool();
    const searchResults = await searchTool.execute({ 
      query: searchString,
      limit: 20 
    });

    if (!searchResults.success) {
      throw new Error('Profile search failed');
    }

    // Step 3: Enrich top profiles
    const enrichmentAgent = this.agents.get('profile_enrichment')!;
    const enrichedProfiles = [];
    
    for (const profile of searchResults.results.slice(0, 5)) {
      const enrichedResult = await enrichmentAgent.run({
        profileUrl: profile.link,
        additionalData: JSON.stringify(profile)
      });
      
      enrichedProfiles.push({
        ...profile,
        enrichment: enrichedResult
      });
    }

    return {
      searchString,
      profiles: searchResults.results,
      enrichedProfiles
    };
  }

  /**
   * Execute interview preparation workflow
   */
  async prepareInterview(role: string, candidateProfile: string): Promise<{
    interviewPlan: string;
    suggestedDuration: number;
    questionsCount: number;
  }> {
    const planningAgent = this.agents.get('interview_planning')!;
    
    const plan = await planningAgent.run({
      role,
      candidateProfile,
      interviewType: 'technical_behavioral'
    });

    // Parse the plan to extract metrics
    const questionsCount = (plan.match(/\?/g) || []).length;
    const suggestedDuration = this.estimateInterviewDuration(questionsCount);

    return {
      interviewPlan: plan,
      suggestedDuration,
      questionsCount
    };
  }

  private extractSearchString(agentOutput: string): string {
    // Extract boolean search string from agent output
    // This is a simple implementation - enhance based on actual output format
    const match = agentOutput.match(/```(.*?)```/s);
    return match ? match[1].trim() : agentOutput;
  }

  private estimateInterviewDuration(questionsCount: number): number {
    // Estimate 3-5 minutes per question plus buffer
    return questionsCount * 4 + 15; // minutes
  }
}

/**
 * Export all components for use in migration
 */
export {
  SearchTool,
  CalculatorTool,
  HttpTool,
  FileSystemTool
} from '@/supabase/functions/_shared/agents/Agent';