import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentCapability, AgentMessage } from '@/types/orchestration';
import { firestoreClient } from '@/lib/firebase-database-bridge';

interface PlanningTaskInput {
  objective: string;
  requirements?: {
    roleTitle: string;
    skills: string[];
    experienceLevel: string;
    location?: string;
    salary?: string;
    startDate?: string;
  };
  constraints?: {
    timeline?: string;
    budget?: number;
    teamSize?: number;
    hiringManager?: string;
  };
  currentState?: {
    openPositions: number;
    activeCandidates: number;
    interviewsScheduled: number;
  };
}

interface RecruitmentPlan {
  id: string;
  objective: string;
  phases: RecruitmentPhase[];
  timeline: {
    startDate: Date;
    endDate: Date;
    milestones: Milestone[];
  };
  resources: {
    estimatedHours: number;
    recommendedTeamSize: number;
    toolsRequired: string[];
  };
  strategies: Strategy[];
  risks: Risk[];
  successMetrics: Metric[];
}

interface RecruitmentPhase {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  activities: Activity[];
  dependencies: string[];
  deliverables: string[];
}

interface Activity {
  name: string;
  description: string;
  assignee?: string;
  estimatedHours: number;
  tools: string[];
}

interface Milestone {
  name: string;
  date: Date;
  description: string;
  success_criteria: string[];
}

interface Strategy {
  type: 'sourcing' | 'screening' | 'interviewing' | 'closing';
  name: string;
  description: string;
  tactics: string[];
}

interface Risk {
  name: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

interface Metric {
  name: string;
  target: number;
  unit: string;
  trackingMethod: string;
}

export class PlanningAgent extends BaseAgent {
  protected initialize(): void {
    this.capabilities = [
      {
        name: 'recruitment_planning',
        description: 'Create comprehensive recruitment plans',
        inputSchema: {
          type: 'object',
          properties: {
            objective: { type: 'string' },
            requirements: { type: 'object' },
            constraints: { type: 'object' }
          },
          required: ['objective']
        }
      },
      {
        name: 'timeline_generation',
        description: 'Generate recruitment timelines with milestones',
        inputSchema: {
          type: 'object',
          properties: {
            targetHires: { type: 'number' },
            urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
            startDate: { type: 'string' }
          }
        }
      },
      {
        name: 'strategy_recommendation',
        description: 'Recommend sourcing and hiring strategies',
        inputSchema: {
          type: 'object',
          properties: {
            roleType: { type: 'string' },
            market: { type: 'string' },
            competitionLevel: { type: 'string' }
          }
        }
      },
      {
        name: 'resource_estimation',
        description: 'Estimate resources needed for recruitment',
        inputSchema: {
          type: 'object',
          properties: {
            positions: { type: 'number' },
            complexity: { type: 'string' },
            timeline: { type: 'string' }
          }
        }
      }
    ];

    this.metrics.capabilities = this.capabilities.map(c => c.name);
  }

  public canHandle(task: AgentTask): boolean {
    return task.type === 'planning' || 
           task.type === 'recruitment_plan' || 
           task.type === 'strategy_generation';
  }

  protected async executeTask(task: AgentTask): Promise<RecruitmentPlan> {
    const input = task.input as PlanningTaskInput;

    try {
      // Analyze requirements and constraints
      const analysis = await this.analyzeRecruitmentNeeds(input);

      // Generate phases
      const phases = await this.generateRecruitmentPhases(analysis);

      // Create timeline
      const timeline = await this.createTimeline(phases, input.constraints);

      // Develop strategies
      const strategies = await this.developStrategies(analysis);

      // Identify risks
      const risks = await this.identifyRisks(analysis, timeline);

      // Define success metrics
      const metrics = await this.defineSuccessMetrics(input.objective, analysis);

      // Estimate resources
      const resources = await this.estimateResources(phases, timeline);

      const plan: RecruitmentPlan = {
        id: `plan-${Date.now()}`,
        objective: input.objective,
        phases,
        timeline,
        resources,
        strategies,
        risks,
        successMetrics: metrics
      };

      // Save plan to database
      await this.savePlan(plan);

      return plan;
    } catch (error) {
      console.error('Planning task failed:', error);
      throw error;
    }
  }

