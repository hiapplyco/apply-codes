
import { z } from 'zod';
import { BaseMCPTool } from '../utils/base-tool.js';
import { MCPSession, MCPError } from '../types/mcp.js';

// Generate Interview Questions Tool
export class GenerateInterviewQuestionsTool extends BaseMCPTool {
  constructor() {
    super(
      'generate_interview_questions',
      'Generate tailored interview questions based on job role, experience level, and interview type',
      z.object({
        jobRole: z.string().describe('The job role/position title'),
        experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).describe('Experience level of the candidate'),
        interviewType: z.enum(['technical', 'behavioral', 'cultural', 'screening', 'panel', 'final']).describe('Type of interview'),
        skills: z.array(z.string()).optional().describe('Key skills to focus on'),
        duration: z.number().default(60).describe('Interview duration in minutes'),
        company: z.string().default('our company').describe('Company name for context')
      })
    );
  }

  protected async handler(input: any, session?: MCPSession) {
    const {
      jobRole,
      experienceLevel,
      interviewType,
      skills = [],
      duration = 60,
      company = 'our company'
    } = input;

    const questions = this.generateQuestions(jobRole, experienceLevel, interviewType, skills, duration);
    const structure = this.createInterviewStructure(duration, interviewType);
    const evaluationCriteria = this.createEvaluationCriteria(jobRole, experienceLevel, interviewType);

    const interviewGuide = {
      metadata: {
        jobRole,
        experienceLevel,
        interviewType,
        duration: `${duration} minutes`,
        company,
        generatedAt: new Date().toISOString()
      },
      structure,
      questions,
      evaluationCriteria,
      tips: this.getInterviewTips(interviewType),
      nextSteps: [
        'Review questions and customize for specific candidate',
        'Prepare follow-up questions based on candidate responses',
        'Set up interview environment and materials',
        'Brief co-interviewers if applicable'
      ]
    };

    return interviewGuide;
  }

  private generateQuestions(role: string, level: string, type: string, skills: string[], duration: number) {
    const questionCount = Math.floor(duration / 8); // Approximately 8 minutes per question
    const questions = [];

    if (type === 'technical') {
      questions.push(...this.getTechnicalQuestions(role, level, skills, questionCount));
    } else if (type === 'behavioral') {
      questions.push(...this.getBehavioralQuestions(role, level, questionCount));
    } else if (type === 'cultural') {
      questions.push(...this.getCulturalQuestions(role, level, questionCount));
    } else if (type === 'screening') {
      questions.push(...this.getScreeningQuestions(role, level, skills, questionCount));
    } else if (type === 'panel') {
      questions.push(...this.getPanelQuestions(role, level, questionCount));
    } else if (type === 'final') {
      questions.push(...this.getFinalQuestions(role, level, questionCount));
    }

    return questions.slice(0, questionCount);
  }

  private getTechnicalQuestions(role: string, level: string, skills: string[], count: number) {
    const questions = [];
    const isEngineering = role.toLowerCase().includes('engineer') || role.toLowerCase().includes('developer');

    if (isEngineering) {
      questions.push(
        {
          category: 'Technical Knowledge',
          question: `Explain the key architectural decisions you would make when building a ${skills[0] || 'modern web'} application from scratch.`,
          followUps: ['What factors would influence your technology choices?', 'How would you handle scalability concerns?'],
          difficulty: level === 'entry' ? 'basic' : level === 'senior' ? 'advanced' : 'intermediate'
        },
        {
          category: 'Problem Solving',
          question: 'Walk me through your approach to debugging a production issue that users are reporting.',
          followUps: ['What tools would you use?', 'How would you prevent similar issues?'],
          difficulty: 'intermediate'
        },
        {
          category: 'System Design',
          question: level === 'entry' ?
            'How would you structure a simple REST API for a basic CRUD application?' :
            'Design a system that can handle 1 million concurrent users. What are your main considerations?',
          followUps: ['How would you handle data consistency?', 'What about security considerations?'],
          difficulty: level === 'entry' ? 'basic' : 'advanced'
        }
      );

      if (skills.length > 0) {
        skills.slice(0, 2).forEach(skill => {
          questions.push({
            category: 'Specific Technology',
            question: `Tell me about a challenging project where you used ${skill}. What problems did you solve?`,
            followUps: [`What ${skill} features were most important for your solution?`, 'What would you do differently?'],
            difficulty: 'intermediate'
          });
        });
      }
    } else {
      // Non-engineering roles
      const roleSpecificQuestions = this.getRoleSpecificTechnicalQuestions(role, level);
      questions.push(...roleSpecificQuestions);
    }

    return questions;
  }

  private getBehavioralQuestions(role: string, level: string, count: number) {
    const questions = [
      {
        category: 'Leadership & Initiative',
        question: 'Tell me about a time when you had to take ownership of a project or situation without being explicitly asked.',
        followUps: ['What was the outcome?', 'What did you learn from this experience?'],
        purpose: 'Assesses proactivity and leadership potential'
      },
      {
        category: 'Problem Solving',
        question: 'Describe a complex problem you solved at work. Walk me through your thought process.',
        followUps: ['What alternatives did you consider?', 'How did you validate your solution?'],
        purpose: 'Evaluates analytical thinking and problem-solving approach'
      },
      {
        category: 'Collaboration',
        question: 'Tell me about a time when you had to work with a difficult team member. How did you handle it?',
        followUps: ['What was the outcome?', 'What would you do differently?'],
        purpose: 'Assesses interpersonal skills and conflict resolution'
      },
      {
        category: 'Adaptability',
        question: 'Describe a situation where you had to quickly adapt to significant changes in your work environment or project requirements.',
        followUps: ['How did you manage the transition?', 'What helped you adapt successfully?'],
        purpose: 'Evaluates flexibility and change management skills'
      },
      {
        category: 'Achievement',
        question: 'What\'s the most significant accomplishment in your career so far? Why was it meaningful to you?',
        followUps: ['What obstacles did you overcome?', 'How did it impact the organization?'],
        purpose: 'Understanding of candidate values and impact'
      }
    ];

    if (level === 'senior' || level === 'executive') {
      questions.push(
        {
          category: 'Mentorship',
          question: 'Tell me about a time when you mentored or developed someone junior to you.',
          followUps: ['What was your approach?', 'What did you learn from the experience?'],
          purpose: 'Assesses leadership and development capabilities'
        },
        {
          category: 'Strategic Thinking',
          question: 'Describe a time when you identified an opportunity to improve processes or outcomes in your organization.',
          followUps: ['How did you build support for your idea?', 'What was the result?'],
          purpose: 'Evaluates strategic thinking and influence skills'
        }
      );
    }

    return questions;
  }

  private getCulturalQuestions(role: string, level: string, count: number) {
    return [
      {
        category: 'Values Alignment',
        question: 'What type of work environment brings out your best performance?',
        followUps: ['How do you handle feedback?', 'What motivates you most?'],
        purpose: 'Assesses cultural fit and work style preferences'
      },
      {
        category: 'Team Dynamics',
        question: 'How do you prefer to communicate and collaborate with teammates?',
        followUps: ['Give me an example of effective teamwork', 'How do you handle disagreements?'],
        purpose: 'Understanding of collaboration style and conflict resolution'
      },
      {
        category: 'Growth Mindset',
        question: 'Tell me about a skill you\'ve developed recently. How did you approach learning it?',
        followUps: ['What resources did you use?', 'How do you stay current in your field?'],
        purpose: 'Evaluates learning agility and self-development'
      },
      {
        category: 'Work-Life Integration',
        question: 'How do you maintain high performance while managing competing priorities?',
        followUps: ['What does work-life balance mean to you?', 'How do you handle stress?'],
        purpose: 'Assesses sustainability and stress management'
      },
      {
        category: 'Company Mission',
        question: 'What drew you to apply for this role at our company specifically?',
        followUps: ['How do you see yourself contributing to our mission?', 'What excites you most about this opportunity?'],
        purpose: 'Gauges genuine interest and alignment with company goals'
      }
    ];
  }

  private getScreeningQuestions(role: string, level: string, skills: string[], count: number) {
    return [
      {
        category: 'Background Verification',
        question: 'Walk me through your career progression and what led you to apply for this role.',
        followUps: ['What are you looking to do differently in your next role?'],
        timeAllocation: '8-10 minutes'
      },
      {
        category: 'Role Understanding',
        question: 'Based on the job description, what aspects of this role are you most excited about?',
        followUps: ['What questions do you have about the role or team?'],
        timeAllocation: '5-7 minutes'
      },
      {
        category: 'Technical Fit',
        question: skills.length > 0 ?
          `Tell me about your experience with ${skills.slice(0, 2).join(' and ')}.` :
          'What technical skills are you most confident in?',
        followUps: ['Can you give me a specific example?', 'How do you stay current with new developments?'],
        timeAllocation: '10-12 minutes'
      },
      {
        category: 'Logistics',
        question: 'Do you have any constraints regarding start date, location, or other logistics we should discuss?',
        followUps: ['What questions do you have about our interview process?'],
        timeAllocation: '3-5 minutes'
      }
    ];
  }

  private getPanelQuestions(role: string, level: string, count: number) {
    return [
      {
        category: 'Cross-functional Collaboration',
        question: 'Describe a project where you worked across multiple teams or departments. What was your role?',
        followUps: ['How did you handle conflicting priorities?', 'What would you do differently?'],
        panelMember: 'Hiring Manager'
      },
      {
        category: 'Technical Deep Dive',
        question: 'Walk us through a technical decision you made that had significant impact on a project.',
        followUps: ['What alternatives did you consider?', 'How did you measure success?'],
        panelMember: 'Technical Lead'
      },
      {
        category: 'Team Integration',
        question: 'How do you typically onboard to a new team and establish working relationships?',
        followUps: ['What do you need from your team to be successful?'],
        panelMember: 'Team Member'
      },
      {
        category: 'Strategic Contribution',
        question: 'Where do you see this role evolving over the next 1-2 years, and how would you contribute to that evolution?',
        followUps: ['What skills would you want to develop?', 'How would you measure your impact?'],
        panelMember: 'Director/VP'
      }
    ];
  }

  private getFinalQuestions(role: string, level: string, count: number) {
    return [
      {
        category: 'Decision Making',
        question: 'What factors are most important to you in making this career decision?',
        followUps: ['How does this opportunity align with your career goals?'],
        purpose: 'Understand candidate motivation and decision criteria'
      },
      {
        category: 'Expectations Setting',
        question: 'What would success look like for you in the first 90 days in this role?',
        followUps: ['What support would you need to achieve that?', 'How would you measure your progress?'],
        purpose: 'Align expectations and assess planning skills'
      },
      {
        category: 'Two-way Fit',
        question: 'Based on our conversations, what aspects of this role or company culture resonate most with you?',
        followUps: ['Are there any concerns or reservations you\'d like to discuss?'],
        purpose: 'Ensure mutual fit and address any concerns'
      },
      {
        category: 'Final Assessment',
        question: 'Is there anything else you\'d like me to know about your background or interest in this role?',
        followUps: ['What questions do you have for me?'],
        purpose: 'Allow candidate to fill any gaps and demonstrate interest'
      }
    ];
  }

  private getRoleSpecificTechnicalQuestions(role: string, level: string) {
    const roleLower = role.toLowerCase();

    if (roleLower.includes('product')) {
      return [
        {
          category: 'Product Strategy',
          question: 'How would you approach prioritizing features for a product roadmap?',
          followUps: ['What frameworks do you use?', 'How do you handle conflicting stakeholder needs?']
        }
      ];
    } else if (roleLower.includes('marketing')) {
      return [
        {
          category: 'Marketing Strategy',
          question: 'Walk me through how you would develop a go-to-market strategy for a new product.',
          followUps: ['How would you measure success?', 'What channels would you prioritize?']
        }
      ];
    } else if (roleLower.includes('sales')) {
      return [
        {
          category: 'Sales Process',
          question: 'Describe your approach to qualifying and nurturing prospects through the sales funnel.',
          followUps: ['How do you handle objections?', 'What CRM tools have you used?']
        }
      ];
    }

    return [
      {
        category: 'Domain Knowledge',
        question: `What do you see as the biggest challenges facing professionals in ${role.toLowerCase()} roles today?`,
        followUps: ['How are you preparing to address these challenges?']
      }
    ];
  }

  private createInterviewStructure(duration: number, type: string) {
    if (type === 'screening') {
      return {
        introduction: '5 minutes - Welcome and role overview',
        mainDiscussion: `${duration - 10} minutes - Core screening questions`,
        candidateQuestions: '5 minutes - Candidate questions and next steps'
      };
    }

    return {
      introduction: '5 minutes - Welcome and agenda review',
      warmUp: '5 minutes - Background and context',
      coreQuestions: `${duration - 20} minutes - Main interview questions`,
      candidateQuestions: '10 minutes - Candidate questions and wrap-up'
    };
  }

  private createEvaluationCriteria(role: string, level: string, type: string) {
    const baseCriteria = {
      communication: 'Clear articulation of thoughts and ideas',
      relevantExperience: 'Alignment of background with role requirements',
      problemSolving: 'Approach to analyzing and solving problems',
      culturalFit: 'Alignment with company values and team dynamics'
    };

    if (type === 'technical') {
      return {
        ...baseCriteria,
        technicalCompetency: 'Depth of technical knowledge and skills',
        systemDesign: level !== 'entry' ? 'Ability to design scalable systems' : 'Understanding of basic system concepts',
        codingAbility: 'Problem-solving approach and code quality'
      };
    }

    if (level === 'senior' || level === 'executive') {
      return {
        ...baseCriteria,
        leadership: 'Ability to guide and influence others',
        strategicThinking: 'Long-term planning and vision',
        mentorship: 'Experience developing others'
      };
    }

    return baseCriteria;
  }

  private getInterviewTips(type: string) {
    const commonTips = [
      'Start with easier questions to help candidate feel comfortable',
      'Listen actively and ask follow-up questions based on responses',
      'Take notes on specific examples and outcomes',
      'Allow silence for candidate to think and elaborate'
    ];

    if (type === 'technical') {
      return [
        ...commonTips,
        'Focus on problem-solving process, not just final answers',
        'Ask candidates to explain their thinking out loud',
        'Provide hints if candidate gets stuck, note how they use guidance'
      ];
    }

    if (type === 'behavioral') {
      return [
        ...commonTips,
        'Use STAR method (Situation, Task, Action, Result) to structure responses',
        'Probe for specific examples rather than hypothetical answers',
        'Look for consistent patterns across different stories'
      ];
    }

    return commonTips;
  }
}

