import { z } from 'zod';
import { BaseMCPTool } from '../utils/base-tool.js';
import { MCPSession, MCPError } from '../types/mcp.js';

// Recruitment Plan Tool
export class CreateRecruitmentPlanTool extends BaseMCPTool {
  constructor() {
    super(
      'create_recruitment_plan',
      'Generate a comprehensive recruitment plan for hiring specific roles within a timeline',
      z.object({
        roles: z.array(z.string()).describe('Job roles to hire for'),
        timeline: z.string().describe('Timeline for completion (e.g., "8 weeks", "3 months")'),
        budget: z.number().optional().describe('Budget for recruitment activities'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium').describe('Priority level for the recruitment'),
        requirements: z.object({
          experienceLevel: z.string().optional(),
          location: z.string().optional(),
          skills: z.array(z.string()).optional(),
          department: z.string().optional()
        }).optional().describe('Specific requirements for the roles')
      })
    );
  }

  protected async handler(input: any, session?: MCPSession) {
    const { roles, timeline, budget, priority = 'medium', requirements = {} } = input;

    // Generate timeline milestones
    const milestones = this.generateTimeline(timeline, roles.length);
    
    // Create sourcing strategy based on requirements
    const sourcingStrategy = this.createSourcingStrategy(requirements, roles);
    
    // Generate budget breakdown
    const budgetBreakdown = this.createBudgetBreakdown(budget, roles.length);
    
    // Create success metrics
    const metrics = this.defineSuccessMetrics(roles, timeline);

    const recruitmentPlan = {
      overview: {
        roles: roles,
        timeline: timeline,
        priority: priority,
        totalPositions: roles.length,
        estimatedDuration: this.parseTimelineWeeks(timeline),
        status: 'draft'
      },
      phases: [
        {
          name: 'Planning & Preparation',
          duration: '1 week',
          tasks: [
            'Finalize job descriptions and requirements',
            'Set up recruitment tracking systems',
            'Brief hiring managers and interview panels',
            'Prepare assessment materials and interview guides'
          ]
        },
        {
          name: 'Active Sourcing',
          duration: `${Math.ceil(this.parseTimelineWeeks(timeline) * 0.6)} weeks`,
          tasks: [
            'Execute multi-channel sourcing strategy',
            'Screen and qualify initial candidates',
            'Build candidate pipeline for each role',
            'Maintain candidate relationship management'
          ]
        },
        {
          name: 'Interview & Assessment',
          duration: `${Math.ceil(this.parseTimelineWeeks(timeline) * 0.25)} weeks`,
          tasks: [
            'Conduct initial phone/video screenings',
            'Coordinate technical assessments',
            'Facilitate final interviews with hiring managers',
            'Collect and consolidate feedback'
          ]
        },
        {
          name: 'Selection & Onboarding',
          duration: `${Math.ceil(this.parseTimelineWeeks(timeline) * 0.15)} weeks`,
          tasks: [
            'Make hiring decisions and extend offers',
            'Negotiate terms and finalize contracts',
            'Coordinate background checks and documentation',
            'Plan onboarding schedule and logistics'
          ]
        }
      ],
      sourcingStrategy: sourcingStrategy,
      milestones: milestones,
      budgetBreakdown: budgetBreakdown,
      successMetrics: metrics,
      riskMitigation: {
        candidateShortage: 'Expand sourcing channels, consider remote candidates, adjust requirements if needed',
        timelineDelay: 'Prioritize critical roles, increase recruiting bandwidth, streamline interview process',
        budgetOverrun: 'Focus on cost-effective sourcing channels, negotiate agency fees, optimize internal resources'
      },
      nextSteps: [
        'Review and approve recruitment plan',
        'Set up tracking and reporting systems',
        'Begin job posting and candidate sourcing',
        'Schedule regular progress reviews'
      ]
    };

    return recruitmentPlan;
  }

  private generateTimeline(timeline: string, roleCount: number) {
    const weeks = this.parseTimelineWeeks(timeline);
    const milestones = [];
    
    milestones.push({
      week: 1,
      milestone: 'Recruitment plan approved and sourcing begins',
      deliverables: ['Job postings live', 'Sourcing channels activated']
    });
    
    if (weeks >= 4) {
      milestones.push({
        week: Math.ceil(weeks * 0.3),
        milestone: 'Initial candidate pipeline established',
        deliverables: [`${Math.ceil(roleCount * 3)} qualified candidates identified`]
      });
    }
    
    if (weeks >= 6) {
      milestones.push({
        week: Math.ceil(weeks * 0.6),
        milestone: 'Interview process in full swing',
        deliverables: ['First round interviews completed', 'Top candidates identified']
      });
    }
    
    milestones.push({
      week: Math.ceil(weeks * 0.85),
      milestone: 'Offers extended to selected candidates',
      deliverables: ['Final interviews completed', 'Hiring decisions made']
    });
    
    milestones.push({
      week: weeks,
      milestone: 'All positions filled and onboarding initiated',
      deliverables: ['Contracts signed', 'Onboarding plans activated']
    });
    
    return milestones;
  }

  private createSourcingStrategy(requirements: any, roles: string[]) {
    return {
      channels: [
        {
          name: 'LinkedIn Recruiting',
          allocation: '40%',
          expectedCandidates: Math.ceil(roles.length * 8),
          costPerHire: 150
        },
        {
          name: 'Job Boards (Indeed, Glassdoor)',
          allocation: '25%',
          expectedCandidates: Math.ceil(roles.length * 5),
          costPerHire: 100
        },
        {
          name: 'Employee Referrals',
          allocation: '20%',
          expectedCandidates: Math.ceil(roles.length * 3),
          costPerHire: 2000
        },
        {
          name: 'Technical Communities & GitHub',
          allocation: '10%',
          expectedCandidates: Math.ceil(roles.length * 2),
          costPerHire: 50
        },
        {
          name: 'Recruitment Agencies',
          allocation: '5%',
          expectedCandidates: Math.ceil(roles.length * 1),
          costPerHire: 8000
        }
      ],
      targetSources: this.identifyTargetSources(requirements, roles),
      messagingStrategy: {
        personalizedOutreach: 'Craft role-specific messages highlighting company culture and growth opportunities',
        responseRate: '15-20%',
        followUpSequence: '3 touchpoints over 2 weeks'
      }
    };
  }

  private identifyTargetSources(requirements: any, roles: string[]) {
    const sources = [];
    
    if (roles.some(role => role.toLowerCase().includes('developer') || role.toLowerCase().includes('engineer'))) {
      sources.push('GitHub', 'Stack Overflow', 'AngelList', 'HackerNews');
    }
    
    if (roles.some(role => role.toLowerCase().includes('designer'))) {
      sources.push('Dribbble', 'Behance', 'Design Jobs Board');
    }
    
    if (roles.some(role => role.toLowerCase().includes('sales') || role.toLowerCase().includes('marketing'))) {
      sources.push('SalesJobs.com', 'Marketing Hire', 'Sales Hacker');
    }
    
    sources.push('LinkedIn', 'Indeed', 'Glassdoor'); // Always include these
    
    return sources;
  }

  private createBudgetBreakdown(budget: number, roleCount: number) {
    if (!budget) {
      return {
        note: 'Budget not specified - contact finance for allocation',
        estimatedRange: `$${roleCount * 3000} - $${roleCount * 8000}`
      };
    }
    
    return {
      total: budget,
      breakdown: {
        jobBoards: Math.ceil(budget * 0.2),
        linkedInRecruiter: Math.ceil(budget * 0.3),
        referralBonuses: Math.ceil(budget * 0.25),
        agencyFees: Math.ceil(budget * 0.15),
        miscellaneous: Math.ceil(budget * 0.1)
      },
      costPerHire: Math.ceil(budget / roleCount)
    };
  }

  private defineSuccessMetrics(roles: string[], timeline: string) {
    return {
      primary: {
        positionsFilled: `${roles.length}/${roles.length}`,
        timeToFill: `Within ${timeline}`,
        qualityOfHire: 'Performance reviews after 6 months'
      },
      secondary: {
        candidateExperience: 'Survey scores > 4.0/5.0',
        diversityTargets: 'Meet or exceed company diversity goals',
        costEfficiency: 'Stay within budget parameters'
      },
      kpis: {
        applicationConversion: '10-15%',
        interviewToOffer: '30-40%',
        offerAcceptance: '80-90%',
        retention90Days: '95%+'
      }
    };
  }

  private parseTimelineWeeks(timeline: string): number {
    const timelineStr = timeline.toLowerCase();
    
    if (timelineStr.includes('week')) {
      const match = timelineStr.match(/(\d+)\s*week/);
      return match ? parseInt(match[1]) : 8;
    }
    
    if (timelineStr.includes('month')) {
      const match = timelineStr.match(/(\d+)\s*month/);
      return match ? parseInt(match[1]) * 4 : 8;
    }
    
    return 8; // Default to 8 weeks
  }
}

// Workflow Execution Tool
export class ExecuteWorkflowTool extends BaseMCPTool {
  constructor() {
    super(
      'execute_workflow',
      'Execute predefined recruitment workflows with automated task orchestration',
      z.object({
        workflowType: z.enum(['candidate_screening', 'interview_scheduling', 'offer_management', 'onboarding_prep']).describe('Type of workflow to execute'),
        parameters: z.record(z.any()).optional().describe('Workflow-specific parameters'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium').describe('Execution priority')
      })
    );
  }

  protected async handler(input: any, session?: MCPSession) {
    const { workflowType, parameters = {}, priority = 'medium' } = input;

    const workflowId = this.generateWorkflowId();
    const workflow = this.initializeWorkflow(workflowType, parameters, priority, workflowId);

    // Store workflow in session context
    if (session?.context) {
      if (!session.context.workflows) {
        session.context.workflows = {};
      }
      session.context.workflows[workflowId] = workflow;
    }

    return {
      workflowId: workflowId,
      status: 'initiated',
      workflow: workflow,
      message: `Workflow '${workflowType}' has been initiated with ID ${workflowId}`
    };
  }

  private generateWorkflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeWorkflow(type: string, params: any, priority: string, id: string) {
    const baseWorkflow = {
      id,
      type,
      priority,
      status: 'running',
      createdAt: new Date().toISOString(),
      parameters: params,
      progress: 0
    };

    switch (type) {
      case 'candidate_screening':
        return {
          ...baseWorkflow,
          name: 'Candidate Screening Workflow',
          description: 'Automated candidate evaluation and qualification process',
          steps: [
            { id: 1, name: 'Parse candidate profile', status: 'completed', duration: '30s' },
            { id: 2, name: 'Skills assessment', status: 'running', duration: '2m' },
            { id: 3, name: 'Experience validation', status: 'pending', duration: '1m' },
            { id: 4, name: 'Cultural fit analysis', status: 'pending', duration: '45s' },
            { id: 5, name: 'Generate screening report', status: 'pending', duration: '15s' }
          ],
          expectedCompletion: new Date(Date.now() + 4 * 60 * 1000).toISOString()
        };

      case 'interview_scheduling':
        return {
          ...baseWorkflow,
          name: 'Interview Scheduling Workflow',
          description: 'Coordinate interview schedules across multiple stakeholders',
          steps: [
            { id: 1, name: 'Check interviewer availability', status: 'completed', duration: '1m' },
            { id: 2, name: 'Send calendar invites', status: 'running', duration: '30s' },
            { id: 3, name: 'Prepare interview materials', status: 'pending', duration: '2m' },
            { id: 4, name: 'Send candidate confirmation', status: 'pending', duration: '15s' },
            { id: 5, name: 'Set up meeting room/video link', status: 'pending', duration: '30s' }
          ],
          expectedCompletion: new Date(Date.now() + 4 * 60 * 1000).toISOString()
        };

      case 'offer_management':
        return {
          ...baseWorkflow,
          name: 'Offer Management Workflow',
          description: 'Generate, negotiate, and finalize job offers',
          steps: [
            { id: 1, name: 'Calculate compensation package', status: 'completed', duration: '2m' },
            { id: 2, name: 'Generate offer letter', status: 'running', duration: '1m' },
            { id: 3, name: 'Legal review and approval', status: 'pending', duration: '30m' },
            { id: 4, name: 'Send offer to candidate', status: 'pending', duration: '5m' },
            { id: 5, name: 'Track response and negotiate', status: 'pending', duration: 'variable' }
          ],
          expectedCompletion: new Date(Date.now() + 45 * 60 * 1000).toISOString()
        };

      case 'onboarding_prep':
        return {
          ...baseWorkflow,
          name: 'Onboarding Preparation Workflow',
          description: 'Prepare systems and materials for new hire onboarding',
          steps: [
            { id: 1, name: 'Create user accounts and access', status: 'running', duration: '5m' },
            { id: 2, name: 'Prepare equipment and workspace', status: 'pending', duration: '2h' },
            { id: 3, name: 'Schedule orientation sessions', status: 'pending', duration: '15m' },
            { id: 4, name: 'Generate onboarding checklist', status: 'pending', duration: '10m' },
            { id: 5, name: 'Notify team and stakeholders', status: 'pending', duration: '5m' }
          ],
          expectedCompletion: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
        };

      default:
        throw new MCPError(`Unknown workflow type: ${type}`, 'INVALID_WORKFLOW_TYPE');
    }
  }
}

// System Status Tool
export class GetSystemStatusTool extends BaseMCPTool {
  constructor() {
    super(
      'get_system_status',
      'Get current status of recruitment system components and active workflows',
      z.object({
        includeWorkflows: z.boolean().default(true).describe('Include active workflow status'),
        includeMetrics: z.boolean().default(true).describe('Include system performance metrics')
      })
    );
  }

