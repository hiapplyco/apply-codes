import { assertEquals, assertExists } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  createRecruitmentOrchestrator,
  WorkflowTemplates,
  TaskAgent,
  ConversationAgent,
  RecruitmentAgent,
  BooleanSearchAgent,
  EnhancedCompensationAgent,
  LinkedInSearchTool,
  SkillsExtractionTool,
  ResumeParseTool,
  CalculatorTool,
  promptManager
} from "../orchestration/index.ts";

// Mock Google Generative AI for testing
class MockGoogleGenerativeAI extends GoogleGenerativeAI {
  constructor() {
    super("mock-api-key");
  }

  override getGenerativeModel() {
    return {
      apiKey: this.apiKey,
      _requestOptions: {},
      model: "gemini-2.5-flash",
      generationConfig: {},
      safetySettings: [],
      tools: [],
      toolConfig: undefined,
      systemInstruction: undefined,
      cachedContent: undefined,
      requestOptions: {},
      
      generateContent: async (prompt: string | any) => {
        const promptText = typeof prompt === 'string' ? prompt : prompt.contents?.[0]?.parts?.[0]?.text || '';
        return {
          response: {
            text: () => `Mock response for: ${promptText.slice(0, 50)}...`,
            candidates: [],
            promptFeedback: undefined,
            usageMetadata: undefined
          }
        };
      },
      
      generateContentStream: async function* () {
        yield {
          text: () => "Mock stream response",
          candidates: [],
          promptFeedback: undefined,
          usageMetadata: undefined
        };
      },
      
      startChat: () => ({
        sendMessage: async () => ({
          response: {
            text: () => "Mock chat response",
            candidates: [],
            promptFeedback: undefined,
            usageMetadata: undefined
          }
        }),
        sendMessageStream: async function* () {
          yield {
            text: () => "Mock chat stream",
            candidates: [],
            promptFeedback: undefined,
            usageMetadata: undefined
          };
        },
        getHistory: () => []
      }),
      
      countTokens: async () => ({ totalTokens: 10 }),
      embedContent: async () => ({ embedding: { values: [] } }),
      batchEmbedContents: async () => ({ embeddings: [] })
    } as any;
  }
}

Deno.test("Agent Base Class Tests", async (t) => {
  const mockModel = new MockGoogleGenerativeAI();

  await t.step("TaskAgent should execute tasks with tools", async () => {
    const agent = new TaskAgent(mockModel);
    const result = await agent.executeTask("Calculate 15% of 250");
    assertExists(result);
    assertEquals(typeof result, "string");
  });

  await t.step("ConversationAgent should handle chat messages", async () => {
    const agent = new ConversationAgent(mockModel);
    const result = await agent.chat("Hello, how are you?");
    assertExists(result);
    assertEquals(typeof result, "string");
  });

  await t.step("Agent should parse tool calls correctly", async () => {
    const agent = new TaskAgent(mockModel);
    // Test internal tool parsing (would need to expose method for testing)
    // Example of what a tool call looks like:
    // <tool_call>
    // {"name": "calculator", "params": {"expression": "15 * 0.25"}}
    // </tool_call>
    
    // Since parseToolCalls is private, we test indirectly through execution
    const result = await agent.executeTask("Calculate 15% of 250");
    assertExists(result);
  });
});

Deno.test("Tool Tests", async (t) => {
  await t.step("CalculatorTool should perform calculations", async () => {
    const tool = new CalculatorTool();
    const result = await tool.execute({ expression: "2 + 3 * 4" });
    assertEquals(result.success, true);
    assertEquals(result.result, 14);
  });

  await t.step("SkillsExtractionTool should extract skills from text", async () => {
    const tool = new SkillsExtractionTool();
    const resumeText = `
      Senior Software Engineer with 5 years experience in React, Node.js, and AWS.
      Proficient in Python, Docker, and Kubernetes. Strong leadership skills.
    `;
    
    const result = await tool.execute({ text: resumeText });
    assertEquals(result.success, true);
    assertExists(result.skillsByCategory);
    assertExists(result.topSkills);
  });

  await t.step("ResumeParseTool should parse resume structure", async () => {
    const tool = new ResumeParseTool();
    const resumeText = `
      John Doe
      john.doe@email.com
      (555) 123-4567
      
      Experience:
      Senior Developer at Tech Corp
      2020 - Present
      
      Education:
      Bachelor of Science in Computer Science
      University of Technology, 2019
    `;
    
    const result = await tool.execute({ resumeText });
    assertEquals(result.success, true);
    assertExists(result.parsedData);
    assertEquals(result.parsedData.personalInfo.email, "john.doe@email.com");
  });

  await t.step("LinkedInSearchTool should return mock profiles", async () => {
    const tool = new LinkedInSearchTool();
    const result = await tool.execute({ 
      booleanSearch: '"software engineer" AND React',
      limit: 5 
    });
    assertEquals(result.success, true);
    assertExists(result.profiles);
    assertEquals(Array.isArray(result.profiles), true);
  });
});

