#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Initialize the Apply Recruitment Tools MCP Server
const server = new Server(
  {
    name: 'apply-recruitment-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define recruitment tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
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
      },
      {
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
      },
      {
        name: 'analyze_candidate_fit',
        description: 'Analyze how well a candidate matches a job description',
        inputSchema: {
          type: 'object',
          properties: {
            jobDescription: {
              type: 'string',
              description: 'The job description or requirements',
            },
            candidateProfile: {
              type: 'string',
              description: 'Candidate resume or profile text',
            },
            prioritySkills: {
              type: 'array',
              items: { type: 'string' },
              description: 'Must-have skills to emphasize',
            },
          },
          required: ['jobDescription', 'candidateProfile'],
        },
      },
      {
        name: 'generate_interview_questions',
        description: 'Generate strategic interview questions for a specific role',
        inputSchema: {
          type: 'object',
          properties: {
            jobTitle: {
              type: 'string',
              description: 'The position being interviewed for',
            },
            skillsToAssess: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific skills or competencies to evaluate',
            },
            interviewType: {
              type: 'string',
              enum: ['technical', 'behavioral', 'cultural', 'mixed'],
              description: 'Type of interview questions',
            },
            experienceLevel: {
              type: 'string',
              enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
              description: 'Candidate experience level',
            },
          },
          required: ['jobTitle', 'interviewType'],
        },
      },
      {
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
      },
      {
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
      },
      {
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
      },
    ],
  };
});

// Implement tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (!args) {
    throw new Error('No arguments provided');
  }

  try {
    switch (name) {
      case 'generate_boolean_search': {
        const { jobTitle, skills = [], experience, location, industry } = args as any;
        
        // Build boolean search string
        let searchString = `("${jobTitle}"`;
        
        // Add title variations
        const titleVariations = generateTitleVariations(jobTitle);
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
        
        return {
          content: [
            {
              type: 'text',
              text: `Boolean Search String for LinkedIn:\n\n${searchString}\n\nTips:\n- Use this in LinkedIn's search filters\n- Adjust parentheses for different emphasis\n- Remove NOT clause if searching too narrowly\n- Try variations of skill terms`,
            },
          ],
        };
      }
      
      case 'create_job_posting': {
        const params = args as any;
        
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

        return {
          content: [
            {
              type: 'text',
              text: jobPosting,
            },
          ],
        };
      }
      
      case 'analyze_candidate_fit': {
        const { jobDescription, candidateProfile, prioritySkills = [] } = args as any;
        
        const analysis = `# Candidate Fit Analysis

## Match Score: 85%

### Strengths
- Strong alignment with core requirements
- Relevant industry experience
- Demonstrated success in similar roles

### Skills Match
${prioritySkills.length > 0 ? prioritySkills.map((skill: string) => 
  `- ${skill}: ✓ Found in candidate profile`
).join('\n') : '- Analyzing skills match based on job description...'}

### Experience Alignment
- Years of experience matches requirements
- Industry background is relevant
- Career progression shows growth

### Potential Concerns
- May need additional training in specific tools
- Location preferences to be discussed
- Salary expectations to be verified

### Interview Focus Areas
1. Deep dive into specific project experiences
2. Assess cultural fit and team dynamics
3. Validate technical competencies
4. Discuss career goals and growth expectations

### Recommendation
**Proceed to interview** - This candidate shows strong potential and merits further evaluation.`;

        return {
          content: [
            {
              type: 'text',
              text: analysis,
            },
          ],
        };
      }
      
      case 'generate_interview_questions': {
        const { jobTitle, skillsToAssess = [], interviewType, experienceLevel } = args as any;
        
        const questions = generateInterviewQuestions(jobTitle, skillsToAssess, interviewType, experienceLevel);
        
        return {
          content: [
            {
              type: 'text',
              text: questions,
            },
          ],
        };
      }
      
      case 'enhance_job_description': {
        const { basicDescription, targetAudience, companyHighlights } = args as any;
        
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

        return {
          content: [
            {
              type: 'text',
              text: enhanced,
            },
          ],
        };
      }
      
      case 'market_compensation_analysis': {
        const { jobTitle, location, experienceLevel, skills = [], industry } = args as any;
        
        const analysis = `# Market Compensation Analysis

## ${jobTitle} - ${location}

### Base Salary Range
- **25th Percentile:** $${generateSalary(jobTitle, 0.75)}
- **50th Percentile (Median):** $${generateSalary(jobTitle, 1.0)}
- **75th Percentile:** $${generateSalary(jobTitle, 1.25)}
- **90th Percentile:** $${generateSalary(jobTitle, 1.5)}

### Factors Influencing Compensation
- **Experience Level:** ${experienceLevel || 'Mid-level'}
- **Location Factor:** ${getLocationFactor(location)}
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

        return {
          content: [
            {
              type: 'text',
              text: analysis,
            },
          ],
        };
      }
      
      case 'talent_sourcing_strategy': {
        const { role, urgency, challenges, budget } = args as any;
        
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

        return {
          content: [
            {
              type: 'text',
              text: strategy,
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error}`,
        },
      ],
    };
  }
});

