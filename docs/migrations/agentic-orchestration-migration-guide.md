# Agentic Orchestration Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from the basic agent system to the enhanced multi-agent orchestration system in the Blind Nut platform.

## Migration Status

### ✅ Completed Phases
1. **Phase 1**: Type compatibility layer and test infrastructure
2. **Phase 2**: Core infrastructure (PromptManager, EnhancedToolRegistry)
3. **Phase 3**: Enhanced Agent base class with iterative execution
4. **Phase 4**: Core tool suite implementation
5. **Phase 5**: Enhanced Orchestrator with multi-agent workflows
6. **Phase 6**: Agent migration and new specialized agents

### 🚧 In Progress
7. **Phase 7**: Testing and validation

### 📋 Pending
8. **Phase 8**: Deployment with feature flags

## Quick Start

### 1. Using the New System (With Feature Flags Enabled)

```typescript
import { createRecruitmentOrchestrator } from '/supabase/functions/_shared/orchestration/index.ts';

// Create orchestrator with all agents pre-configured
const orchestrator = createRecruitmentOrchestrator({
  googleApiKey: Deno.env.get('GOOGLE_API_KEY')!,
  nymeriaApiKey: Deno.env.get('NYMERIA_API_KEY'),
  debug: true
});

// Run a single agent
const result = await orchestrator.runSingleAgent('BooleanSearchAgent', {
  requirements: 'Senior React Developer',
  complexity: 'medium',
  platform: 'LinkedIn'
});

// Run a workflow
const workflowResult = await orchestrator.runWorkflow(
  WorkflowTemplates.candidateSourcing,
  { requirements: 'Senior React Developer in San Francisco' }
);
```

### 2. Using Individual Agents

```typescript
import { BooleanSearchAgent, RecruitmentAgent } from '/supabase/functions/_shared/agents/RecruitmentAgent.ts';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(apiKey);

// Boolean search generation
const booleanAgent = new BooleanSearchAgent(genAI);
const searchString = await booleanAgent.generateBooleanSearch(
  'Senior React Developer with AWS',
  'complex'
);

// Recruitment tasks
const recruitmentAgent = new RecruitmentAgent(genAI);
const candidates = await recruitmentAgent.searchCandidates(requirements);
```

## Key Changes

### 1. Agent Architecture

**Old System:**
```typescript
abstract class Agent<T> {
  abstract run(params: T): Promise<string>;
}
```

**New System:**
```typescript
abstract class Agent<T> {
  // Iterative execution with tool support
  async run(params: T): Promise<string> {
    // Supports multiple iterations
    // Parses and executes tool calls
    // Maintains conversation context
  }
}
```

### 2. Tool System

**Old System:**
```typescript
interface Tool<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

**New System:**
```typescript
interface Tool {
  definition: ToolDefinition; // Includes name, description, parameters
  execute(params: any): Promise<any>;
}
```

### 3. Orchestration

**Old System:**
```typescript
// Simple single agent execution
orchestrator.run(agentName, params);
```

**New System:**
```typescript
// Multi-agent workflows with dependencies
orchestrator.runWorkflow(workflow, params);

// Parallel execution
orchestrator.runParallelAgents(agentTasks);

// Sequential with result passing
orchestrator.runSequentialAgents(agentTasks);
```

## Migration Steps

### Step 1: Enable Feature Flags

Set environment variables:
```bash
export USE_ENHANCED_AGENTS=true
export USE_NEW_ORCHESTRATOR=true
export USE_WORKFLOW_TEMPLATES=true
export ENABLE_AGENT_TOOLS=true
```

### Step 2: Update Edge Functions

Replace old agent usage:

**Before:**
```typescript
const agent = new CompensationAgent(model, toolRegistry);
const result = await agent.run({ content });
```

**After:**
```typescript
const agent = new EnhancedCompensationAgent(model);
const result = await agent.analyzeCompensation({
  role,
  location,
  experienceLevel
});
```

### Step 3: Implement Workflows

Create workflow definitions for complex tasks:

```typescript
const sourcingWorkflow: WorkflowDefinition = {
  id: 'custom-sourcing',
  name: 'Custom Sourcing Workflow',
  description: 'Source and evaluate candidates',
  steps: [
    {
      id: 'generate-search',
      agentName: 'BooleanSearchAgent',
      params: { requirements: '{{requirements}}' }
    },
    {
      id: 'search-candidates',
      agentName: 'RecruitmentAgent',
      params: { 
        task: 'search',
        booleanSearch: '{{generate-search.output}}'
      },
      dependsOn: ['generate-search']
    }
  ]
};
```

### Step 4: Monitor Performance

Use the deployment manager:

```typescript
import { deploymentManager } from '/supabase/functions/_shared/config/deployment.config.ts';

// Record metrics
deploymentManager.recordMetric('latency', responseTime);
deploymentManager.recordMetric('error_rate', errorCount / totalRequests);

// Check rollback criteria
const { shouldRollback, reason } = await deploymentManager.checkRollbackCriteria();
if (shouldRollback) {
  await deploymentManager.rollback();
}
```

## Testing

Run the comprehensive test suite:

```bash
deno test supabase/functions/_shared/tests/orchestration.test.ts
```

## Rollback Procedure

If issues occur:

1. **Immediate Rollback:**
   ```bash
   export USE_ENHANCED_AGENTS=false
   export USE_NEW_ORCHESTRATOR=false
   ```

2. **Gradual Rollback:**
   ```typescript
   // Set user-specific flags
   featureFlags.setUserOverride(userId, {
     USE_ENHANCED_AGENTS: false
   });
   ```

## New Capabilities

### 1. Tool-Enabled Agents
- Agents can now call tools during execution
- Automatic retry and error handling
- Tool results feed back into agent reasoning

### 2. Workflow Templates
- Pre-built workflows for common tasks
- Dependency management between steps
- Parallel and sequential execution

### 3. Enhanced Monitoring
- Detailed execution metrics
- Automatic rollback on errors
- Performance tracking

### 4. Specialized Agents
- `BooleanSearchAgent`: Advanced search string generation
- `ProfileEnrichmentAgent`: Contact data enrichment
- `RecruitmentAgent`: Candidate sourcing and evaluation

## Troubleshooting

### Common Issues

1. **Agent Not Found Error**
   - Ensure agent is registered with orchestrator
   - Check agent name spelling

2. **Tool Execution Failures**
   - Verify tool parameters match definition
   - Check API keys for external services

3. **Workflow Timeout**
   - Adjust `maxDuration` in workflow definition
   - Break complex workflows into smaller steps

### Debug Mode

Enable debug logging:
```typescript
const orchestrator = createRecruitmentOrchestrator({
  googleApiKey: apiKey,
  debug: true // Enables detailed logging
});
```

## Best Practices

1. **Start Small**: Begin with single agent migrations before workflows
2. **Test Thoroughly**: Use A/B testing with feature flags
3. **Monitor Closely**: Watch metrics during rollout
4. **Document Changes**: Update API documentation
5. **Gradual Rollout**: Use percentage-based deployment

## Support

For questions or issues:
- Check test files for usage examples
- Review type definitions for API details
- Monitor deployment metrics dashboard

## Next Steps

1. Complete remaining test coverage
2. Set up monitoring dashboards
3. Create runbooks for common scenarios
4. Train team on new capabilities
5. Plan full production rollout