  private async analyzeRecruitmentNeeds(input: PlanningTaskInput): Promise<any> {
    const prompt = `Analyze these recruitment requirements and provide insights:
    
    Objective: ${input.objective}
    Requirements: ${JSON.stringify(input.requirements, null, 2)}
    Constraints: ${JSON.stringify(input.constraints, null, 2)}
    Current State: ${JSON.stringify(input.currentState, null, 2)}
    
    Provide:
    1. Market analysis for this role
    2. Typical time-to-hire
    3. Competition level
    4. Recommended approach
    5. Key challenges`;

    const response = await this.callGeminiAPI(prompt);
    return response.analysis;
  }

  private async generateRecruitmentPhases(analysis: any): Promise<RecruitmentPhase[]> {
    const prompt = `Create recruitment phases for this hiring plan:
    ${JSON.stringify(analysis, null, 2)}
    
    Include phases for:
    1. Preparation and job posting
    2. Active sourcing
    3. Screening and assessment
    4. Interviewing
    5. Decision and offer
    6. Onboarding preparation
    
    For each phase, specify activities, duration, and deliverables.`;

    const response = await this.callGeminiAPI(prompt);
    
    return response.phases || this.getDefaultPhases();
  }

  private getDefaultPhases(): RecruitmentPhase[] {
    return [
      {
        id: 'prep',
        name: 'Preparation',
        description: 'Define role, create job description, set up process',
        duration: 3,
        activities: [
          {
            name: 'Create job description',
            description: 'Write comprehensive JD with requirements',
            estimatedHours: 4,
            tools: ['Docs', 'AI Writing Assistant']
          },
          {
            name: 'Set up ATS',
            description: 'Configure applicant tracking system',
            estimatedHours: 2,
            tools: ['ATS Platform']
          }
        ],
        dependencies: [],
        deliverables: ['Job Description', 'Interview Process', 'Evaluation Criteria']
      },
      {
        id: 'sourcing',
        name: 'Active Sourcing',
        description: 'Find and engage qualified candidates',
        duration: 14,
        activities: [
          {
            name: 'Boolean search creation',
            description: 'Develop search strings for platforms',
            estimatedHours: 2,
            tools: ['Boolean Generator']
          },
          {
            name: 'Candidate outreach',
            description: 'Send personalized messages to prospects',
            estimatedHours: 20,
            tools: ['Email Templates', 'LinkedIn']
          }
        ],
        dependencies: ['prep'],
        deliverables: ['Candidate Pipeline', 'Outreach Reports']
      },
      {
        id: 'screening',
        name: 'Screening',
        description: 'Initial assessment of candidates',
        duration: 7,
        activities: [
          {
            name: 'Resume review',
            description: 'Evaluate candidate qualifications',
            estimatedHours: 10,
            tools: ['Resume Parser', 'Scoring System']
          },
          {
            name: 'Phone screens',
            description: 'Conduct initial conversations',
            estimatedHours: 15,
            tools: ['Calendar Tool', 'Interview Guide']
          }
        ],
        dependencies: ['sourcing'],
        deliverables: ['Shortlist', 'Screening Notes']
      },
      {
        id: 'interviewing',
        name: 'Interviews',
        description: 'In-depth evaluation of candidates',
        duration: 10,
        activities: [
          {
            name: 'Technical interviews',
            description: 'Assess technical skills',
            estimatedHours: 20,
            tools: ['Video Platform', 'Assessment Tools']
          },
          {
            name: 'Culture fit interviews',
            description: 'Evaluate team compatibility',
            estimatedHours: 15,
            tools: ['Interview Scorecard']
          }
        ],
        dependencies: ['screening'],
        deliverables: ['Interview Feedback', 'Final Candidates']
      },
      {
        id: 'offer',
        name: 'Offer & Negotiation',
        description: 'Extend and negotiate offers',
        duration: 5,
        activities: [
          {
            name: 'Reference checks',
            description: 'Verify candidate background',
            estimatedHours: 5,
            tools: ['Reference Check Template']
          },
          {
            name: 'Offer creation',
            description: 'Prepare and send offer letter',
            estimatedHours: 3,
            tools: ['Offer Letter Template', 'Comp Tool']
          }
        ],
        dependencies: ['interviewing'],
        deliverables: ['Signed Offer', 'Start Date']
      }
    ];
  }