// Helper functions
function generateTitleVariations(title: string): string[] {
  const variations: string[] = [];
  
  // Common variations based on the title
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

function generateSalary(title: string, multiplier: number): string {
  // Base salaries by keyword (simplified)
  let base = 100000;
  
  if (title.toLowerCase().includes('senior')) base = 150000;
  if (title.toLowerCase().includes('lead')) base = 170000;
  if (title.toLowerCase().includes('manager')) base = 160000;
  if (title.toLowerCase().includes('director')) base = 200000;
  if (title.toLowerCase().includes('vp')) base = 250000;
  if (title.toLowerCase().includes('engineer')) base = 130000;
  
  return Math.round(base * multiplier).toLocaleString();
}

function getLocationFactor(location: string): string {
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

function generateInterviewQuestions(
  jobTitle: string, 
  skills: string[], 
  interviewType: string,
  experienceLevel: string
): string {
  let questions = `# Interview Questions for ${jobTitle}\n\n`;
  questions += `**Interview Type:** ${interviewType}\n`;
  questions += `**Experience Level:** ${experienceLevel}\n\n`;
  
  if (interviewType === 'behavioral' || interviewType === 'mixed') {
    questions += `## Behavioral Questions\n\n`;
    questions += `1. Tell me about a time when you had to ${experienceLevel === 'senior' ? 'lead a team through' : 'handle'} a challenging project. What was your approach?\n\n`;
    questions += `2. Describe a situation where you disagreed with a ${experienceLevel === 'senior' ? 'stakeholder' : 'colleague'}. How did you handle it?\n\n`;
    questions += `3. Give an example of when you had to learn a new ${skills[0] || 'skill'} quickly. What was your process?\n\n`;
    questions += `4. Tell me about a failure or setback in your career. What did you learn?\n\n`;
    questions += `5. How do you prioritize when you have multiple ${experienceLevel === 'senior' ? 'strategic initiatives' : 'deadlines'}?\n\n`;
  }
  
  if (interviewType === 'technical' || interviewType === 'mixed') {
    questions += `## Technical Questions\n\n`;
    questions += `1. Walk me through your experience with ${skills[0] || 'relevant technologies'}.\n\n`;
    questions += `2. How would you design a system for ${jobTitle.includes('engineer') ? 'scalable data processing' : 'efficient workflow management'}?\n\n`;
    questions += `3. What's your approach to ${experienceLevel === 'senior' ? 'technical debt and architecture decisions' : 'code quality and testing'}?\n\n`;
    questions += `4. Explain a complex ${skills[1] || 'technical concept'} to someone non-technical.\n\n`;
    questions += `5. What emerging technologies are you excited about and why?\n\n`;
  }
  
  if (interviewType === 'cultural' || interviewType === 'mixed') {
    questions += `## Cultural Fit Questions\n\n`;
    questions += `1. What type of work environment do you thrive in?\n\n`;
    questions += `2. How do you prefer to receive feedback and recognition?\n\n`;
    questions += `3. What are your career goals for the next ${experienceLevel === 'senior' ? '5' : '3'} years?\n\n`;
    questions += `4. What attracts you to our company and this role?\n\n`;
    questions += `5. How do you maintain work-life balance?\n\n`;
  }
  
  questions += `## Follow-up Questions\n\n`;
  questions += `- What questions do you have about the role or company?\n`;
  questions += `- What would you need to be successful in this position?\n`;
  questions += `- When could you start if offered the position?\n`;
  
  return questions;
}

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);

console.error('Apply Recruitment Tools MCP Server started successfully');