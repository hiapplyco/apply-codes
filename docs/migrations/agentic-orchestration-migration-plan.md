# Agentic Orchestration Migration Plan - Blind Nut Platform

## Executive Summary

This document outlines a comprehensive plan to migrate the Blind Nut recruitment platform from its current basic agent implementation to a sophisticated multi-agent orchestration system. The migration will be executed in 8 phases over approximately 6-8 weeks, maintaining backward compatibility while introducing advanced capabilities including iterative tool execution, prompt management, and context tracking.

## Current State Analysis

### Existing Components
- **Basic Agent Class**: Simple abstract class with single `run()` method
- **CompensationAgent**: Example implementation for compensation analysis
- **Tool Interface**: Simple generic interface with `execute()` method
- **ToolRegistry**: Basic registry for tool management
- **GoogleWebSearchTool**: Mock implementation of search functionality
- **Orchestrator**: Simple agent runner without multi-step capabilities

### Limitations
1. No iterative execution or tool calling within agents
2. No prompt template management system
3. No context tracking between interactions
4. Limited tool parameter validation
5. No specialized agent types for different tasks
6. No multi-step workflow support in orchestrator

## Target Architecture

### Core Components
1. **Advanced Agent System**
   - Iterative execution with tool calling
   - Context tracking (conversation history, tool results)
   - Prompt template rendering
   - Multi-step execution with automatic follow-ups

2. **Prompt Management**
   - Template registration and versioning
   - Variable substitution and validation
   - Domain-specific prompt libraries

3. **Enhanced Tool System**
   - Rich tool definitions with parameter schemas
   - Automatic parameter validation
   - Tool execution result tracking
   - Built-in tools: HTTP, Calculator, Search, FileSystem

4. **Specialized Agents**
   - TaskAgent: General task execution with tools
   - ConversationAgent: Natural language interactions
   - RecruitmentAgent: Sourcing and candidate evaluation
   - BooleanSearchAgent: Advanced search string generation
   - ProfileEnrichmentAgent: Contact data enrichment

5. **Advanced Orchestrator**
   - Multi-agent coordination
   - Workflow templates
   - Result passing between agents
   - Error handling and recovery

## Migration Phases

### Phase 1: Preparation & Analysis (Week 1)

#### Objectives
- Set up development environment for migration
- Create compatibility layers
- Document current usage patterns

#### Tasks
1. **Type Compatibility Layer**
   ```typescript
   // Create adapters to bridge old and new interfaces
   export class LegacyToolAdapter implements Tool {
     constructor(private legacyTool: LegacyTool<any, any>) {}
     // Implementation
   }
   ```

2. **Test Infrastructure**
   - Set up parallel testing for both systems
   - Create test data and scenarios
   - Implement A/B testing framework

3. **Usage Documentation**
   - Map all current agent/tool usage
   - Identify critical paths
   - Document dependencies

#### Deliverables
- Compatibility layer implementation
- Test framework setup
- Usage pattern documentation

### Phase 2: Core Infrastructure Migration (Week 1-2)

#### Objectives
- Implement foundational components
- Maintain backward compatibility
- Set up prompt management

#### Implementation Steps

1. **Create Core Types** (`/supabase/functions/_shared/types/`)
   ```typescript
   // agent.types.ts
   export interface PromptParams {
     [key: string]: any;
   }
   
   export interface PromptTemplate {
     id: string;
     name: string;
     template: string;
     variables: string[];
     description?: string;
   }
   
   export interface ToolDefinition {
     name: string;
     description: string;
     parameters: ParameterSchema;
   }
   
   export interface AgentContext {
     conversationHistory: Message[];
     toolResults: ToolResult[];
   }
   ```

2. **Implement PromptManager** (`/supabase/functions/_shared/prompts/PromptManager.ts`)
   ```typescript
   export class PromptManager {
     private templates: Map<string, PromptTemplate> = new Map();
     
     registerTemplate(template: PromptTemplate): void
     render(template: PromptTemplate, params: PromptParams): string
     validateVariables(template: PromptTemplate, params: PromptParams): void
   }
   ```

3. **Enhance ToolRegistry** (`/supabase/functions/_shared/tools/ToolRegistry.ts`)
   ```typescript
   export class EnhancedToolRegistry extends ToolRegistry {
     getToolDefinitions(): ToolDefinition[]
     getToolsDescription(): string
     validateToolCall(name: string, params: any): void
   }
   ```

