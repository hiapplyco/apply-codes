# Phase 1 Implementation Guide: Preparation & Analysis

## Overview

This guide provides detailed implementation steps for Phase 1 of the Agentic Orchestration Migration. Phase 1 focuses on creating the foundation for a smooth migration by establishing compatibility layers, test infrastructure, and documentation.

## Prerequisites

- Access to the Blind Nut codebase
- Understanding of current agent/tool implementations
- Supabase CLI configured
- Node.js and npm installed

## Step 1: Create Type Compatibility Layer

### 1.1 Create Compatibility Types

Create a new file: `/supabase/functions/_shared/types/compatibility.ts`

```typescript
// compatibility.ts - Bridge between old and new systems

import { Tool as LegacyTool } from "../tools/Tool.ts";
import { 
  Tool as NewTool, 
  ToolDefinition, 
  BaseTool 
} from "../agents/Agent.ts";

/**
 * Adapter to use legacy tools with new agent system
 */
export class LegacyToolAdapter extends BaseTool {
  private legacyTool: LegacyTool<any, any>;
  
  definition: ToolDefinition;
  
  constructor(legacyTool: LegacyTool<any, any>) {
    super();
    this.legacyTool = legacyTool;
    
    // Create definition from legacy tool
    this.definition = {
      name: legacyTool.name,
      description: legacyTool.description,
      parameters: {
        input: {
          type: 'any',
          description: 'Input for the legacy tool',
          required: true
        }
      }
    };
  }
  
  async execute(params: any): Promise<any> {
    // Extract input from new format
    const input = params.input;
    
    try {
      const result = await this.legacyTool.execute(input);
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Adapter to use new tools with legacy system
 */
export class NewToolAdapter<T, U> implements LegacyTool<T, U> {
  private newTool: NewTool;
  
  name: string;
  description: string;
  
  constructor(newTool: NewTool) {
    this.newTool = newTool;
    this.name = newTool.definition.name;
    this.description = newTool.definition.description;
  }
  
  async execute(input: T): Promise<U> {
    // Wrap input in expected format
    const params = { input };
    const result = await this.newTool.execute(params);
    
    // Extract result based on success
    if (result.success) {
      return result.result as U;
    } else {
      throw new Error(result.error || 'Execution failed');
    }
  }
}
```

### 1.2 Create Agent Compatibility Layer

Create a new file: `/supabase/functions/_shared/agents/compatibility.ts`

```typescript
// Agent compatibility layer

import { Agent as LegacyAgent } from "./Agent.ts";
import { Agent as NewAgent } from "./EnhancedAgent.ts"; // Will be created in Phase 3
import { PromptParams } from "../prompts/types.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Factory function to create agents based on feature flag
 */
export function createCompatibleAgent<T extends PromptParams>(
  type: string,
  model: GoogleGenerativeAI,
  options?: any
): LegacyAgent<T> | NewAgent<T> {
  const useEnhancedAgents = Deno.env.get("USE_ENHANCED_AGENTS") === "true";
  
  if (useEnhancedAgents) {
    // Return new agent (to be implemented in Phase 3)
    throw new Error("Enhanced agents not yet implemented");
  } else {
    // Return legacy agent
    switch (type) {
      case "compensation":
        const { CompensationAgent } = await import("./CompensationAgent.ts");
        return new CompensationAgent(model, options.toolRegistry);
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}
```

## Step 2: Set Up Test Infrastructure

### 2.1 Create Test Utilities

Create a new file: `/supabase/functions/_shared/test/utils.ts`

