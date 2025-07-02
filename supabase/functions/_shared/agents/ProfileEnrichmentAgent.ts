import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { Agent, ToolRegistry, promptManager } from "./Agent.ts";
import { NymeriaEnrichmentTool } from "../tools/NymeriaEnrichmentTool.ts";
import { SearchTool } from "./Agent.ts"; // Reuse the base search tool

// Register profile enrichment prompt template
promptManager.registerTemplate({
  id: 'profile_enrichment',
  name: 'Profile Enrichment',
  template: `You are an AI assistant specialized in enriching professional profiles with contact information and additional data.

Task: {{task}}
Profiles to enrich: {{profiles}}

Available tools:
{{tools}}

Your enrichment process should:
1. Use the Nymeria API to find contact information (email, phone)
2. Search for additional professional information if needed
3. Compile a comprehensive profile with all available data
4. Handle cases where profiles cannot be enriched gracefully

When using tools, format your calls as:
<tool_call>
{"name": "tool_name", "params": {"param1": "value1"}}
</tool_call>

Return enriched profiles in a structured format with:
- Original profile data
- Contact information (emails, phone numbers)
- Social media profiles
- Current employment details
- Enrichment status and confidence level`,
  variables: ['task', 'profiles', 'tools']
});

export interface ProfileToEnrich {
  name: string;
  linkedinUrl?: string;
  company?: string;
  title?: string;
}

export interface EnrichedProfile extends ProfileToEnrich {
  emails?: Array<{ email: string; type: string; confidence: number }>;
  phoneNumbers?: Array<{ number: string; type: string }>;
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  enrichmentStatus: 'success' | 'partial' | 'failed';
  enrichmentSource?: string;
  lastUpdated: Date;
}

export class ProfileEnrichmentAgent extends Agent<{
  task: 'enrich-single' | 'enrich-batch' | 'verify-contact';
  profiles?: ProfileToEnrich | ProfileToEnrich[];
  email?: string;
}> {
  constructor(model: GoogleGenerativeAI, nymeriaApiKey: string) {
    const template = promptManager.getTemplate('profile_enrichment');
    if (!template) {
      throw new Error('Profile enrichment template not found');
    }

    const toolRegistry = new ToolRegistry();
    
    // Register enrichment tools
    toolRegistry.register(new NymeriaEnrichmentTool(nymeriaApiKey));
    toolRegistry.register(new SearchTool()); // For additional searches if needed

    super(model, template, toolRegistry);
  }

  async enrichProfile(profile: ProfileToEnrich): Promise<EnrichedProfile> {
    const result = await this.run({
      task: 'enrich-single',
      profiles: profile
    });

    // Parse the result and return structured data
    try {
      const enrichedData = JSON.parse(result);
      return {
        ...profile,
        ...enrichedData,
        lastUpdated: new Date()
      };
    } catch {
      // If parsing fails, return with failed status
      return {
        ...profile,
        enrichmentStatus: 'failed',
        lastUpdated: new Date()
      };
    }
  }

  async enrichProfiles(profiles: ProfileToEnrich[]): Promise<EnrichedProfile[]> {
    const result = await this.run({
      task: 'enrich-batch',
      profiles
    });

    // Parse batch results
    try {
      const enrichedData = JSON.parse(result);
      return Array.isArray(enrichedData) ? enrichedData : [];
    } catch {
      // Return profiles with failed status
      return profiles.map(profile => ({
        ...profile,
        enrichmentStatus: 'failed' as const,
        lastUpdated: new Date()
      }));
    }
  }

  async verifyContactInfo(email: string, profile: ProfileToEnrich): Promise<{
    isValid: boolean;
    confidence: number;
    details?: any;
  }> {
    const result = await this.run({
      task: 'verify-contact',
      email,
      profiles: profile
    });

    try {
      return JSON.parse(result);
    } catch {
      return {
        isValid: false,
        confidence: 0
      };
    }
  }

  // Utility method to format enrichment results for UI display
  formatEnrichmentResults(enrichedProfiles: EnrichedProfile[]): any {
    const summary = {
      total: enrichedProfiles.length,
      successful: enrichedProfiles.filter(p => p.enrichmentStatus === 'success').length,
      partial: enrichedProfiles.filter(p => p.enrichmentStatus === 'partial').length,
      failed: enrichedProfiles.filter(p => p.enrichmentStatus === 'failed').length
    };

    const profiles = enrichedProfiles.map(profile => ({
      name: profile.name,
      title: profile.title,
      company: profile.company,
      contactInfo: {
        emails: profile.emails?.map(e => e.email) || [],
        phones: profile.phoneNumbers?.map(p => p.number) || []
      },
      location: profile.location ? 
        `${profile.location.city || ''}, ${profile.location.state || ''} ${profile.location.country || ''}`.trim() : 
        'Not available',
      status: profile.enrichmentStatus
    }));

    return {
      summary,
      profiles,
      exportReady: enrichedProfiles.filter(p => p.enrichmentStatus !== 'failed')
    };
  }
}