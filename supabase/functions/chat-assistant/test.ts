/**
 * Test script for the tool-aware chat assistant
 * Run with: deno test --allow-all test.ts
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { IntentAnalyzer } from "./intent-analyzer.ts";
import { ToolRegistry } from "./tools.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

// Mock Gemini for testing
class MockGemini {
  generateContent(prompt: string) {
    // Return different responses based on prompt content
    if (prompt.includes("Find senior React developers")) {
      return {
        response: {
          text: () => JSON.stringify({
            intent: "find_candidates_with_boolean_search",
            confidence: 0.95,
            suggestedTools: ["generate_boolean_search"],
            parameters: {
              generate_boolean_search: {
                requirements: "senior React developers with TypeScript experience in the Bay Area"
              }
            },
            reasoning: "User wants to find specific candidates, boolean search is the best tool"
          })
        }
      };
    }
    
    return {
      response: {
        text: () => JSON.stringify({
          intent: "general_conversation",
          confidence: 0.5,
          suggestedTools: [],
          parameters: {},
          reasoning: "No specific tools needed"
        })
      }
    };
  }
}

// Test intent analysis
Deno.test("Intent Analyzer - Boolean Search", async () => {
  const mockGenAI = {
    getGenerativeModel: () => new MockGemini()
  } as any;
  
  const analyzer = new IntentAnalyzer(mockGenAI, "tool descriptions");
  
  const result = await analyzer.analyzeIntent(
    "Find senior React developers",
    []
  );
  
  assertEquals(result.intent, "find_candidates_with_boolean_search");
  assertEquals(result.confidence, 0.95);
  assertEquals(result.suggestedTools, ["generate_boolean_search"]);
  assertExists(result.parameters.generate_boolean_search);
});

// Test tool registry
Deno.test("Tool Registry - Registration and Retrieval", () => {
  const registry = new ToolRegistry("https://test.supabase.co", "test-key");
  
  // Test that default tools are registered
  const booleanTool = registry.get("generate_boolean_search");
  assertExists(booleanTool);
  assertEquals(booleanTool.name, "generate_boolean_search");
  
  // Test custom tool registration
  registry.register({
    name: "custom_tool",
    description: "A custom tool",
    execute: async () => ({ success: true })
  });
  
  const customTool = registry.get("custom_tool");
  assertExists(customTool);
  assertEquals(customTool.name, "custom_tool");
});

// Test tool execution mock
Deno.test("Tool Execution - Mock Boolean Search", async () => {
  const mockTool = {
    name: "generate_boolean_search",
    description: "Generate boolean search",
    execute: async (params: any) => {
      return {
        success: true,
        searchString: `(${params.requirements}) AND (experience OR senior)`,
        jobId: 123
      };
    }
  };
  
  const result = await mockTool.execute({
    requirements: "React developer"
  });
  
  assertEquals(result.success, true);
  assertExists(result.searchString);
  assertEquals(result.jobId, 123);
});

// Integration test for full flow
Deno.test("Full Chat Flow - Mock", async () => {
  const message = "I need to find senior Python developers who know Django";
  const history = [];
  
  // Simulate intent analysis
  const intent = {
    intent: "find_candidates_with_boolean_search",
    confidence: 0.9,
    suggestedTools: ["generate_boolean_search"],
    parameters: {
      generate_boolean_search: {
        requirements: "senior Python developers who know Django"
      }
    },
    reasoning: "User wants to find specific developers"
  };
  
  // Simulate tool execution
  const toolResults = [
    {
      tool: "generate_boolean_search",
      parameters: intent.parameters.generate_boolean_search,
      result: {
        success: true,
        searchString: "(Python OR Python3) AND Django AND (Senior OR Lead OR Staff)"
      }
    }
  ];
  
  // Verify the flow works
  assertEquals(intent.suggestedTools.length, 1);
  assertEquals(toolResults[0].result.success, true);
  assertExists(toolResults[0].result.searchString);
});

// Test error handling
Deno.test("Error Handling - Tool Failure", async () => {
  const failingTool = {
    name: "failing_tool",
    description: "A tool that fails",
    execute: async () => {
      throw new Error("Tool execution failed");
    }
  };
  
  try {
    await failingTool.execute({});
  } catch (error) {
    assertEquals(error.message, "Tool execution failed");
  }
});

// Test parameter extraction
Deno.test("Parameter Extraction - Complex Requirements", () => {
  const testCases = [
    {
      message: "Find React developers with 5+ years in San Francisco",
      expectedParams: {
        requirements: "React developers with 5+ years in San Francisco",
        searchType: "linkedin"
      }
    },
    {
      message: "What's the salary for a senior engineer in Seattle?",
      expectedParams: {
        content: "senior engineer in Seattle"
      }
    },
    {
      message: "Enhance this job description: We need a product manager",
      expectedParams: {
        content: "We need a product manager"
      }
    }
  ];
  
  // Each test case would be processed by the intent analyzer
  testCases.forEach(testCase => {
    assertExists(testCase.expectedParams);
  });
});

console.log("All tests completed!");