// Analyze Interview Feedback Tool
export class AnalyzeFeedbackTool extends BaseMCPTool {
  constructor() {
    super(
      'analyze_interview_feedback',
      'Analyze and synthesize interview feedback from multiple interviewers to support hiring decisions',
      z.object({
        candidateName: z.string().describe('Name of the candidate'),
        jobRole: z.string().describe('Job role the candidate interviewed for'),
        feedback: z.array(z.object({
          interviewer: z.string(),
          role: z.string().optional(),
          interviewType: z.string().optional(),
          rating: z.number().min(1).max(5),
          strengths: z.array(z.string()).optional(),
          concerns: z.array(z.string()).optional(),
          notes: z.string().optional(),
          recommendation: z.enum(['strong_hire', 'hire', 'no_hire', 'strong_no_hire'])
        })).describe('Array of feedback from different interviewers')
      })
    );
  }

  protected async handler(input: any, session?: MCPSession) {
    const { candidateName, jobRole, feedback } = input;

    const analysis = this.analyzeFeedback(feedback);
    const recommendation = this.generateRecommendation(analysis, feedback);
    const nextSteps = this.determineNextSteps(recommendation, analysis);

    const feedbackAnalysis = {
      candidate: {
        name: candidateName,
        role: jobRole,
        interviewDate: new Date().toISOString().split('T')[0]
      },
      summary: {
        totalInterviews: feedback.length,
        averageRating: this.calculateAverageRating(feedback),
        consensusLevel: this.calculateConsensus(feedback),
        recommendationDistribution: this.getRecommendationDistribution(feedback)
      },
      analysis,
      overallRecommendation: recommendation,
      nextSteps,
      interviewerFeedback: feedback.map((f: any) => ({
        interviewer: f.interviewer,
        role: f.role || 'Not specified',
        interviewType: f.interviewType || 'General',
        rating: f.rating,
        recommendation: f.recommendation,
        keyPoints: {
          strengths: f.strengths || [],
          concerns: f.concerns || []
        },
        notes: f.notes || 'No additional notes'
      }))
    };

    return feedbackAnalysis;
  }

