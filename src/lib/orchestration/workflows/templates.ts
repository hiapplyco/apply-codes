import { WorkflowDefinition } from '@/types/orchestration';

export const WORKFLOW_TEMPLATES: Record<string, WorkflowDefinition> = {
  // Full recruitment workflow from planning to enrichment
  FULL_RECRUITMENT: {
    id: 'full-recruitment',
    name: 'Full Recruitment Pipeline',
    description: 'Complete recruitment workflow from job planning to candidate enrichment',
    version: '1.0.0',
    steps: [
      {
        id: 'plan',
        name: 'Create Recruitment Plan',
        agentType: 'planning',
        task: {
          type: 'recruitment_plan',
          priority: 'high',
          input: {
            objective: 'Create comprehensive recruitment strategy',
            includeTimeline: true,
            includeStrategies: true
          }
        },
        dependencies: [],
        onSuccess: ['source'],
        parallel: false
      },
      {
        id: 'source',
        name: 'Source Candidates',
        agentType: 'sourcing',
        task: {
          type: 'candidate_search',
          priority: 'high',
          input: {
            searchPlatforms: ['linkedin', 'google_jobs', 'github'],
            maxResults: 100
          }
        },
        dependencies: ['plan'],
        onSuccess: ['enrich'],
        parallel: false
      },
      {
        id: 'enrich',
        name: 'Enrich Candidate Data',
        agentType: 'enrichment',
        task: {
          type: 'enrichment',
          priority: 'medium',
          input: {
            enrichmentTypes: ['contact', 'social', 'experience', 'skills'],
            includeVerification: true
          }
        },
        dependencies: ['source'],
        parallel: true
      }
    ],
    outputMapping: {
      plan: 'recruitmentPlan',
      candidates: 'enrichedCandidates',
      timeline: 'executionTimeline'
    }
  },

  // Quick sourcing workflow
  QUICK_SOURCE: {
    id: 'quick-source',
    name: 'Quick Candidate Sourcing',
    description: 'Fast candidate discovery and basic enrichment',
    version: '1.0.0',
    steps: [
      {
        id: 'search',
        name: 'Search Candidates',
        agentType: 'sourcing',
        task: {
          type: 'candidate_search',
          priority: 'high',
          input: {
            searchPlatforms: ['linkedin', 'google_jobs'],
            maxResults: 50
          }
        },
        dependencies: [],
        onSuccess: ['basic-enrich'],
        parallel: false
      },
      {
        id: 'basic-enrich',
        name: 'Basic Contact Enrichment',
        agentType: 'enrichment',
        task: {
          type: 'enrichment',
          priority: 'medium',
          input: {
            enrichmentTypes: ['contact'],
            includeVerification: false
          }
        },
        dependencies: ['search'],
        parallel: true
      }
    ]
  },

  // Deep candidate research
  DEEP_RESEARCH: {
    id: 'deep-research',
    name: 'Deep Candidate Research',
    description: 'Comprehensive candidate research and profiling',
    version: '1.0.0',
    steps: [
      {
        id: 'initial-search',
        name: 'Initial Candidate Search',
        agentType: 'sourcing',
        task: {
          type: 'candidate_search',
          priority: 'high',
          input: {
            searchPlatforms: ['linkedin'],
            maxResults: 20
          }
        },
        dependencies: [],
        onSuccess: ['full-enrich', 'social-search'],
        parallel: false
      },
      {
        id: 'full-enrich',
        name: 'Full Profile Enrichment',
        agentType: 'enrichment',
        task: {
          type: 'enrichment',
          priority: 'high',
          input: {
            enrichmentTypes: ['contact', 'experience', 'skills', 'social'],
            includeVerification: true
          }
        },
        dependencies: ['initial-search'],
        parallel: true
      },
      {
        id: 'social-search',
        name: 'Extended Social Search',
        agentType: 'sourcing',
        task: {
          type: 'candidate_search',
          priority: 'medium',
          input: {
            searchPlatforms: ['github'],
            maxResults: 20,
            deepSearch: true
          }
        },
        dependencies: ['initial-search'],
        parallel: true
      }
    ]
  },

  // Strategic planning workflow
  STRATEGIC_PLANNING: {
    id: 'strategic-planning',
    name: 'Strategic Recruitment Planning',
    description: 'Create detailed recruitment strategy and execution plan',
    version: '1.0.0',
    steps: [
      {
        id: 'market-analysis',
        name: 'Market Analysis',
        agentType: 'planning',
        task: {
          type: 'planning',
          priority: 'high',
          input: {
            analysisType: 'market',
            includeCompetitors: true,
            includeSalaryData: true
          }
        },
        dependencies: [],
        onSuccess: ['strategy-plan'],
        parallel: false
      },
      {
        id: 'strategy-plan',
        name: 'Create Strategy',
        agentType: 'planning',
        task: {
          type: 'recruitment_plan',
          priority: 'high',
          input: {
            objective: 'Develop comprehensive recruitment strategy',
            includeTimeline: true,
            includeResources: true,
            includeRisks: true
          }
        },
        dependencies: ['market-analysis'],
        onSuccess: ['test-source'],
        parallel: false
      },
      {
        id: 'test-source',
        name: 'Test Sourcing Strategy',
        agentType: 'sourcing',
        task: {
          type: 'candidate_search',
          priority: 'medium',
          input: {
            searchPlatforms: ['linkedin'],
            maxResults: 10,
            testMode: true
          }
        },
        dependencies: ['strategy-plan'],
        parallel: false
      }
    ]
  },

  // Bulk enrichment workflow
  BULK_ENRICHMENT: {
    id: 'bulk-enrichment',
    name: 'Bulk Candidate Enrichment',
    description: 'Enrich large batches of existing candidates',
    version: '1.0.0',
    steps: [
      {
        id: 'batch-enrich',
        name: 'Batch Enrichment',
        agentType: 'enrichment',
        task: {
          type: 'enrichment',
          priority: 'medium',
          input: {
            enrichmentTypes: ['contact', 'social'],
            includeVerification: true,
            batchSize: 50
          }
        },
        dependencies: [],
        parallel: true
      }
    ]
  }
};

