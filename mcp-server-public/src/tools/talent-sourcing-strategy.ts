import { BaseMCPTool, ToolDefinition, ToolResponse } from './base-tool.js';

export class TalentSourcingStrategyTool extends BaseMCPTool {
  readonly definition: ToolDefinition = {
    name: 'talent_sourcing_strategy',
    description: 'Generate a comprehensive talent sourcing strategy',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The role to source for',
        },
        urgency: {
          type: 'string',
          enum: ['immediate', 'within-month', 'quarterly'],
          description: 'Hiring timeline',
        },
        challenges: {
          type: 'string',
          description: 'Specific sourcing challenges (e.g., "rare skillset", "competitive market")',
        },
        budget: {
          type: 'string',
          enum: ['limited', 'moderate', 'flexible'],
          description: 'Recruiting budget constraints',
        },
      },
      required: ['role', 'urgency'],
    },
  };

  async execute(args: Record<string, any>): Promise<ToolResponse> {
    const { role, urgency, challenges, budget } = args;

    const strategy = `# Talent Sourcing Strategy

## Role: ${role}
**Timeline:** ${urgency}
**Budget:** ${budget || 'Moderate'}
**Key Challenges:** ${challenges || 'Competitive market'}

### Recommended Sourcing Channels

1. **LinkedIn Recruiting** (Primary)
   - Use advanced boolean searches
   - Leverage LinkedIn Recruiter
   - Engage passive candidates
   - Time: 40% of effort

2. **Employee Referrals**
   - Launch targeted referral campaign
   - Offer enhanced referral bonuses
   - Create referral toolkit
   - Time: 20% of effort

3. **Direct Sourcing**
   - GitHub for technical roles
   - Industry-specific communities
   - Professional associations
   - Time: 20% of effort

4. **Job Boards & Platforms**
   - Indeed, Glassdoor (broad reach)
   - AngelList (startups)
   - Specialized boards
   - Time: 10% of effort

5. **Recruitment Marketing**
   - Employer branding content
   - Social media presence
   - Tech talks/webinars
   - Time: 10% of effort

### Week-by-Week Plan

**Week 1-2:** Setup and Launch
- Create compelling job posting
- Activate all sourcing channels
- Brief internal team
- Launch referral program

**Week 3-4:** Active Sourcing
- Daily LinkedIn outreach (20-30 candidates)
- Screen initial applicants
- Conduct first rounds
- Adjust strategy based on response

**Week 5-6:** Pipeline Development
- Nurture promising candidates
- Coordinate interviews
- Gather feedback
- Expand search if needed

### Success Metrics
- Response rate: >25%
- Qualified candidates: 10-15
- Interviews scheduled: 5-8
- Offers extended: 1-2

### Budget Allocation
- LinkedIn Recruiter: 40%
- Job board postings: 20%
- Referral bonuses: 25%
- Recruitment marketing: 15%`;

    return this.textResponse(strategy);
  }
}