  private async createTimeline(
    phases: RecruitmentPhase[],
    constraints?: any
  ): Promise<any> {
    const startDate = constraints?.timeline 
      ? new Date(constraints.timeline) 
      : new Date();
    
    let currentDate = new Date(startDate);
    const milestones: Milestone[] = [];

    phases.forEach(phase => {
      milestones.push({
        name: `${phase.name} Complete`,
        date: new Date(currentDate.getTime() + phase.duration * 24 * 60 * 60 * 1000),
        description: `Complete all ${phase.name} activities`,
        success_criteria: phase.deliverables
      });
      
      currentDate = new Date(currentDate.getTime() + phase.duration * 24 * 60 * 60 * 1000);
    });

    const endDate = currentDate;

    return {
      startDate,
      endDate,
      milestones
    };
  }

  private async developStrategies(analysis: any): Promise<Strategy[]> {
    const prompt = `Develop recruitment strategies based on this analysis:
    ${JSON.stringify(analysis, null, 2)}
    
    Create strategies for:
    1. Sourcing (where and how to find candidates)
    2. Screening (how to efficiently evaluate)
    3. Interviewing (what process to use)
    4. Closing (how to secure top candidates)`;

    const response = await this.callGeminiAPI(prompt);
    
    return response.strategies || this.getDefaultStrategies();
  }

  private getDefaultStrategies(): Strategy[] {
    return [
      {
        type: 'sourcing',
        name: 'Multi-channel Sourcing',
        description: 'Use diverse channels to find candidates',
        tactics: [
          'LinkedIn advanced search',
          'GitHub for technical roles',
          'Industry-specific job boards',
          'Employee referrals',
          'University partnerships'
        ]
      },
      {
        type: 'screening',
        name: 'Structured Screening',
        description: 'Consistent evaluation process',
        tactics: [
          'Standardized phone screen questions',
          'Skills-based assessments',
          'Portfolio reviews',
          'Automated initial screening'
        ]
      },
      {
        type: 'interviewing',
        name: 'Competency-based Interviews',
        description: 'Focus on key competencies',
        tactics: [
          'Behavioral interview questions',
          'Technical assessments',
          'Panel interviews',
          'Case studies or presentations'
        ]
      },
      {
        type: 'closing',
        name: 'Candidate-centric Closing',
        description: 'Personalized approach to offers',
        tactics: [
          'Competitive compensation analysis',
          'Flexible negotiation',
          'Quick decision making',
          'Strong employer branding'
        ]
      }
    ];
  }

  private async identifyRisks(analysis: any, timeline: any): Promise<Risk[]> {
    const prompt = `Identify recruitment risks for this plan:
    Analysis: ${JSON.stringify(analysis, null, 2)}
    Timeline: ${JSON.stringify(timeline, null, 2)}
    
    Consider:
    1. Market competition
    2. Timeline constraints
    3. Skill availability
    4. Budget limitations
    5. Process bottlenecks`;

    const response = await this.callGeminiAPI(prompt);
    
    return response.risks || [
      {
        name: 'Talent Shortage',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Expand search geography, consider remote candidates'
      },
      {
        name: 'Extended Timeline',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Parallel processing of candidates, dedicated recruiter'
      },
      {
        name: 'Offer Rejection',
        probability: 'low',
        impact: 'high',
        mitigation: 'Build strong pipeline, competitive offers, sell throughout process'
      }
    ];
  }