```typescript
// Test utilities for agent system

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Mock Google Generative AI for testing
 */
export class MockGoogleGenerativeAI extends GoogleGenerativeAI {
  private mockResponses: Map<string, string> = new Map();
  
  constructor() {
    super("mock-api-key");
  }
  
  setMockResponse(prompt: string, response: string) {
    this.mockResponses.set(prompt, response);
  }
  
  getGenerativeModel() {
    const mockResponses = this.mockResponses;
    return {
      generateContent: async (prompt: string) => {
        const response = mockResponses.get(prompt) || "Mock response";
        return {
          response: {
            text: () => response
          }
        };
      }
    };
  }
}

/**
 * Test fixture for agent testing
 */
export class AgentTestFixture {
  model: MockGoogleGenerativeAI;
  
  constructor() {
    this.model = new MockGoogleGenerativeAI();
  }
  
  expectPromptContains(actual: string, expected: string) {
    if (!actual.includes(expected)) {
      throw new Error(`Expected prompt to contain "${expected}" but got "${actual}"`);
    }
  }
  
  expectToolCall(response: string, toolName: string) {
    const toolCallRegex = new RegExp(`<tool_call>.*"name"\\s*:\\s*"${toolName}".*</tool_call>`, 's');
    if (!toolCallRegex.test(response)) {
      throw new Error(`Expected response to contain tool call for "${toolName}"`);
    }
  }
}

/**
 * Create test scenarios for parallel testing
 */
export interface TestScenario {
  name: string;
  input: any;
  expectedOutput: any;
  expectedTools?: string[];
}

export const commonTestScenarios: TestScenario[] = [
  {
    name: "Simple text processing",
    input: { content: "Analyze this text" },
    expectedOutput: { success: true },
    expectedTools: []
  },
  {
    name: "Tool-required task",
    input: { content: "Search for information about AI" },
    expectedOutput: { success: true },
    expectedTools: ["web_search"]
  },
  {
    name: "Multi-tool task",
    input: { content: "Search for AWS architect salaries and calculate the average" },
    expectedOutput: { success: true },
    expectedTools: ["web_search", "calculator"]
  }
];
```

### 2.2 Create Parallel Testing Framework

Create a new file: `/supabase/functions/_shared/test/parallel-test.ts`

```typescript
// Parallel testing framework for comparing old and new implementations

import { Agent as LegacyAgent } from "../agents/Agent.ts";
import { Agent as NewAgent } from "../agents/EnhancedAgent.ts"; // Future import
import { TestScenario } from "./utils.ts";

export interface ParallelTestResult {
  scenario: string;
  legacyResult: any;
  newResult: any;
  compatible: boolean;
  differences: string[];
}

export class ParallelTestRunner {
  async runScenario(
    scenario: TestScenario,
    legacyAgent: LegacyAgent<any>,
    newAgent?: any // Will be NewAgent in future
  ): Promise<ParallelTestResult> {
    const result: ParallelTestResult = {
      scenario: scenario.name,
      legacyResult: null,
      newResult: null,
      compatible: true,
      differences: []
    };
    
    try {
      // Run legacy agent
      result.legacyResult = await legacyAgent.run(scenario.input);
      
      // Run new agent (when available)
      if (newAgent) {
        result.newResult = await newAgent.run(scenario.input);
        
        // Compare results
        result.compatible = this.compareResults(
          result.legacyResult, 
          result.newResult,
          result.differences
        );
      }
    } catch (error) {
      result.compatible = false;
      result.differences.push(`Error: ${error.message}`);
    }
    
    return result;
  }
  
  private compareResults(legacy: any, enhanced: any, differences: string[]): boolean {
    // Basic comparison - will be enhanced
    if (typeof legacy !== typeof enhanced) {
      differences.push("Result types differ");
      return false;
    }
    
    // More detailed comparison logic here
    return true;
  }
  
  async runAllScenarios(
    scenarios: TestScenario[],
    legacyAgent: LegacyAgent<any>,
    newAgent?: any
  ): Promise<ParallelTestResult[]> {
    const results: ParallelTestResult[] = [];
    
    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario, legacyAgent, newAgent);
      results.push(result);
    }
    
    return results;
  }
  
  generateReport(results: ParallelTestResult[]): string {
    const compatible = results.filter(r => r.compatible).length;
    const total = results.length;
    
    let report = `Parallel Test Report\n`;
    report += `====================\n\n`;
    report += `Total Scenarios: ${total}\n`;
    report += `Compatible: ${compatible}\n`;
    report += `Incompatible: ${total - compatible}\n\n`;
    
    for (const result of results) {
      report += `Scenario: ${result.scenario}\n`;
      report += `Compatible: ${result.compatible ? 'Yes' : 'No'}\n`;
      if (result.differences.length > 0) {
        report += `Differences:\n`;
        result.differences.forEach(diff => {
          report += `  - ${diff}\n`;
        });
      }
      report += `\n`;
    }
    
    return report;
  }
}
```