  private analyzeFeedback(feedback: any[]) {
    const allStrengths = feedback.flatMap(f => f.strengths || []);
    const allConcerns = feedback.flatMap(f => f.concerns || []);

    return {
      strengthsConsensus: this.findCommonThemes(allStrengths),
      concernsConsensus: this.findCommonThemes(allConcerns),
      ratingDistribution: this.getRatingDistribution(feedback),
      interviewerAlignment: this.assessInterviewerAlignment(feedback),
      keyInsights: this.extractKeyInsights(feedback)
    };
  }

  private findCommonThemes(items: string[]) {
    const themes: { [key: string]: number } = {};
    const commonThemes: any[] = [];

    // Simple keyword matching for common themes
    items.forEach(item => {
      const words = item.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 3) { // Only consider words longer than 3 characters
          themes[word] = (themes[word] || 0) + 1;
        }
      });
    });

    // Find themes mentioned by multiple interviewers
    Object.entries(themes).forEach(([theme, count]) => {
      if (count > 1) {
        const relatedItems = items.filter(item =>
          item.toLowerCase().includes(theme)
        );
        commonThemes.push({
          theme,
          frequency: count,
          examples: relatedItems.slice(0, 3) // First 3 examples
        });
      }
    });

    return commonThemes.sort((a, b) => b.frequency - a.frequency);
  }

  private getRatingDistribution(feedback: any[]) {
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach(f => {
      distribution[f.rating] = (distribution[f.rating] || 0) + 1;
    });
    return distribution;
  }

  private assessInterviewerAlignment(feedback: any[]) {
    const ratings = feedback.map(f => f.rating);
    const recommendations = feedback.map(f => f.recommendation);

    const ratingVariance = this.calculateVariance(ratings);
    const recommendationConsensus = this.calculateRecommendationConsensus(recommendations);

    return {
      ratingVariance,
      alignment: ratingVariance < 1 ? 'high' : ratingVariance < 2 ? 'medium' : 'low',
      recommendationConsensus,
      conflictingViews: this.identifyConflictingViews(feedback)
    };
  }

  private calculateVariance(numbers: number[]) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private calculateRecommendationConsensus(recommendations: string[]) {
    const counts: Record<string, number> = {};
    recommendations.forEach(rec => {
      counts[rec] = (counts[rec] || 0) + 1;
    });

    const values = Object.values(counts);
    const maxCount = values.length > 0 ? Math.max(...values) : 0;
    return maxCount / recommendations.length;
  }

  private identifyConflictingViews(feedback: any[]) {
    const conflicts = [];

    // Check for rating conflicts (difference > 2)
    const ratings = feedback.map(f => ({ interviewer: f.interviewer, rating: f.rating }));
    for (let i = 0; i < ratings.length; i++) {
      for (let j = i + 1; j < ratings.length; j++) {
        if (Math.abs(ratings[i].rating - ratings[j].rating) > 2) {
          conflicts.push({
            type: 'rating_conflict',
            interviewers: [ratings[i].interviewer, ratings[j].interviewer],
            ratings: [ratings[i].rating, ratings[j].rating]
          });
        }
      }
    }

    // Check for recommendation conflicts
    const hireRecommendations = feedback.filter(f =>
      f.recommendation === 'hire' || f.recommendation === 'strong_hire'
    );
    const noHireRecommendations = feedback.filter(f =>
      f.recommendation === 'no_hire' || f.recommendation === 'strong_no_hire'
    );

    if (hireRecommendations.length > 0 && noHireRecommendations.length > 0) {
      conflicts.push({
        type: 'recommendation_conflict',
        hireVotes: hireRecommendations.length,
        noHireVotes: noHireRecommendations.length
      });
    }

    return conflicts;
  }

  private extractKeyInsights(feedback: any[]) {
    const insights = [];

    // Check for unanimous strong hire
    if (feedback.every(f => f.recommendation === 'strong_hire')) {
      insights.push('Unanimous strong hire recommendation - exceptional candidate');
    }

    // Check for concerns about specific areas
    const technicalConcerns = feedback.filter(f =>
      (f.concerns || []).some((c: string) => c.toLowerCase().includes('technical'))
    );
    if (technicalConcerns.length > feedback.length / 2) {
      insights.push('Multiple interviewers expressed technical concerns');
    }

    // Check for cultural fit issues  
    const culturalConcerns = feedback.filter(f =>
      (f.concerns || []).some((c: string) =>
        c.toLowerCase().includes('culture') ||
        c.toLowerCase().includes('fit') ||
        c.toLowerCase().includes('communication')
      )
    );
    if (culturalConcerns.length > 1) {
      insights.push('Cultural fit or communication concerns raised by multiple interviewers');
    }

    return insights;
  }

  private calculateAverageRating(feedback: any[]) {
    const total = feedback.reduce((sum, f) => sum + f.rating, 0);
    return Math.round((total / feedback.length) * 10) / 10; // Round to 1 decimal
  }

  private calculateConsensus(feedback: any[]) {
    if (!feedback.length) {
      return { percentage: 0, level: 'low' };
    }

    const counts: Record<string, number> = {};
    feedback.forEach(f => {
      const rec = f.recommendation as string;
      if (rec) {
        counts[rec] = (counts[rec] || 0) + 1;
      }
    });

    const values = Object.values(counts);
    const maxCount = values.length > 0 ? Math.max(...values) : 0;
    const consensusPercentage = Math.round((maxCount / feedback.length) * 100);

    return {
      percentage: consensusPercentage,
      level: consensusPercentage >= 80 ? 'high' : consensusPercentage >= 60 ? 'medium' : 'low'
    };
  }

  private getRecommendationDistribution(feedback: any[]) {
    const distribution: Record<string, number> = {
      strong_hire: 0,
      hire: 0,
      no_hire: 0,
      strong_no_hire: 0
    };

    feedback.forEach(f => {
      const rec = f.recommendation as string;
      if (rec && rec in distribution) {
        distribution[rec] = (distribution[rec] || 0) + 1;
      }
    });

    return distribution;
  }

  private generateRecommendation(analysis: any, feedback: any[]) {
    const avgRating = this.calculateAverageRating(feedback);
    const hireVotes = feedback.filter(f =>
      f.recommendation === 'hire' || f.recommendation === 'strong_hire'
    ).length;
    const totalVotes = feedback.length;
    const hirePercentage = hireVotes / totalVotes;

    let recommendation = 'no_hire';
    let confidence = 'medium';
    let reasoning = [];

    if (avgRating >= 4.5 && hirePercentage >= 0.8) {
      recommendation = 'strong_hire';
      confidence = 'high';
      reasoning.push('Consistently high ratings across all interviews');
      reasoning.push('Strong consensus for hiring');
    } else if (avgRating >= 3.5 && hirePercentage >= 0.6) {
      recommendation = 'hire';
      confidence = hirePercentage >= 0.8 ? 'high' : 'medium';
      reasoning.push('Generally positive feedback with acceptable consensus');
    } else if (avgRating >= 2.5 && hirePercentage >= 0.4) {
      recommendation = 'no_hire';
      confidence = 'low';
      reasoning.push('Mixed feedback requires careful consideration');
      reasoning.push('May benefit from additional interview or reference checks');
    } else {
      recommendation = 'strong_no_hire';
      confidence = 'high';
      reasoning.push('Consistently low ratings or strong negative consensus');
    }

    // Adjust based on conflicts
    if (analysis.interviewerAlignment.alignment === 'low') {
      confidence = 'low';
      reasoning.push('Significant disagreement between interviewers requires discussion');
    }

    return {
      decision: recommendation,
      confidence,
      reasoning,
      averageRating: avgRating,
      consensusLevel: hirePercentage
    };
  }

  private determineNextSteps(recommendation: any, analysis: any) {
    const steps = [];

    if (recommendation.decision === 'strong_hire') {
      steps.push('Extend offer immediately');
      steps.push('Prepare competitive compensation package');
      steps.push('Assign hiring manager to close candidate');
    } else if (recommendation.decision === 'hire') {
      steps.push('Conduct hiring team discussion to confirm decision');
      steps.push('Check references if not already done');
      steps.push('Prepare offer package');
    } else if (recommendation.decision === 'no_hire') {
      if (recommendation.confidence === 'low') {
        steps.push('Conduct hiring team discussion to review conflicting feedback');
        steps.push('Consider additional interview with senior team member');
        steps.push('Review role requirements and candidate fit');
      } else {
        steps.push('Send polite rejection to candidate');
        steps.push('Document key reasons for decision');
      }
    } else { // strong_no_hire
      steps.push('Send rejection to candidate');
      steps.push('Document feedback for future reference');
      steps.push('Continue search for other candidates');
    }

    // Add steps based on specific concerns
    if (analysis.concernsConsensus.length > 0) {
      steps.push('Address specific concerns identified in team discussion');
    }

    return steps;
  }
}

// Export all interview tools
export const interviewTools = [
  new GenerateInterviewQuestionsTool(),
  new AnalyzeFeedbackTool()
];