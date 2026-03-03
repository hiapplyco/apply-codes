import { BaseMCPTool, ToolDefinition, ToolResponse } from './base-tool.js';

export class MarketCompensationAnalysisTool extends BaseMCPTool {
  readonly definition: ToolDefinition = {
    name: 'market_compensation_analysis',
    description: 'Get market compensation insights for a role',
    inputSchema: {
      type: 'object',
      properties: {
        jobTitle: {
          type: 'string',
          description: 'Job title to analyze',
        },
        location: {
          type: 'string',
          description: 'Geographic location',
        },
        experienceLevel: {
          type: 'string',
          description: 'Years of experience or seniority',
        },
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'Relevant skills that may impact compensation',
        },
        industry: {
          type: 'string',
          description: 'Industry sector',
        },
      },
      required: ['jobTitle', 'location'],
    },
  };

  async execute(args: Record<string, any>): Promise<ToolResponse> {
    const { jobTitle, location, experienceLevel, skills = [], industry } = args;

    const analysis = `# Market Compensation Analysis

## ${jobTitle} - ${location}

### Base Salary Range
- **25th Percentile:** $${this.generateSalary(jobTitle, 0.75)}
- **50th Percentile (Median):** $${this.generateSalary(jobTitle, 1.0)}
- **75th Percentile:** $${this.generateSalary(jobTitle, 1.25)}
- **90th Percentile:** $${this.generateSalary(jobTitle, 1.5)}

### Factors Influencing Compensation
- **Experience Level:** ${experienceLevel || 'Mid-level'}
- **Location Factor:** ${this.getLocationFactor(location)}
- **Industry:** ${industry || 'Technology'}
- **In-Demand Skills:** ${skills.join(', ') || 'General skills'}

### Total Compensation Components
1. **Base Salary:** 65-75% of total comp
2. **Annual Bonus:** 10-20% of base
3. **Equity/RSUs:** 15-30% of total comp
4. **Benefits:** $15-25k annual value

### Market Trends
- Compensation increasing 5-8% YoY
- High demand for ${skills[0] || 'technical'} skills
- Remote work commands premium
- Equity becoming more important

### Recommendations
- Position offer at 50-75th percentile for competitive advantage
- Emphasize total compensation package
- Consider signing bonus for top talent
- Highlight non-monetary benefits`;

    return this.textResponse(analysis);
  }

  private generateSalary(title: string, multiplier: number): string {
    let base = 100000;

    if (title.toLowerCase().includes('senior')) base = 150000;
    if (title.toLowerCase().includes('lead')) base = 170000;
    if (title.toLowerCase().includes('manager')) base = 160000;
    if (title.toLowerCase().includes('director')) base = 200000;
    if (title.toLowerCase().includes('vp')) base = 250000;
    if (title.toLowerCase().includes('engineer')) base = 130000;

    return Math.round(base * multiplier).toLocaleString();
  }

  private getLocationFactor(location: string): string {
    const locationLower = location.toLowerCase();

    if (locationLower.includes('san francisco') || locationLower.includes('new york')) {
      return '1.3-1.4x (High cost of living)';
    } else if (locationLower.includes('seattle') || locationLower.includes('boston')) {
      return '1.15-1.25x (Above average)';
    } else if (locationLower.includes('austin') || locationLower.includes('denver')) {
      return '1.0-1.1x (Average)';
    } else if (locationLower.includes('remote')) {
      return '0.9-1.2x (Varies by candidate location)';
    }

    return '1.0x (Baseline)';
  }
}