## Step 3: Document Current Usage Patterns

### 3.1 Create Usage Scanner

Create a new file: `/supabase/functions/_shared/scripts/scan-usage.ts`

```typescript
// Script to scan and document agent/tool usage patterns

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";

export interface UsagePattern {
  file: string;
  line: number;
  type: 'agent' | 'tool' | 'orchestrator';
  usage: string;
  context: string;
}

export class UsageScanner {
  private patterns: UsagePattern[] = [];
  
  async scanDirectory(path: string): Promise<void> {
    for await (const entry of walk(path, { exts: [".ts", ".js"] })) {
      if (entry.isFile && !entry.path.includes("node_modules")) {
        await this.scanFile(entry.path);
      }
    }
  }
  
  private async scanFile(filePath: string): Promise<void> {
    const content = await Deno.readTextFile(filePath);
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Scan for agent usage
      if (line.includes('new ') && line.includes('Agent')) {
        this.patterns.push({
          file: filePath,
          line: index + 1,
          type: 'agent',
          usage: line.trim(),
          context: this.getContext(lines, index)
        });
      }
      
      // Scan for tool usage
      if (line.includes('.execute(') || line.includes('Tool')) {
        this.patterns.push({
          file: filePath,
          line: index + 1,
          type: 'tool',
          usage: line.trim(),
          context: this.getContext(lines, index)
        });
      }
      
      // Scan for orchestrator usage
      if (line.includes('orchestrator') || line.includes('Orchestrator')) {
        this.patterns.push({
          file: filePath,
          line: index + 1,
          type: 'orchestrator',
          usage: line.trim(),
          context: this.getContext(lines, index)
        });
      }
    });
  }
  
  private getContext(lines: string[], index: number): string {
    const start = Math.max(0, index - 2);
    const end = Math.min(lines.length - 1, index + 2);
    return lines.slice(start, end + 1).join('\n');
  }
  
  generateReport(): string {
    let report = `Agent System Usage Report\n`;
    report += `========================\n\n`;
    
    // Group by type
    const byType = this.groupByType();
    
    for (const [type, patterns] of Object.entries(byType)) {
      report += `\n${type.toUpperCase()} Usage (${patterns.length} occurrences)\n`;
      report += `-`.repeat(40) + `\n`;
      
      patterns.forEach(pattern => {
        report += `\nFile: ${pattern.file}:${pattern.line}\n`;
        report += `Usage: ${pattern.usage}\n`;
        report += `Context:\n${pattern.context}\n`;
      });
    }
    
    return report;
  }
  
  private groupByType(): Record<string, UsagePattern[]> {
    const grouped: Record<string, UsagePattern[]> = {
      agent: [],
      tool: [],
      orchestrator: []
    };
    
    this.patterns.forEach(pattern => {
      grouped[pattern.type].push(pattern);
    });
    
    return grouped;
  }
  
  getCriticalPaths(): string[] {
    // Identify files with multiple usages (likely critical paths)
    const fileCounts = new Map<string, number>();
    
    this.patterns.forEach(pattern => {
      const count = fileCounts.get(pattern.file) || 0;
      fileCounts.set(pattern.file, count + 1);
    });
    
    const criticalPaths: string[] = [];
    fileCounts.forEach((count, file) => {
      if (count >= 3) { // Arbitrary threshold
        criticalPaths.push(file);
      }
    });
    
    return criticalPaths;
  }
}

// Run the scanner
if (import.meta.main) {
  const scanner = new UsageScanner();
  await scanner.scanDirectory("./supabase/functions");
  
  const report = scanner.generateReport();
  await Deno.writeTextFile("./docs/usage-patterns.md", report);
  
  const criticalPaths = scanner.getCriticalPaths();
  console.log("Critical paths identified:", criticalPaths);
}
```

### 3.2 Create Dependency Map

Create a new file: `/supabase/functions/_shared/scripts/dependency-map.ts`