  protected async handler(input: any, session?: MCPSession) {
    const { includeWorkflows = true, includeMetrics = true } = input;

    const systemStatus: any = {
      timestamp: new Date().toISOString(),
      overall: 'operational',
      components: {
        candidateSourcing: {
          status: 'operational',
          lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          health: 'good'
        },
        documentProcessing: {
          status: 'operational',
          lastUpdate: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          health: 'excellent'
        },
        interviewTools: {
          status: 'operational',
          lastUpdate: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          health: 'good'
        },
        orchestration: {
          status: 'operational',
          lastUpdate: new Date().toISOString(),
          health: 'excellent'
        }
      }
    };

    if (includeWorkflows && session?.context?.workflows) {
      systemStatus.activeWorkflows = {
        total: Object.keys(session.context.workflows).length,
        running: Object.values(session.context.workflows).filter((w: any) => w.status === 'running').length,
        completed: Object.values(session.context.workflows).filter((w: any) => w.status === 'completed').length,
        failed: Object.values(session.context.workflows).filter((w: any) => w.status === 'failed').length,
        workflows: Object.values(session.context.workflows).map((w: any) => ({
          id: w.id,
          type: w.type,
          status: w.status,
          progress: w.progress,
          createdAt: w.createdAt
        }))
      };
    }

    if (includeMetrics) {
      systemStatus.metrics = {
        uptime: '99.8%',
        averageResponseTime: '245ms',
        requestsProcessed: 1247,
        errorRate: '0.2%',
        lastMaintenanceWindow: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextMaintenanceWindow: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    return systemStatus;
  }
}

// Export all orchestration tools
export const orchestrationTools = [
  new CreateRecruitmentPlanTool(),
  new ExecuteWorkflowTool(),
  new GetSystemStatusTool()
];