#### Testing Strategy
- Unit tests for each component
- Integration tests for prompt rendering
- Performance benchmarks

### Phase 3: Agent System Enhancement (Week 2-3)

#### Objectives
- Implement new Agent base class
- Add iterative execution capabilities
- Create specialized agent types

#### Key Components

1. **Enhanced Agent Base Class**
   ```typescript
   export abstract class Agent<T extends PromptParams> {
     protected context: AgentContext;
     
     async run(params: T): Promise<string> {
       // Iterative execution logic
       // Tool call parsing
       // Context management
     }
     
     protected parseToolCalls(text: string): ToolCall[]
     protected executeToolCalls(calls: ToolCall[]): Promise<ToolResult[]>
     protected buildFollowUpPrompt(previous: string, results: ToolResult[]): string
   }
   ```

2. **Specialized Agents**
   - **TaskAgent**: General-purpose task execution
   - **ConversationAgent**: Natural conversations with context
   - **RecruitmentAgent**: Recruitment-specific workflows
   - **BooleanSearchAgent**: Enhanced boolean search generation

#### Migration Strategy
- Keep old Agent class temporarily
- Create new agents in parallel
- Use feature flags for gradual rollout

### Phase 4: Tool Implementation (Week 3-4)

#### Objectives
- Implement core tool suite
- Migrate existing tools
- Create recruitment-specific tools

#### Tool Suite

1. **Core Tools**
   ```typescript
   // HttpTool: External API integration
   export class HttpTool extends BaseTool {
     definition = {
       name: 'http_request',
       description: 'Make HTTP requests',
       parameters: {
         url: { type: 'string', required: true },
         method: { type: 'string', required: false },
         headers: { type: 'object', required: false },
         body: { type: 'object', required: false }
       }
     };
   }
   
   // CalculatorTool: Mathematical operations
   // SearchTool: Enhanced web search
   // FileSystemTool: File operations
   ```

2. **Recruitment Tools**
   ```typescript
   // LinkedInSearchTool: LinkedIn profile search
   // NymeriaEnrichmentTool: Contact enrichment
   // ResumeParseTool: Resume parsing
   // SkillsExtractionTool: Skills analysis
   ```

#### Integration Points
- Google Custom Search API
- Nymeria API
- Internal Supabase functions

### Phase 5: Orchestrator Enhancement (Week 4)

#### Objectives
- Implement multi-agent workflows
- Add coordination capabilities
- Create workflow templates

#### Enhanced Orchestrator Features

1. **Multi-Step Workflows**
   ```typescript
   export class EnhancedOrchestrator extends Orchestrator {
     async runWorkflow(workflow: WorkflowDefinition, params: any): Promise<any> {
       // Sequential and parallel execution
       // Result passing between agents
       // Error handling and recovery
     }
   }
   ```

2. **Workflow Templates**
   - Candidate sourcing workflow
   - Interview scheduling workflow
   - Compensation analysis workflow
   - Profile enrichment workflow

### Phase 6: Agent Migration & Integration (Week 5)

#### Migration Steps

1. **CompensationAgent Migration**
   ```typescript
   export class EnhancedCompensationAgent extends Agent<CompensationParams> {
     constructor(model: GoogleGenerativeAI) {
       super(model, compensationTemplate, toolRegistry);
       // Register compensation-specific tools
     }
   }
   ```

2. **New Agent Implementations**
   - RecruitmentAgent with sourcing tools
   - BooleanSearchAgent with optimization
   - ProfileEnrichmentAgent with Nymeria
   - InterviewAgent with scheduling

#### Integration Points
- Update edge functions to use new agents
- Maintain backward compatibility
- Add monitoring and logging

### Phase 7: Testing & Validation (Week 5-6)

#### Testing Strategy

1. **Unit Testing**
   - Component-level tests
   - Mock external dependencies
   - Edge case coverage

2. **Integration Testing**
   ```typescript
   describe('Agent-Tool Integration', () => {
     it('should execute tools within agent context', async () => {
       const agent = new TaskAgent(model);
       const result = await agent.executeTask('Search for AWS architects');
       expect(result).toContain('search results');
     });
   });
   ```

3. **End-to-End Testing**
   - Complete workflow execution
   - Performance benchmarks
   - Load testing

4. **User Acceptance Testing**
   - Beta testing with select users
   - Feedback collection
   - Performance monitoring

### Phase 8: Deployment & Rollback Strategy (Week 6)

#### Deployment Strategy