```typescript
// Generate dependency map for agent system

export interface Dependency {
  from: string;
  to: string;
  type: 'import' | 'extends' | 'implements' | 'uses';
}

export class DependencyMapper {
  private dependencies: Dependency[] = [];
  
  async mapFile(filePath: string): Promise<void> {
    const content = await Deno.readTextFile(filePath);
    
    // Extract imports
    const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+["']([^"']+)["']/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      this.dependencies.push({
        from: filePath,
        to: match[1],
        type: 'import'
      });
    }
    
    // Extract class extensions
    const extendsRegex = /class\s+\w+\s+extends\s+(\w+)/g;
    while ((match = extendsRegex.exec(content)) !== null) {
      this.dependencies.push({
        from: filePath,
        to: match[1],
        type: 'extends'
      });
    }
    
    // Extract interface implementations
    const implementsRegex = /class\s+\w+\s+implements\s+(\w+)/g;
    while ((match = implementsRegex.exec(content)) !== null) {
      this.dependencies.push({
        from: filePath,
        to: match[1],
        type: 'implements'
      });
    }
  }
  
  generateMermaidDiagram(): string {
    let diagram = `graph TD\n`;
    
    this.dependencies.forEach((dep, index) => {
      const fromNode = dep.from.replace(/[^a-zA-Z0-9]/g, '_');
      const toNode = dep.to.replace(/[^a-zA-Z0-9]/g, '_');
      
      switch (dep.type) {
        case 'import':
          diagram += `    ${fromNode} --> ${toNode}\n`;
          break;
        case 'extends':
          diagram += `    ${fromNode} -.-> ${toNode}\n`;
          break;
        case 'implements':
          diagram += `    ${fromNode} ==> ${toNode}\n`;
          break;
        case 'uses':
          diagram += `    ${fromNode} --> ${toNode}\n`;
          break;
      }
    });
    
    return diagram;
  }
  
  getImpactAnalysis(component: string): string[] {
    // Find all components that depend on the given component
    const impacted = new Set<string>();
    
    this.dependencies.forEach(dep => {
      if (dep.to.includes(component)) {
        impacted.add(dep.from);
      }
    });
    
    return Array.from(impacted);
  }
}
```

## Step 4: Create Development Scripts

### 4.1 Setup Script

Create a new file: `/supabase/functions/_shared/scripts/setup-phase1.sh`

```bash
#!/bin/bash

# Phase 1 Setup Script

echo "Setting up Phase 1: Preparation & Analysis"
echo "========================================="

# Create necessary directories
echo "Creating directories..."
mkdir -p supabase/functions/_shared/types
mkdir -p supabase/functions/_shared/test
mkdir -p supabase/functions/_shared/scripts
mkdir -p docs

# Set up environment variables
echo "Setting up environment variables..."
echo "USE_ENHANCED_AGENTS=false" >> .env.local
echo "ENABLE_PARALLEL_TESTING=true" >> .env.local

# Run usage scanner
echo "Scanning current usage patterns..."
deno run --allow-read --allow-write supabase/functions/_shared/scripts/scan-usage.ts

# Generate dependency map
echo "Generating dependency map..."
deno run --allow-read supabase/functions/_shared/scripts/dependency-map.ts > docs/dependency-map.md

# Run initial tests
echo "Running baseline tests..."
deno test --allow-all supabase/functions/_shared/test/

echo "Phase 1 setup complete!"
echo "Next steps:"
echo "1. Review usage patterns in docs/usage-patterns.md"
echo "2. Review dependency map in docs/dependency-map.md"
echo "3. Run parallel tests with: npm run test:parallel"
```

### 4.2 Monitoring Script

Create a new file: `/supabase/functions/_shared/scripts/monitor-migration.ts`

