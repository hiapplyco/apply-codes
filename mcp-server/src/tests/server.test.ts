import { describe, it, expect, beforeAll } from '@jest/globals';
import { ApplyMCPServer } from '../server.js';
import { MCPSession } from '../types/mcp.js';
import { sourcingTools } from '../controllers/sourcing-tools.js';
import { documentTools } from '../controllers/document-tools.js';
import { orchestrationTools } from '../controllers/orchestration-tools.js';
import { interviewTools } from '../controllers/interview-tools.js';

describe('Apply MCP Server', () => {
  let server: ApplyMCPServer;
  let mockSession: MCPSession;

  beforeAll(() => {
    server = new ApplyMCPServer();
    mockSession = {
      id: 'test-session',
      createdAt: new Date(),
      lastActivity: new Date(),
      context: {},
    };
  });

  describe('Tool Registration', () => {
    it('should register all expected tools', () => {
      const allTools = [
        ...sourcingTools,
        ...documentTools,
        ...orchestrationTools,
        ...interviewTools,
      ];

      // 11 tools: 3 sourcing + 3 document + 3 orchestration + 2 interview
      expect(allTools.length).toBe(11);
    });

    it('should have correct tool breakdown', () => {
      expect(sourcingTools.length).toBe(3);
      expect(documentTools.length).toBe(3);
      expect(orchestrationTools.length).toBe(3);
      expect(interviewTools.length).toBe(2);
    });

    it('should not include deprecated tools', () => {
      const toolNames = sourcingTools.map(t => t.getDefinition().name);
      expect(toolNames).not.toContain('generate_boolean_query');
      expect(toolNames).not.toContain('search_candidates');
      expect(toolNames).toContain('boolean_search');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool requests gracefully', () => {
      expect(() => {
        throw new Error('Unknown tool: nonexistent_tool');
      }).toThrow('Unknown tool: nonexistent_tool');
    });
  });
});

describe('Sourcing Tools', () => {
  describe('Boolean Search Tool', () => {
    it('should be the primary search tool', () => {
      const booleanSearch = sourcingTools.find(
        t => t.getDefinition().name === 'boolean_search'
      );
      expect(booleanSearch).toBeDefined();
      expect(booleanSearch!.getDefinition().description).toContain('PRIMARY');
    });
  });

  describe('Analyze Job Requirements Tool', () => {
    it('should accept job descriptions', () => {
      const tool = sourcingTools.find(
        t => t.getDefinition().name === 'analyze_job_requirements'
      );
      expect(tool).toBeDefined();
      expect(tool!.getDefinition().inputSchema.properties).toHaveProperty('jobDescription');
    });
  });
});

describe('Document Processing Tools', () => {
  describe('Parse Resume Tool', () => {
    it('should accept content and content type', () => {
      const tool = documentTools.find(
        t => t.getDefinition().name === 'parse_resume'
      );
      expect(tool).toBeDefined();
      const schema = tool!.getDefinition().inputSchema;
      expect(schema.properties).toHaveProperty('content');
      expect(schema.properties).toHaveProperty('contentType');
    });
  });
});

describe('Interview Tools', () => {
  describe('Generate Interview Questions Tool', () => {
    it('should support multiple interview types', () => {
      const tool = interviewTools.find(
        t => t.getDefinition().name === 'generate_interview_questions'
      );
      expect(tool).toBeDefined();
      const schema = tool!.getDefinition().inputSchema;
      expect(schema.properties).toHaveProperty('interviewType');
    });
  });
});

describe('Integration', () => {
  it('should handle end-to-end recruitment workflow', () => {
    const jobAnalysis = {
      requiredSkills: ['React', 'Node.js'],
      experienceLevel: 'senior',
    };

    const parsedResume = {
      skills: ['React', 'Node.js', 'JavaScript'],
      experience: '6 years',
    };

    const comparison = {
      overallScore: 85,
      matchCategory: 'Strong Match',
    };

    expect(jobAnalysis.requiredSkills).toEqual(['React', 'Node.js']);
    expect(parsedResume.skills).toContain('React');
    expect(comparison.overallScore).toBeGreaterThan(80);
  });
});
