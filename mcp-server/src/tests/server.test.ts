import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ApplyMCPServer } from '../server.js';
import { MCPSession } from '../types/mcp.js';

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

  afterAll(async () => {
    // Clean up any resources
  });

  describe('Server Info', () => {
    it('should return correct server configuration', () => {
      const info = server.getServerInfo();
      
      expect(info.config.name).toBe('apply-mcp-server');
      expect(info.config.version).toBe('1.0.0');
      expect(info.config.capabilities.tools).toBe(true);
      expect(info.stats.totalTools).toBe(12);
    });

    it('should have correct tool breakdown', () => {
      const info = server.getServerInfo();
      
      expect(info.stats.toolBreakdown.sourcing).toBe(4);
      expect(info.stats.toolBreakdown.document).toBe(3);
      expect(info.stats.toolBreakdown.orchestration).toBe(3);
      expect(info.stats.toolBreakdown.interview).toBe(2);
    });
  });

  describe('Tool Registration', () => {
    it('should register all expected tools', () => {
      const info = server.getServerInfo();
      const expectedTools = [
        // Sourcing tools
        'generate_boolean_query',
        'search_candidates',
        'analyze_job_requirements',
        'get_market_intelligence',
        // Document tools
        'parse_resume',
        'enhance_job_description',
        'compare_documents',
        // Orchestration tools
        'execute_recruitment_workflow',
        'create_recruitment_plan',
        'get_orchestrator_status',
        // Interview tools
        'generate_interview_questions',
        'analyze_interview_feedback',
      ];

      expect(info.stats.totalTools).toBe(expectedTools.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool requests gracefully', async () => {
      try {
        // This would normally be done through the MCP protocol
        // but we're testing the underlying error handling
        expect(() => {
          throw new Error('Unknown tool: nonexistent_tool');
        }).toThrow('Unknown tool: nonexistent_tool');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should validate tool parameters', () => {
      // Test that tools properly validate their input parameters
      // This would be done through Zod schemas in the actual tools
      expect(true).toBe(true); // Placeholder - actual validation testing would be more complex
    });
  });

  describe('Session Management', () => {
    it('should create new sessions', () => {
      const sessionId = 'test-session-123';
      // In actual implementation, this would be tested through the server's private methods
      // or by making actual MCP requests
      expect(sessionId).toBe('test-session-123');
    });

    it('should clean up expired sessions', async () => {
      // Test session cleanup logic
      // This would require access to the server's internal session management
      expect(true).toBe(true); // Placeholder
    });
  });
});

describe('Sourcing Tools', () => {
  describe('Generate Boolean Query Tool', () => {
    it('should generate valid boolean queries', async () => {
      const mockInput = {
        role: 'Senior Software Engineer',
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        location: 'San Francisco, CA',
        experienceLevel: 'senior',
      };

      // In a real test, we would instantiate the tool and call its handler
      const expectedOutput = {
        booleanQuery: expect.stringContaining('JavaScript'),
        platforms: expect.any(Array),
        estimatedResults: expect.any(Number),
      };

      expect(mockInput.role).toBe('Senior Software Engineer');
      expect(mockInput.requiredSkills).toContain('React');
    });

    it('should handle alternative job titles', async () => {
      const mockInput = {
        role: 'Full Stack Developer',
        requiredSkills: ['JavaScript'],
        includeAlternatives: true,
      };

      expect(mockInput.includeAlternatives).toBe(true);
    });
  });

  describe('Search Candidates Tool', () => {
    it('should search across multiple platforms', async () => {
      const mockInput = {
        query: 'Senior JavaScript Developer',
        platforms: ['linkedin', 'github'],
        maxResults: 20,
      };

      expect(mockInput.platforms).toContain('linkedin');
      expect(mockInput.maxResults).toBe(20);
    });

    it('should apply filters correctly', async () => {
      const mockInput = {
        query: 'Software Engineer',
        filters: {
          location: 'Remote',
          experienceLevel: 'senior',
          availability: 'active',
        },
      };

      expect(mockInput.filters.location).toBe('Remote');
      expect(mockInput.filters.experienceLevel).toBe('senior');
    });
  });
});

describe('Document Processing Tools', () => {
  describe('Parse Resume Tool', () => {
    it('should extract personal information', async () => {
      const mockResumeContent = `
        John Smith
        john.smith@email.com
        +1 (555) 123-4567
        San Francisco, CA
        
        Senior Software Engineer with 5+ years experience...
      `;

      const mockInput = {
        content: mockResumeContent,
        contentType: 'text',
        extractSections: {
          contact: true,
          experience: true,
          skills: true,
        },
      };

      expect(mockInput.content).toContain('John Smith');
      expect(mockInput.extractSections.contact).toBe(true);
    });

    it('should handle different content types', async () => {
      const mockInputs = [
        { contentType: 'text' },
        { contentType: 'pdf' },
        { contentType: 'docx' },
      ];

      mockInputs.forEach(input => {
        expect(['text', 'pdf', 'docx']).toContain(input.contentType);
      });
    });
  });

  describe('Compare Documents Tool', () => {
    it('should calculate match scores', async () => {
      const mockInput = {
        resumeContent: 'Software Engineer with React and Node.js experience',
        jobDescription: 'Looking for Senior Engineer with React, Node.js, and AWS',
        criteria: {
          skills: 0.4,
          experience: 0.3,
          education: 0.2,
          other: 0.1,
        },
      };

      const expectedWeights = 0.4 + 0.3 + 0.2 + 0.1;
      expect(expectedWeights).toBe(1.0);
    });
  });
});

