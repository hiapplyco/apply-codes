import { BaseMCPTool, ToolDefinition, ToolResponse } from './base-tool.js';

export class CreateJobPostingTool extends BaseMCPTool {
  readonly definition: ToolDefinition = {
    name: 'create_job_posting',
    description: 'Create a comprehensive job posting with market insights',
    inputSchema: {
      type: 'object',
      properties: {
        companyName: {
          type: 'string',
          description: 'Name of the hiring company',
        },
        jobTitle: {
          type: 'string',
          description: 'Position title',
        },
        department: {
          type: 'string',
          description: 'Department or team',
        },
        location: {
          type: 'string',
          description: 'Job location or remote options',
        },
        jobType: {
          type: 'string',
          enum: ['full-time', 'part-time', 'contract', 'internship'],
          description: 'Employment type',
        },
        experienceLevel: {
          type: 'string',
          enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
          description: 'Required experience level',
        },
        responsibilities: {
          type: 'string',
          description: 'Key responsibilities and duties',
        },
        requirements: {
          type: 'string',
          description: 'Required qualifications and skills',
        },
        salaryRange: {
          type: 'string',
          description: 'Salary range (optional)',
        },
        benefits: {
          type: 'string',
          description: 'Benefits and perks (optional)',
        },
      },
      required: ['companyName', 'jobTitle', 'location', 'jobType', 'experienceLevel'],
    },
  };

  async execute(args: Record<string, any>): Promise<ToolResponse> {
    const params = args;

    const jobPosting = `# ${params.jobTitle} - ${params.companyName}

**Location:** ${params.location}
**Type:** ${params.jobType}
**Experience Level:** ${params.experienceLevel}
**Department:** ${params.department || 'TBD'}

## About the Role

We are seeking a talented ${params.jobTitle} to join our ${params.department || 'team'} at ${params.companyName}. This is an exciting opportunity for a ${params.experienceLevel}-level professional to make a significant impact in our organization.

## Key Responsibilities

${params.responsibilities || '- Lead and execute key initiatives\n- Collaborate with cross-functional teams\n- Drive continuous improvement\n- Mentor team members'}

## Requirements

${params.requirements || '- Proven experience in similar role\n- Strong communication skills\n- Technical expertise in relevant areas\n- Leadership capabilities'}

## What We Offer

${params.salaryRange ? `**Compensation:** ${params.salaryRange}\n\n` : ''}${params.benefits || '- Competitive salary and equity\n- Comprehensive health benefits\n- Flexible work arrangements\n- Professional development opportunities\n- Inclusive company culture'}

## How to Apply

Interested candidates should submit their resume and cover letter highlighting relevant experience and achievements.

${params.companyName} is an equal opportunity employer committed to building a diverse and inclusive team.`;

    return this.textResponse(jobPosting);
  }
}
