import { BaseMCPTool, ToolDefinition, ToolResponse } from './base-tool.js';

export class GenerateInterviewQuestionsTool extends BaseMCPTool {
  readonly definition: ToolDefinition = {
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
  };

  async execute(args: Record<string, any>): Promise<ToolResponse> {
    const { jobTitle, skillsToAssess = [], interviewType, experienceLevel } = args;
    const questions = this.generateQuestions(jobTitle, skillsToAssess, interviewType, experienceLevel);
    return this.textResponse(questions);
  }

  private generateQuestions(
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
}