// Workflow factory functions
export function createCustomWorkflow(params: {
  name: string;
  description: string;
  sourcingPlatforms?: string[];
  enrichmentTypes?: string[];
  includeStrategicPlanning?: boolean;
  maxCandidates?: number;
}): WorkflowDefinition {
  const steps: any[] = [];

  // Add planning step if requested
  if (params.includeStrategicPlanning) {
    steps.push({
      id: 'planning',
      name: 'Strategic Planning',
      agentType: 'planning',
      task: {
        type: 'recruitment_plan',
        priority: 'high',
        input: {
          objective: params.description
        }
      },
      dependencies: [],
      onSuccess: ['sourcing']
    });
  }

  // Add sourcing step
  steps.push({
    id: 'sourcing',
    name: 'Candidate Sourcing',
    agentType: 'sourcing',
    task: {
      type: 'candidate_search',
      priority: 'high',
      input: {
        searchPlatforms: params.sourcingPlatforms || ['linkedin'],
        maxResults: params.maxCandidates || 50
      }
    },
    dependencies: params.includeStrategicPlanning ? ['planning'] : [],
    onSuccess: ['enrichment']
  });

  // Add enrichment step
  if (params.enrichmentTypes && params.enrichmentTypes.length > 0) {
    steps.push({
      id: 'enrichment',
      name: 'Candidate Enrichment',
      agentType: 'enrichment',
      task: {
        type: 'enrichment',
        priority: 'medium',
        input: {
          enrichmentTypes: params.enrichmentTypes,
          includeVerification: true
        }
      },
      dependencies: ['sourcing'],
      parallel: true
    });
  }

  return {
    id: `custom-${Date.now()}`,
    name: params.name,
    description: params.description,
    version: '1.0.0',
    steps
  };
}

// Workflow validation
export function validateWorkflow(workflow: WorkflowDefinition): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!workflow.id) errors.push('Workflow ID is required');
  if (!workflow.name) errors.push('Workflow name is required');
  if (!workflow.steps || workflow.steps.length === 0) {
    errors.push('Workflow must have at least one step');
  }

  // Validate steps
  const stepIds = new Set<string>();
  workflow.steps.forEach((step, index) => {
    if (!step.id) {
      errors.push(`Step ${index} is missing an ID`);
    } else if (stepIds.has(step.id)) {
      errors.push(`Duplicate step ID: ${step.id}`);
    } else {
      stepIds.add(step.id);
    }

    if (!step.agentType) {
      errors.push(`Step ${step.id || index} is missing agent type`);
    }

    if (!step.task) {
      errors.push(`Step ${step.id || index} is missing task definition`);
    }

    // Validate dependencies
    if (step.dependencies) {
      step.dependencies.forEach(depId => {
        if (!stepIds.has(depId)) {
          errors.push(`Step ${step.id} has invalid dependency: ${depId}`);
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}