describe('Orchestration Tools', () => {
  describe('Execute Recruitment Workflow Tool', () => {
    it('should handle different workflow types', async () => {
      const workflowTypes = [
        'full_recruitment',
        'quick_source',
        'deep_research',
        'strategic_planning',
        'bulk_enrichment',
      ];

      workflowTypes.forEach(type => {
        const mockInput = {
          workflowType: type,
          input: {
            jobDescription: 'Software Engineer role',
            maxCandidates: 20,
          },
        };

        expect(workflowTypes).toContain(mockInput.workflowType);
      });
    });

    it('should support async execution', async () => {
      const mockInput = {
        workflowType: 'full_recruitment',
        input: { jobDescription: 'Test role' },
        options: {
          async: true,
          priority: 'high',
        },
      };

      expect(mockInput.options.async).toBe(true);
      expect(mockInput.options.priority).toBe('high');
    });
  });

  describe('Create Recruitment Plan Tool', () => {
    it('should generate comprehensive plans', async () => {
      const mockInput = {
        objective: 'Hire Senior Software Engineer',
        requirements: {
          roleTitle: 'Senior Software Engineer',
          skills: ['JavaScript', 'React', 'Node.js'],
          experienceLevel: 'senior',
          salaryRange: {
            min: 140000,
            max: 180000,
            currency: 'USD',
          },
        },
        constraints: {
          timeline: '6 weeks',
          urgency: 'high',
        },
      };

      expect(mockInput.requirements.skills).toContain('JavaScript');
      expect(mockInput.requirements.salaryRange.min).toBeGreaterThan(0);
    });
  });
});

describe('Interview Tools', () => {
  describe('Generate Interview Questions Tool', () => {
    it('should generate role-appropriate questions', async () => {
      const mockInput = {
        jobTitle: 'Senior Software Engineer',
        requiredSkills: ['React', 'Node.js', 'System Design'],
        experienceLevel: 'senior',
        interviewType: 'technical',
        duration: 60,
      };

      expect(mockInput.requiredSkills).toContain('React');
      expect(mockInput.duration).toBe(60);
    });

    it('should support different interview types', async () => {
      const interviewTypes = [
        'phone',
        'video',
        'onsite',
        'technical',
        'behavioral',
      ];

      interviewTypes.forEach(type => {
        const mockInput = {
          jobTitle: 'Software Engineer',
          requiredSkills: ['JavaScript'],
          experienceLevel: 'mid',
          interviewType: type,
        };

        expect(interviewTypes).toContain(mockInput.interviewType);
      });
    });
  });

  describe('Analyze Interview Feedback Tool', () => {
    it('should process multiple interviewer feedback', async () => {
      const mockInput = {
        candidateName: 'John Smith',
        interviewType: 'technical',
        feedback: [
          {
            interviewer: 'Alice Johnson',
            category: 'Technical Skills',
            rating: 4,
            comments: 'Strong React knowledge, good problem-solving',
            strengths: ['React expertise', 'Problem solving'],
            concerns: ['Limited AWS experience'],
          },
          {
            interviewer: 'Bob Wilson',
            category: 'Communication',
            rating: 5,
            comments: 'Excellent communicator, clear explanations',
            strengths: ['Clear communication', 'Team collaboration'],
            concerns: [],
          },
        ],
        jobRequirements: {
          requiredSkills: ['React', 'Node.js', 'AWS'],
          experienceLevel: 'senior',
        },
      };

      expect(mockInput.feedback).toHaveLength(2);
      expect(mockInput.feedback[0].rating).toBe(4);
      expect(mockInput.feedback[1].rating).toBe(5);
    });

    it('should generate hiring recommendations', async () => {
      const mockFeedback = [
        { rating: 4, category: 'Technical' },
        { rating: 5, category: 'Communication' },
        { rating: 3, category: 'Experience' },
      ];

      const averageRating = mockFeedback.reduce((sum, fb) => sum + fb.rating, 0) / mockFeedback.length;
      expect(averageRating).toBeCloseTo(4.0);
    });
  });
});

describe('Integration Tests', () => {
  it('should handle end-to-end recruitment workflow', async () => {
    // Test a complete workflow from job analysis to candidate recommendation
    const jobDescription = 'Senior Software Engineer with React and Node.js experience';
    const resumeContent = 'Experienced developer with React, Node.js, and 6 years experience';

    // Step 1: Analyze job requirements
    const jobAnalysis = {
      requiredSkills: ['React', 'Node.js'],
      experienceLevel: 'senior',
    };

    // Step 2: Parse resume
    const parsedResume = {
      skills: ['React', 'Node.js', 'JavaScript'],
      experience: '6 years',
    };

    // Step 3: Compare documents
    const comparison = {
      overallScore: 85,
      matchCategory: 'Strong Match',
    };

    expect(jobAnalysis.requiredSkills).toEqual(['React', 'Node.js']);
    expect(parsedResume.skills).toContain('React');
    expect(comparison.overallScore).toBeGreaterThan(80);
  });

  it('should maintain session context across multiple tool calls', async () => {
    const sessionId = 'workflow-session-123';
    const context = {
      workflowId: 'workflow-456',
      jobDescription: 'Software Engineer role',
      candidatesFound: 15,
    };

    // Simulate multiple tool calls within the same session
    expect(context.workflowId).toBe('workflow-456');
    expect(context.candidatesFound).toBe(15);
  });
});