  private async defineSuccessMetrics(objective: string, analysis: any): Promise<Metric[]> {
    const prompt = `Define success metrics for this recruitment objective:
    Objective: ${objective}
    Analysis: ${JSON.stringify(analysis, null, 2)}
    
    Include metrics for:
    1. Time efficiency
    2. Quality of hire
    3. Process effectiveness
    4. Candidate experience
    5. Cost efficiency`;

    const response = await this.callGeminiAPI(prompt);
    
    return response.metrics || [
      {
        name: 'Time to Fill',
        target: 30,
        unit: 'days',
        trackingMethod: 'ATS reporting'
      },
      {
        name: 'Quality of Hire',
        target: 4.5,
        unit: 'rating (1-5)',
        trackingMethod: '90-day manager assessment'
      },
      {
        name: 'Candidate Satisfaction',
        target: 4.0,
        unit: 'rating (1-5)',
        trackingMethod: 'Post-interview survey'
      },
      {
        name: 'Offer Acceptance Rate',
        target: 85,
        unit: 'percentage',
        trackingMethod: 'Offer tracking'
      },
      {
        name: 'Cost per Hire',
        target: 5000,
        unit: 'USD',
        trackingMethod: 'Finance reporting'
      }
    ];
  }

  private async estimateResources(phases: RecruitmentPhase[], timeline: any): Promise<any> {
    const totalHours = phases.reduce((sum, phase) => 
      sum + phase.activities.reduce((phaseSum, activity) => 
        phaseSum + activity.estimatedHours, 0
      ), 0
    );

    const tools = new Set<string>();
    phases.forEach(phase => 
      phase.activities.forEach(activity => 
        activity.tools.forEach(tool => tools.add(tool))
      )
    );

    const durationDays = Math.ceil(
      (timeline.endDate.getTime() - timeline.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const recommendedTeamSize = Math.ceil(totalHours / (durationDays * 6)); // 6 hours per day

    return {
      estimatedHours: totalHours,
      recommendedTeamSize,
      toolsRequired: Array.from(tools)
    };
  }

  private async savePlan(plan: RecruitmentPlan): Promise<void> {
    try {
      const result = await firestoreClient.from('recruitment_plans').insert({
        plan_id: plan.id,
        objective: plan.objective,
        plan_data: plan,
        agent_id: this.id,
        context: this.context,
        created_at: new Date().toISOString()
      });

      if (result?.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Failed to save recruitment plan:', error);
    }
  }

  protected async handleRequest(message: AgentMessage): Promise<void> {
    switch (message.action) {
      case 'adjust_timeline':
        await this.handleAdjustTimeline(message);
        break;
      case 'optimize_resources':
        await this.handleOptimizeResources(message);
        break;
      case 'update_strategy':
        await this.handleUpdateStrategy(message);
        break;
      default:
        await super.handleRequest(message);
    }
  }

  private async handleAdjustTimeline(message: AgentMessage): Promise<void> {
    const { planId, newConstraints } = message.payload;
    
    // Adjust timeline based on new constraints
    const adjustedPlan = await this.adjustPlanTimeline(planId, newConstraints);

    this.sendMessage(message.from, 'timeline_adjusted', {
      plan: adjustedPlan
    });
  }

  private async handleOptimizeResources(message: AgentMessage): Promise<void> {
    const { plan, optimizationGoal } = message.payload;
    
    // Optimize resource allocation
    const optimizedResources = await this.optimizeResourceAllocation(plan, optimizationGoal);

    this.sendMessage(message.from, 'resources_optimized', {
      resources: optimizedResources
    });
  }

  private async handleUpdateStrategy(message: AgentMessage): Promise<void> {
    const { planId, marketUpdate } = message.payload;
    
    // Update strategies based on market changes
    const updatedStrategies = await this.updateStrategiesForMarket(planId, marketUpdate);

    this.sendMessage(message.from, 'strategies_updated', {
      strategies: updatedStrategies
    });
  }

  private async adjustPlanTimeline(planId: string, newConstraints: any): Promise<any> {
    // Implementation for timeline adjustment
    return {};
  }

  private async optimizeResourceAllocation(plan: any, goal: string): Promise<any> {
    // Implementation for resource optimization
    return {};
  }

  private async updateStrategiesForMarket(planId: string, marketUpdate: any): Promise<any> {
    // Implementation for strategy updates
    return [];
  }
}