```typescript
// Monitor migration progress and compatibility

export class MigrationMonitor {
  private metrics: Map<string, any> = new Map();
  
  recordMetric(name: string, value: any): void {
    this.metrics.set(name, value);
  }
  
  async checkCompatibility(): Promise<boolean> {
    // Check if legacy and new systems can coexist
    try {
      // Test legacy system
      const legacyWorks = await this.testLegacySystem();
      this.recordMetric('legacy_system_status', legacyWorks);
      
      // Test compatibility layer
      const compatibilityWorks = await this.testCompatibilityLayer();
      this.recordMetric('compatibility_layer_status', compatibilityWorks);
      
      return legacyWorks && compatibilityWorks;
    } catch (error) {
      this.recordMetric('compatibility_error', error.message);
      return false;
    }
  }
  
  private async testLegacySystem(): Promise<boolean> {
    // Test legacy agent/tool system
    try {
      const { GoogleWebSearchTool } = await import("../tools/GoogleWebSearchTool.ts");
      const tool = new GoogleWebSearchTool();
      const result = await tool.execute("test query");
      return result !== undefined;
    } catch {
      return false;
    }
  }
  
  private async testCompatibilityLayer(): Promise<boolean> {
    // Test compatibility adapters
    try {
      const { LegacyToolAdapter } = await import("../types/compatibility.ts");
      const { GoogleWebSearchTool } = await import("../tools/GoogleWebSearchTool.ts");
      
      const legacyTool = new GoogleWebSearchTool();
      const adapter = new LegacyToolAdapter(legacyTool);
      
      const result = await adapter.execute({ input: "test" });
      return result.success !== undefined;
    } catch {
      return false;
    }
  }
  
  generateStatusReport(): string {
    let report = `Migration Status Report\n`;
    report += `=====================\n\n`;
    report += `Timestamp: ${new Date().toISOString()}\n\n`;
    
    this.metrics.forEach((value, key) => {
      report += `${key}: ${JSON.stringify(value)}\n`;
    });
    
    return report;
  }
}

// Run monitor
if (import.meta.main) {
  const monitor = new MigrationMonitor();
  const compatible = await monitor.checkCompatibility();
  
  console.log("Compatibility check:", compatible ? "PASSED" : "FAILED");
  console.log(monitor.generateStatusReport());
}
```

## Step 5: Create Test Data

### 5.1 Test Data Generator

Create a new file: `/supabase/functions/_shared/test/test-data.ts`

```typescript
// Test data for migration testing

export const testPrompts = {
  compensation: [
    {
      content: "Software Engineer in San Francisco with 5 years experience",
      expectedRange: { min: 150000, max: 250000 }
    },
    {
      content: "Senior Data Scientist in New York, PhD required",
      expectedRange: { min: 180000, max: 300000 }
    }
  ],
  
  search: [
    {
      query: "AWS Architect with Python experience",
      expectedKeywords: ["AWS", "Python", "Architect", "Cloud"]
    },
    {
      query: "Frontend Developer React TypeScript remote",
      expectedKeywords: ["Frontend", "React", "TypeScript", "remote"]
    }
  ],
  
  enrichment: [
    {
      linkedinUrl: "https://linkedin.com/in/example",
      expectedFields: ["email", "phone", "skills"]
    }
  ]
};

export const performanceBaselines = {
  agentExecution: {
    p50: 1000, // milliseconds
    p95: 3000,
    p99: 5000
  },
  toolExecution: {
    p50: 500,
    p95: 1500,
    p99: 2500
  }
};
```

## Deliverables Checklist

- [ ] Compatibility layer implementation
  - [ ] LegacyToolAdapter class
  - [ ] NewToolAdapter class
  - [ ] Agent compatibility factory
  
- [ ] Test infrastructure
  - [ ] Test utilities and fixtures
  - [ ] Parallel testing framework
  - [ ] Test data generators
  
- [ ] Documentation
  - [ ] Usage patterns report
  - [ ] Dependency map
  - [ ] Critical paths identification
  
- [ ] Scripts and automation
  - [ ] Setup script
  - [ ] Monitoring script
  - [ ] Usage scanner
  
- [ ] Verification
  - [ ] All tests passing
  - [ ] Compatibility confirmed
  - [ ] No breaking changes

## Next Steps

1. Run the setup script: `./supabase/functions/_shared/scripts/setup-phase1.sh`
2. Review generated documentation
3. Run compatibility tests
4. Begin Phase 2 implementation

---

*Phase 1 Implementation Guide v1.0*
*Part of the Agentic Orchestration Migration Plan*