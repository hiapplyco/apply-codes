import { BaseMCPTool, ToolDefinition, ToolResponse } from './base-tool.js';

export class EnhanceJobDescriptionTool extends BaseMCPTool {
  readonly definition: ToolDefinition = {
    name: 'enhance_job_description',
    description: 'Enhance a basic job description with market insights and best practices',
    inputSchema: {
      type: 'object',
      properties: {
        basicDescription: {
          type: 'string',
          description: 'The original job description to enhance',
        },
        targetAudience: {
          type: 'string',
          description: 'Target candidate persona',
        },
        companyHighlights: {
          type: 'string',
          description: 'Unique company selling points',
        },
      },
      required: ['basicDescription'],
    },
  };

  async execute(args: Record<string, any>): Promise<ToolResponse> {
    const { basicDescription, targetAudience, companyHighlights } = args;

    const enhanced = `# Enhanced Job Description

${basicDescription}

## Why Join Us?

${companyHighlights || 'We offer an innovative work environment where your contributions directly impact our success. Our team values collaboration, continuous learning, and work-life balance.'}

## What Makes This Role Special

- Direct impact on company strategy and growth
- Opportunity to work with cutting-edge technologies
- Mentorship from industry leaders
- Clear career progression path
- Flexible work arrangements

## Our Culture

We believe in fostering an environment where everyone can do their best work. Our values include:
- Innovation and creativity
- Diversity and inclusion
- Continuous learning
- Work-life balance
- Transparency and open communication

## Growth Opportunities

This role offers significant growth potential, with opportunities to:
- Lead larger initiatives
- Expand your skill set
- Mentor others
- Shape company direction
- Advance your career

${targetAudience ? `\n## Ideal Candidate\n\n${targetAudience}` : ''}

Ready to make an impact? We'd love to hear from you!`;

    return this.textResponse(enhanced);
  }
}
