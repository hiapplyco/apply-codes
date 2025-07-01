import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export interface Tool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // Boolean Search Generation Tool
    this.register({
      name: 'generate_boolean_search',
      description: 'Generate a boolean search string for finding candidates',
      execute: async (params: { requirements: string, searchType?: string, companyName?: string }) => {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/process-job-requirements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
          body: JSON.stringify({
            content: params.requirements,
            searchType: params.searchType,
            companyName: params.companyName,
          }),
        });

        if (!response.ok) {
          throw new Error(`Boolean search generation failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });

    // Boolean Search Explanation Tool
    this.register({
      name: 'explain_boolean_search',
      description: 'Explain what a boolean search string does',
      execute: async (params: { booleanString: string, requirements?: string }) => {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/explain-boolean`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
          body: JSON.stringify({
            booleanString: params.booleanString,
            requirements: params.requirements,
          }),
        });

        if (!response.ok) {
          throw new Error(`Boolean explanation failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });

    // Job Description Enhancement Tool
    this.register({
      name: 'enhance_job_description',
      description: 'Enhance and improve a job description',
      execute: async (params: { content: string }) => {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/enhance-job-description`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
          body: JSON.stringify({
            content: params.content,
          }),
        });

        if (!response.ok) {
          throw new Error(`Job description enhancement failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });

    // Compensation Analysis Tool
    this.register({
      name: 'analyze_compensation',
      description: 'Analyze compensation data for a role',
      execute: async (params: { content: string }) => {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/analyze-compensation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
          body: JSON.stringify({
            content: params.content,
          }),
        });

        if (!response.ok) {
          throw new Error(`Compensation analysis failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });

    // Profile Enrichment Tool
    this.register({
      name: 'enrich_profile',
      description: 'Enrich a candidate profile with additional information',
      execute: async (params: { profileUrl?: string, email?: string, name?: string, company?: string }) => {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/enrich-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error(`Profile enrichment failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });

    // Contact Search Tool
    this.register({
      name: 'search_contacts',
      description: 'Search for contact information',
      execute: async (params: { query: string, filters?: any }) => {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/search-contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
          body: JSON.stringify({
            query: params.query,
            filters: params.filters,
          }),
        });

        if (!response.ok) {
          throw new Error(`Contact search failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });
  }

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  getDescriptions(): string {
    return this.list()
      .map(tool => `- ${tool.name}: ${tool.description}`)
      .join('\n');
  }
}