Deno.test("Prompt Manager Tests", async (t) => {
  await t.step("Should register and retrieve templates", () => {
    const template = {
      id: 'test_template',
      name: 'Test Template',
      template: 'Hello {{name}}, your task is {{task}}',
      variables: ['name', 'task']
    };
    
    promptManager.registerTemplate(template);
    const retrieved = promptManager.getTemplate('test_template');
    assertExists(retrieved);
    assertEquals(retrieved?.name, 'Test Template');
  });

  await t.step("Should render templates with variables", () => {
    const template = promptManager.getTemplate('test_template');
    assertExists(template);
    
    const rendered = promptManager.render(template, {
      name: 'Alice',
      task: 'write tests'
    });
    
    assertEquals(rendered, 'Hello Alice, your task is write tests');
  });

  await t.step("Should throw error for missing variables", () => {
    const template = promptManager.getTemplate('test_template');
    assertExists(template);
    
    let errorThrown = false;
    try {
      promptManager.render(template, { name: 'Alice' }); // Missing 'task'
    } catch (error) {
      errorThrown = true;
      assertEquals(error instanceof Error && error.message.includes('Missing required variables'), true);
    }
    assertEquals(errorThrown, true);
  });
});

Deno.test("Enhanced Orchestrator Tests", async (t) => {
  const mockModel = new MockGoogleGenerativeAI();
  const orchestrator = createRecruitmentOrchestrator({
    googleApiKey: "mock-key",
    debug: true
  });
  
  // Replace with mocked agents for testing
  orchestrator.registerAgent('TaskAgent', new TaskAgent(mockModel));
  orchestrator.registerAgent('ConversationAgent', new ConversationAgent(mockModel));
  orchestrator.registerAgent('RecruitmentAgent', new RecruitmentAgent(mockModel));
  orchestrator.registerAgent('BooleanSearchAgent', new BooleanSearchAgent(mockModel));
  orchestrator.registerAgent('CompensationAgent', new EnhancedCompensationAgent(mockModel));

  await t.step("Should register all agents", () => {
    const agents = orchestrator.getRegisteredAgents();
    assertExists(agents);
    assertEquals(agents.includes('TaskAgent'), true);
    assertEquals(agents.includes('RecruitmentAgent'), true);
    assertEquals(agents.includes('BooleanSearchAgent'), true);
    assertEquals(agents.includes('CompensationAgent'), true);
  });

  await t.step("Should run single agent", async () => {
    const result = await orchestrator.runSingleAgent('TaskAgent', {
      task: 'Test task',
      context: 'Testing'
    });
    assertExists(result);
    assertEquals(typeof result, 'string');
  });

  await t.step("Should execute workflow", async () => {
    // Create a simple test workflow
    const testWorkflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Simple test workflow',
      steps: [
        {
          id: 'step1',
          agentName: 'TaskAgent',
          params: { task: 'First task', context: 'Test context' }
        },
        {
          id: 'step2',
          agentName: 'TaskAgent',
          params: { task: 'Second task using {{step1.output}}', context: 'Test context' },
          dependsOn: ['step1']
        }
      ],
      onError: 'continue' as const
    };

    const result = await orchestrator.runWorkflow(testWorkflow);
    assertExists(result);
    assertEquals(result.success, true);
    assertEquals(result.metadata.stepsCompleted, 2);
  });

  await t.step("Should handle parallel execution", async () => {
    const parallelResults = await orchestrator.runParallelAgents([
      { agentName: 'TaskAgent', params: { task: 'Task 1', context: 'Test' } },
      { agentName: 'TaskAgent', params: { task: 'Task 2', context: 'Test' } },
      { agentName: 'TaskAgent', params: { task: 'Task 3', context: 'Test' } }
    ]);

    assertExists(parallelResults);
    assertEquals(Object.keys(parallelResults).length, 3);
  });

  await t.step("Should handle sequential execution", async () => {
    const sequentialResults = await orchestrator.runSequentialAgents([
      { agentName: 'TaskAgent', params: { task: 'Step 1', context: 'Test' } },
      { 
        agentName: 'TaskAgent', 
        params: (prev: string) => ({ task: `Step 2 based on: ${prev}`, context: 'Test' })
      }
    ]);

    assertExists(sequentialResults);
    assertEquals(sequentialResults.length, 2);
  });
});

