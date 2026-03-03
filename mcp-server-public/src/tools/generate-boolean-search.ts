import { BaseMCPTool, ToolDefinition, ToolResponse } from './base-tool.js';

export class GenerateBooleanSearchTool extends BaseMCPTool {
  readonly definition: ToolDefinition = {
    name: 'generate_boolean_search',
    description: 'Generate optimized LinkedIn boolean search strings for a job role',
    inputSchema: {
      type: 'object',
      properties: {
        jobTitle: {
          type: 'string',
          description: 'The job title to search for (e.g., "Senior Software Engineer")',
        },
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'Required skills for the role',
        },
        experience: {
          type: 'string',
          description: 'Years of experience required (e.g., "5-7 years", "senior level")',
        },
        location: {
          type: 'string',
          description: 'Preferred location or "remote"',
        },
        industry: {
          type: 'string',
          description: 'Target industry (optional)',
        },
      },
      required: ['jobTitle'],
    },
  };

  async execute(args: Record<string, any>): Promise<ToolResponse> {
    const { jobTitle, skills = [], experience, location, industry } = args;

    // Build boolean search string
    let searchString = `("${jobTitle}"`;

    // Add title variations
    const titleVariations = this.generateTitleVariations(jobTitle);
    if (titleVariations.length > 0) {
      searchString += ` OR ${titleVariations.map(t => `"${t}"`).join(' OR ')}`;
    }
    searchString += ')';

    // Add skills
    if (skills.length > 0) {
      searchString += ` AND (${skills.map((s: string) => `"${s}"`).join(' OR ')})`;
    }

    // Add experience
    if (experience) {
      searchString += ` AND ("${experience}" OR "${experience} experience")`;
    }

    // Add location
    if (location) {
      searchString += ` AND ("${location}")`;
    }

    // Add industry
    if (industry) {
      searchString += ` AND ("${industry}")`;
    }

    // Exclude common unwanted terms
    searchString += ' NOT (recruiter OR "staffing agency" OR "talent acquisition")';

    return this.textResponse(
      `Boolean Search String for LinkedIn:\n\n${searchString}\n\nTips:\n- Use this in LinkedIn's search filters\n- Adjust parentheses for different emphasis\n- Remove NOT clause if searching too narrowly\n- Try variations of skill terms`
    );
  }

  private generateTitleVariations(title: string): string[] {
    const variations: string[] = [];

    if (title.toLowerCase().includes('engineer')) {
      variations.push(title.replace(/engineer/i, 'developer'));
      variations.push(title.replace(/engineer/i, 'programmer'));
    }
    if (title.toLowerCase().includes('senior')) {
      variations.push(title.replace(/senior/i, 'sr'));
      variations.push(title.replace(/senior/i, 'lead'));
    }
    if (title.toLowerCase().includes('manager')) {
      variations.push(title.replace(/manager/i, 'lead'));
      variations.push(title.replace(/manager/i, 'head of'));
    }

    return variations;
  }
}