1. **Feature Flags**
   ```typescript
   export const FEATURE_FLAGS = {
     USE_ENHANCED_AGENTS: process.env.USE_ENHANCED_AGENTS === 'true',
     USE_NEW_ORCHESTRATOR: process.env.USE_NEW_ORCHESTRATOR === 'true',
   };
   ```

2. **Gradual Rollout**
   - 10% → 25% → 50% → 100%
   - Monitor error rates and performance
   - Collect user feedback

3. **Backward Compatibility**
   ```typescript
   // Wrapper to support both old and new interfaces
   export function createAgent(type: string, model: any) {
     if (FEATURE_FLAGS.USE_ENHANCED_AGENTS) {
       return createEnhancedAgent(type, model);
     }
     return createLegacyAgent(type, model);
   }
   ```

#### Rollback Plan

1. **Monitoring & Alerts**
   - Error rate thresholds
   - Performance degradation alerts
   - User feedback monitoring

2. **Rollback Triggers**
   - Error rate > 5% increase
   - Response time > 20% increase
   - Critical bug reports

3. **Rollback Procedure**
   ```bash
   # 1. Disable feature flags
   # 2. Revert edge function deployments
   # 3. Clear caches
   # 4. Notify team and users
   ```

## Agent and Tool Specifications

### Agent Hierarchy

```
Agent (Base Class)
├── TaskAgent
│   ├── Tools: HTTP, Calculator, Search, FileSystem
│   └── Use Cases: General task execution
├── ConversationAgent
│   ├── Tools: Calculator, Search
│   └── Use Cases: Natural conversations
├── RecruitmentAgent
│   ├── Tools: LinkedInSearch, SkillsExtraction, ResumeParse
│   └── Use Cases: Candidate sourcing and evaluation
├── BooleanSearchAgent
│   ├── Tools: SearchOptimizer, SynonymGenerator
│   └── Use Cases: Advanced search string generation
├── ProfileEnrichmentAgent
│   ├── Tools: NymeriaEnrichment, SocialProfileSearch
│   └── Use Cases: Contact data enrichment
└── CompensationAgent
    ├── Tools: MarketDataSearch, Calculator
    └── Use Cases: Compensation analysis
```

### Tool Categories

1. **Core Tools**
   - HttpTool: External API calls
   - CalculatorTool: Mathematical operations
   - SearchTool: Web search
   - FileSystemTool: File operations

2. **Recruitment Tools**
   - LinkedInSearchTool: Profile search
   - NymeriaEnrichmentTool: Contact enrichment
   - ResumeParseTool: Resume analysis
   - SkillsExtractionTool: Skills identification

3. **Utility Tools**
   - CacheTool: Result caching
   - ValidationTool: Data validation
   - TransformationTool: Data transformation

## Success Metrics

### Technical Metrics
- Test coverage > 80%
- Response time < 3 seconds
- Error rate < 0.1%
- Tool execution success rate > 95%

### Business Metrics
- Agent task completion rate > 90%
- User satisfaction score > 4.5/5
- Time savings > 50% for complex tasks
- Adoption rate > 80% within 30 days

## Risk Mitigation

### Technical Risks
1. **API Rate Limits**
   - Implement caching and queuing
   - Monitor usage patterns
   - Have fallback strategies

2. **Performance Degradation**
   - Load testing before deployment
   - Performance monitoring
   - Optimization strategies

3. **Integration Failures**
   - Comprehensive error handling
   - Circuit breakers
   - Graceful degradation

### Business Risks
1. **User Adoption**
   - Training materials
   - Gradual feature introduction
   - User feedback loops

2. **Cost Overruns**
   - Monitor AI API usage
   - Implement cost controls
   - Usage analytics

## Timeline Summary

- **Week 1**: Preparation & Analysis
- **Week 1-2**: Core Infrastructure
- **Week 2-3**: Agent System Enhancement
- **Week 3-4**: Tool Implementation
- **Week 4**: Orchestrator Enhancement
- **Week 5**: Agent Migration
- **Week 5-6**: Testing & Validation
- **Week 6**: Deployment

## Next Steps

1. Review and approve migration plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews
5. Prepare communication plan for stakeholders

## Appendices

### A. Code Examples
[Detailed code examples for each component]

### B. API Documentation
[API specifications for all tools and agents]

### C. Testing Scenarios
[Comprehensive test cases and scenarios]

### D. Monitoring Dashboard
[Metrics and monitoring setup]

---

*Document Version: 1.0*
*Last Updated: June 2025*
*Author: Claude AI Assistant*