Deno.test("Recruitment Agent Tests", async (t) => {
  const mockModel = new MockGoogleGenerativeAI();

  await t.step("RecruitmentAgent should search candidates", async () => {
    const agent = new RecruitmentAgent(mockModel);
    const result = await agent.searchCandidates("Senior React Developer in SF");
    assertExists(result);
  });

  await t.step("BooleanSearchAgent should generate search strings", async () => {
    const agent = new BooleanSearchAgent(mockModel);
    const result = await agent.generateBooleanSearch(
      "Senior React Developer with AWS experience",
      'medium'
    );
    assertExists(result);
    assertEquals(typeof result, 'string');
  });

  await t.step("BooleanSearchAgent should optimize existing searches", async () => {
    const agent = new BooleanSearchAgent(mockModel);
    const currentSearch = '("React Developer" OR "Frontend Engineer") AND AWS';
    const result = await agent.optimizeBooleanSearch(
      currentSearch,
      "Too many junior candidates, need more senior results"
    );
    assertExists(result);
  });
});

Deno.test("Compensation Agent Tests", async (t) => {
  const mockModel = new MockGoogleGenerativeAI();

  await t.step("Should analyze compensation for a role", async () => {
    const agent = new EnhancedCompensationAgent(mockModel);
    const result = await agent.analyzeCompensation({
      role: "Software Engineer",
      location: "San Francisco",
      experienceLevel: "Senior",
      skills: ["React", "Node.js", "AWS"]
    });
    
    assertExists(result);
    assertEquals(result.role, "Software Engineer");
    assertEquals(result.location, "San Francisco");
    assertExists(result.baseySalary);
    assertExists(result.confidence);
  });

  await t.step("Should provide negotiation guidance", async () => {
    const agent = new EnhancedCompensationAgent(mockModel);
    const marketData = {
      role: "Software Engineer",
      location: "San Francisco",
      currency: "USD",
      baseySalary: { p25: 120000, p50: 150000, p75: 180000, p90: 220000 },
      totalCompensation: { p25: 150000, p50: 190000, p75: 230000, p90: 280000 },
      components: {
        baseSalary: "70%",
        bonus: "15%",
        equity: "10%",
        benefits: "5%"
      },
      factors: ["Location", "Experience"],
      sources: ["Market data"],
      lastUpdated: new Date(),
      confidence: 'high' as const
    };

    const result = await agent.negotiationGuidance(
      160000,
      marketData,
      { experience: "7 years", skills: ["React", "AWS"] }
    );

    assertExists(result);
    assertExists(result.recommendation);
    assertExists(result.targetRange);
  });
});

Deno.test("Workflow Templates Tests", async (t) => {
  await t.step("Should have candidate sourcing workflow", () => {
    const workflow = WorkflowTemplates.candidateSourcing;
    assertExists(workflow);
    assertEquals(workflow.id, 'candidate-sourcing');
    assertEquals(workflow.steps.length, 4);
    assertEquals(workflow.steps[0].agentName, 'BooleanSearchAgent');
  });

  await t.step("Should have compensation analysis workflow", () => {
    const workflow = WorkflowTemplates.compensationAnalysis;
    assertExists(workflow);
    assertEquals(workflow.id, 'compensation-analysis');
    assertEquals(workflow.parallel, true);
  });

  await t.step("Should have interview scheduling workflow", () => {
    const workflow = WorkflowTemplates.interviewScheduling;
    assertExists(workflow);
    assertEquals(workflow.id, 'interview-scheduling');
    assertExists(workflow.maxDuration);
  });
});

// Integration test with actual workflow execution
Deno.test("Integration: Candidate Sourcing Workflow", async () => {
  const orchestrator = createRecruitmentOrchestrator({
    googleApiKey: "mock-key",
    debug: false
  });

  const result = await orchestrator.runWorkflow(
    WorkflowTemplates.candidateSourcing,
    {
      requirements: "Senior React Developer with 5+ years experience in San Francisco"
    }
  );

  assertExists(result);
  assertEquals(result.workflowId.startsWith('candidate-sourcing'), true);
  assertExists(result.metadata);
  // In a real test, we'd check the actual results
});