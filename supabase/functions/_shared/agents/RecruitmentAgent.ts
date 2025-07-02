import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { Agent, ToolRegistry, promptManager } from "./Agent.ts";
import { LinkedInSearchTool } from "../tools/LinkedInSearchTool.ts";
import { SkillsExtractionTool } from "../tools/SkillsExtractionTool.ts";
import { ResumeParseTool } from "../tools/ResumeParseTool.ts";

// Register recruitment-specific prompt templates
promptManager.registerTemplate({
  id: 'recruitment_sourcing',
  name: 'Recruitment Sourcing',
  template: `You are an expert recruitment AI assistant specializing in candidate sourcing and evaluation.

Task: {{task}}
Requirements: {{requirements}}

Available tools:
{{tools}}

Your approach should be:
1. Analyze the job requirements carefully
2. Use appropriate search tools to find matching candidates
3. Extract and evaluate relevant skills from profiles
4. Provide structured recommendations with reasoning

When using tools, format your calls as:
<tool_call>
{"name": "tool_name", "params": {"param1": "value1"}}
</tool_call>

Focus on finding the best matches based on skills, experience, and cultural fit indicators.`,
  variables: ['task', 'requirements', 'tools']
});

promptManager.registerTemplate({
  id: 'boolean_search_generation',
  name: 'Boolean Search Generation',
  template: `You are an expert at creating Boolean search strings for recruiting on LinkedIn and other platforms.

Job Requirements: {{requirements}}
Complexity Level: {{complexity}}
Platform: {{platform}}

Create a comprehensive Boolean search string that includes:
1. Multiple job title variations (3-7 synonyms)
2. Required skills with OR operators for alternatives
3. Industry-specific keywords
4. Experience level indicators
5. Location parameters if specified
6. Exclusion terms to filter out irrelevant results

Format the search string using proper Boolean operators:
- AND for required terms
- OR for alternatives (use parentheses)
- NOT or - for exclusions
- Quotes for exact phrases

Example format:
("Senior Software Engineer" OR "Lead Developer" OR "Tech Lead") AND (React OR Vue OR Angular) AND ("San Francisco" OR "Bay Area") NOT recruiter

Please generate the optimal Boolean search string for these requirements.`,
  variables: ['requirements', 'complexity', 'platform']
});

export class RecruitmentAgent extends Agent<{
  task: 'search' | 'evaluate' | 'analyze-skills';
  requirements?: string;
  profiles?: any[];
  booleanSearch?: string;
}> {
  constructor(model: GoogleGenerativeAI) {
    const template = promptManager.getTemplate('recruitment_sourcing');
    if (!template) {
      throw new Error('Recruitment sourcing template not found');
    }

    const toolRegistry = new ToolRegistry();
    
    // Register recruitment-specific tools
    toolRegistry.register(new LinkedInSearchTool());
    toolRegistry.register(new SkillsExtractionTool());
    toolRegistry.register(new ResumeParseTool());

    super(model, template, toolRegistry);
  }

  async searchCandidates(requirements: string): Promise<any> {
    return this.run({
      task: 'search',
      requirements
    });
  }

  async evaluateCandidates(profiles: any[], requirements: string): Promise<any> {
    return this.run({
      task: 'evaluate',
      profiles,
      requirements
    });
  }

  async analyzeSkills(profiles: any[]): Promise<any> {
    return this.run({
      task: 'analyze-skills',
      profiles
    });
  }
}

export class BooleanSearchAgent extends Agent<{
  requirements: string;
  complexity: 'simple' | 'medium' | 'complex';
  platform?: string;
}> {
  constructor(model: GoogleGenerativeAI) {
    const template = promptManager.getTemplate('boolean_search_generation');
    if (!template) {
      throw new Error('Boolean search generation template not found');
    }

    // No tools needed for this agent - it's purely generative
    const toolRegistry = new ToolRegistry();

    super(model, template, toolRegistry);
  }

  async generateBooleanSearch(
    requirements: string, 
    complexity: 'simple' | 'medium' | 'complex' = 'medium',
    platform: string = 'LinkedIn'
  ): Promise<string> {
    return this.run({
      requirements,
      complexity,
      platform
    });
  }

  async optimizeBooleanSearch(currentSearch: string, feedback: string): Promise<string> {
    const optimizedPrompt = `Current Boolean search: ${currentSearch}
    
Feedback: ${feedback}

Please optimize the Boolean search string based on the feedback. Maintain proper Boolean syntax and improve the search to better match the requirements.`;

    return this.run({
      requirements: optimizedPrompt,
      complexity: 'complex',
      platform: 'LinkedIn'
    });
  }
}