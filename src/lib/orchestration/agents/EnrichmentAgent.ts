import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentCapability } from '@/types/orchestration';
import { supabase } from '@/integrations/supabase/client';
import NymeriaService from '@/services/nymeriaService';

interface EnrichmentTaskInput {
  candidates: Array<{
    id: string;
    name: string;
    profileUrl?: string;
    email?: string;
    company?: string;
  }>;
  enrichmentTypes?: ('contact' | 'social' | 'experience' | 'skills')[];
  includeVerification?: boolean;
}

interface EnrichedCandidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  currentRole?: {
    title: string;
    company: string;
    startDate?: string;
    description?: string;
  };
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  skills?: string[];
  education?: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  enrichmentSource: string[];
  verificationStatus?: {
    email?: 'verified' | 'unverified' | 'invalid';
    phone?: 'verified' | 'unverified' | 'invalid';
  };
  lastUpdated: Date;
}

export class EnrichmentAgent extends BaseAgent {
  private nymeriaService: NymeriaService;

  constructor(context: any) {
    super('enrichment', context);
    this.nymeriaService = new NymeriaService();
  }

  protected initialize(): void {
    this.capabilities = [
      {
        name: 'contact_enrichment',
        description: 'Find email addresses and phone numbers for candidates',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            company: { type: 'string' },
            profileUrl: { type: 'string' }
          }
        }
      },
      {
        name: 'profile_enrichment',
        description: 'Enrich candidate profiles with experience and skills',
        inputSchema: {
          type: 'object',
          properties: {
            candidateId: { type: 'string' },
            profileUrl: { type: 'string' }
          }
        }
      },
      {
        name: 'social_enrichment',
        description: 'Find social media profiles and online presence',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' }
          }
        }
      },
      {
        name: 'verification',
        description: 'Verify contact information validity',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            phone: { type: 'string' }
          }
        }
      }
    ];

    this.metrics.capabilities = this.capabilities.map(c => c.name);
  }

  public canHandle(task: AgentTask): boolean {
    return task.type === 'enrichment' || 
           task.type === 'contact_discovery' || 
           task.type === 'profile_enrichment';
  }

  protected async executeTask(task: AgentTask): Promise<EnrichedCandidate[]> {
    const input = task.input as EnrichmentTaskInput;
    const enrichmentTypes = input.enrichmentTypes || ['contact', 'experience', 'skills'];
    
    const enrichedCandidates = await Promise.all(
      input.candidates.map(candidate => 
        this.enrichCandidate(candidate, enrichmentTypes, input.includeVerification)
      )
    );

    // Save enriched data to database
    await this.saveEnrichedData(enrichedCandidates);

    return enrichedCandidates;
  }

  private async enrichCandidate(
    candidate: any,
    enrichmentTypes: string[],
    includeVerification?: boolean
  ): Promise<EnrichedCandidate> {
    const enriched: EnrichedCandidate = {
      id: candidate.id,
      name: candidate.name,
      enrichmentSource: [],
      lastUpdated: new Date()
    };

    try {
      // Contact enrichment
      if (enrichmentTypes.includes('contact')) {
        const contactInfo = await this.enrichContactInfo(candidate);
        if (contactInfo) {
          enriched.email = contactInfo.email;
          enriched.phone = contactInfo.phone;
          enriched.enrichmentSource.push('nymeria');
        }
      }

      // Social enrichment
      if (enrichmentTypes.includes('social')) {
        const socialProfiles = await this.enrichSocialProfiles(candidate);
        if (socialProfiles) {
          enriched.linkedinUrl = socialProfiles.linkedin;
          enriched.githubUrl = socialProfiles.github;
          enriched.enrichmentSource.push('social_search');
        }
      }

      // Experience enrichment
      if (enrichmentTypes.includes('experience') && (candidate.profileUrl || enriched.linkedinUrl)) {
        const experience = await this.enrichExperience(
          candidate.profileUrl || enriched.linkedinUrl
        );
        if (experience) {
          enriched.currentRole = experience.currentRole;
          enriched.experience = experience.history;
          enriched.education = experience.education;
          enriched.enrichmentSource.push('profile_parsing');
        }
      }

      // Skills enrichment
      if (enrichmentTypes.includes('skills')) {
        const skills = await this.enrichSkills(candidate, enriched);
        if (skills && skills.length > 0) {
          enriched.skills = skills;
          enriched.enrichmentSource.push('skills_inference');
        }
      }

      // Contact verification
      if (includeVerification && (enriched.email || enriched.phone)) {
        enriched.verificationStatus = await this.verifyContactInfo(
          enriched.email,
          enriched.phone
        );
      }

    } catch (error) {
      console.error(`Failed to enrich candidate ${candidate.id}:`, error);
    }

    return enriched;
  }

  private async enrichContactInfo(candidate: any): Promise<any> {
    try {
      // Use Nymeria for contact discovery
      const person = await this.nymeriaService.findPerson({
        name: candidate.name,
        company: candidate.company || '',
        domain: candidate.company ? this.extractDomain(candidate.company) : undefined
      });

      if (person && person.id) {
        const details = await this.nymeriaService.getPersonDetails(person.id);
        return {
          email: details.email,
          phone: details.phone_numbers?.[0]
        };
      }
    } catch (error) {
      console.error('Nymeria enrichment failed:', error);
    }

    // Fallback to Gemini-based enrichment
    return this.inferContactInfo(candidate);
  }

  private async inferContactInfo(candidate: any): Promise<any> {
    const prompt = `Based on the following candidate information, infer likely email patterns:
    Name: ${candidate.name}
    Company: ${candidate.company || 'Unknown'}
    Profile URL: ${candidate.profileUrl || 'None'}
    
    Provide the most likely email address format and any alternative patterns.
    Also suggest how to find their contact information ethically.`;

    const response = await this.callGeminiAPI(prompt);
    return response.contactInfo;
  }

  private async enrichSocialProfiles(candidate: any): Promise<any> {
    const prompt = `Search for social media profiles for:
    Name: ${candidate.name}
    ${candidate.email ? `Email: ${candidate.email}` : ''}
    ${candidate.company ? `Company: ${candidate.company}` : ''}
    
    Find LinkedIn, GitHub, Twitter, and other professional profiles.`;

    const response = await this.callGeminiAPI(prompt);
    return response.socialProfiles;
  }

  private async enrichExperience(profileUrl: string): Promise<any> {
    // If it's a LinkedIn URL, we could use a LinkedIn scraping service
    // For now, use Gemini to analyze any available data
    
    const prompt = `Extract work experience and education from this profile:
    URL: ${profileUrl}
    
    Include:
    1. Current role (title, company, duration)
    2. Work history (last 5 positions)
    3. Education background
    4. Notable achievements`;

    const response = await this.callGeminiAPI(prompt);
    return response.experience;
  }

  private async enrichSkills(candidate: any, enrichedData: any): Promise<string[]> {
    const context = {
      name: candidate.name,
      currentRole: enrichedData.currentRole,
      experience: enrichedData.experience,
      profileUrl: candidate.profileUrl
    };

    const prompt = `Based on this candidate's profile, identify their likely technical and soft skills:
    ${JSON.stringify(context, null, 2)}
    
    Provide a list of 10-15 most relevant skills based on their experience.`;

    const response = await this.callGeminiAPI(prompt);
    return response.skills || [];
  }

  private async verifyContactInfo(email?: string, phone?: string): Promise<any> {
    const verificationStatus: any = {};

    if (email) {
      // Email verification logic
      verificationStatus.email = await this.verifyEmail(email);
    }

    if (phone) {
      // Phone verification logic
      verificationStatus.phone = await this.verifyPhone(phone);
    }

    return verificationStatus;
  }

  private async verifyEmail(email: string): Promise<'verified' | 'unverified' | 'invalid'> {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'invalid';
    }

    // Could integrate with email verification service
    // For now, return unverified for valid format
    return 'unverified';
  }

  private async verifyPhone(phone: string): Promise<'verified' | 'unverified' | 'invalid'> {
    // Basic phone validation
    const phoneRegex = /^\+?[\d\s-()]+$/;
    if (!phoneRegex.test(phone) || phone.length < 10) {
      return 'invalid';
    }

    // Could integrate with phone verification service
    return 'unverified';
  }

  private extractDomain(company: string): string {
    // Simple domain extraction logic
    const commonDomains = ['.com', '.io', '.co', '.ai', '.dev'];
    const companyName = company.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/inc|llc|ltd|corp|corporation/g, '');
    
    return `${companyName}.com`;
  }

  private async saveEnrichedData(candidates: EnrichedCandidate[]): Promise<void> {
    try {
      const enrichmentRecords = candidates.map(candidate => ({
        candidate_id: candidate.id,
        enriched_data: candidate,
        sources: candidate.enrichmentSource,
        agent_id: this.id,
        context: this.context,
        created_at: new Date().toISOString()
      }));

      await supabase.from('candidate_enrichment').insert(enrichmentRecords);
    } catch (error) {
      console.error('Failed to save enrichment data:', error);
    }
  }

  protected async handleRequest(message: AgentMessage): Promise<void> {
    switch (message.action) {
      case 'enrich_single':
        await this.handleEnrichSingle(message);
        break;
      case 'verify_contact':
        await this.handleVerifyContact(message);
        break;
      case 'bulk_enrich':
        await this.handleBulkEnrich(message);
        break;
      default:
        await super.handleRequest(message);
    }
  }

  private async handleEnrichSingle(message: AgentMessage): Promise<void> {
    const { candidate, enrichmentTypes } = message.payload;
    
    const enriched = await this.enrichCandidate(
      candidate,
      enrichmentTypes || ['contact'],
      true
    );

    this.sendMessage(message.from, 'enrichment_complete', {
      candidate: enriched
    });
  }

  private async handleVerifyContact(message: AgentMessage): Promise<void> {
    const { email, phone } = message.payload;
    
    const verification = await this.verifyContactInfo(email, phone);

    this.sendMessage(message.from, 'verification_complete', {
      verification
    });
  }

  private async handleBulkEnrich(message: AgentMessage): Promise<void> {
    const { candidates, options } = message.payload;
    
    // Process in batches to avoid overwhelming APIs
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      const enrichedBatch = await Promise.all(
        batch.map((c: any) => this.enrichCandidate(c, options.enrichmentTypes, false))
      );
      results.push(...enrichedBatch);
      
      // Send progress update
      this.sendMessage(message.from, 'bulk_progress', {
        processed: i + batch.length,
        total: candidates.length
      });
    }

    this.sendMessage(message.from, 'bulk_complete', {
      candidates: results
    });
  }
}