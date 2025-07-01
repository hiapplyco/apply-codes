/**
 * Example usage and test cases for the tool-aware chat assistant
 */

export const exampleConversations = [
  {
    title: "Boolean Search Generation",
    messages: [
      {
        role: "user",
        content: "I need to find senior React developers with TypeScript experience in the Bay Area"
      },
      {
        expectedIntent: "generate_boolean_search",
        expectedTools: ["generate_boolean_search"],
        expectedParameters: {
          generate_boolean_search: {
            requirements: "senior React developers with TypeScript experience in the Bay Area",
            searchType: "linkedin"
          }
        }
      }
    ]
  },
  {
    title: "Job Description Enhancement",
    messages: [
      {
        role: "user",
        content: "Can you help me improve this job description? We're looking for a Product Manager with 5+ years experience in SaaS products."
      },
      {
        expectedIntent: "enhance_job_description",
        expectedTools: ["enhance_job_description"],
        expectedParameters: {
          enhance_job_description: {
            content: "We're looking for a Product Manager with 5+ years experience in SaaS products."
          }
        }
      }
    ]
  },
  {
    title: "Compensation Analysis",
    messages: [
      {
        role: "user",
        content: "What's the typical salary range for a Senior Software Engineer in Seattle?"
      },
      {
        expectedIntent: "analyze_compensation",
        expectedTools: ["analyze_compensation"],
        expectedParameters: {
          analyze_compensation: {
            content: "Senior Software Engineer in Seattle"
          }
        }
      }
    ]
  },
  {
    title: "Boolean Search Explanation",
    messages: [
      {
        role: "user",
        content: "What does this boolean search do: (React OR \"React.js\") AND (TypeScript OR \"Type Script\") AND (Senior OR Staff OR Principal)"
      },
      {
        expectedIntent: "explain_boolean_search",
        expectedTools: ["explain_boolean_search"],
        expectedParameters: {
          explain_boolean_search: {
            booleanString: "(React OR \"React.js\") AND (TypeScript OR \"Type Script\") AND (Senior OR Staff OR Principal)"
          }
        }
      }
    ]
  },
  {
    title: "Multi-Tool Workflow",
    messages: [
      {
        role: "user",
        content: "I need to hire a DevOps engineer. Can you help me create a job description and then generate a boolean search for finding candidates?"
      },
      {
        expectedIntent: "multi_tool_recruitment_workflow",
        expectedTools: ["enhance_job_description", "generate_boolean_search"],
        expectedParameters: {
          enhance_job_description: {
            content: "DevOps engineer"
          },
          generate_boolean_search: {
            requirements: "DevOps engineer"
          }
        }
      }
    ]
  },
  {
    title: "Profile Enrichment",
    messages: [
      {
        role: "user",
        content: "Can you find more information about this candidate? Their LinkedIn is linkedin.com/in/johndoe"
      },
      {
        expectedIntent: "enrich_profile",
        expectedTools: ["enrich_profile"],
        expectedParameters: {
          enrich_profile: {
            profileUrl: "linkedin.com/in/johndoe"
          }
        }
      }
    ]
  },
  {
    title: "General Conversation",
    messages: [
      {
        role: "user",
        content: "What are some best practices for technical interviews?"
      },
      {
        expectedIntent: "general_recruitment_advice",
        expectedTools: [],
        expectedParameters: {}
      }
    ]
  }
];

export const testChatRequest = {
  message: "I need to find React developers with 5+ years of experience",
  systemPrompt: "You are a helpful recruitment assistant",
  history: [
    {
      role: "user" as const,
      content: "I'm looking to expand my engineering team"
    },
    {
      role: "assistant" as const,
      content: "I'd be happy to help you expand your engineering team. What specific roles are you looking to fill?"
    }
  ],
  sessionId: 123,
  userId: "test-user-id",
  projectId: "test-project-id"
};

export const expectedChatResponse = {
  response: "I'll help you find React developers with 5+ years of experience. I've generated a boolean search string that will help you find qualified candidates on LinkedIn.\n\nThe search will look for:\n- React developers with various spellings (React, React.js, ReactJS)\n- Senior-level positions (Senior, Lead, Staff, Principal)\n- Minimum 5 years of experience\n\nYou can use this search string directly in LinkedIn's search bar or modify it based on additional requirements like location or specific industries.",
  toolCalls: [
    {
      tool: "generate_boolean_search",
      parameters: {
        requirements: "React developers with 5+ years of experience",
        searchType: "linkedin"
      },
      result: {
        success: true,
        searchString: "(React OR \"React.js\" OR ReactJS) AND (Senior OR Lead OR Staff OR Principal) AND (\"5+ years\" OR \"5 years\" OR \"6 years\" OR \"7 years\" OR \"8 years\" OR \"9 years\" OR \"10+ years\")"
      }
    }
  ],
  metadata: {
    model: "gemini-2.5-flash",
    timestamp: "2025-01-29T12:00:00Z",
    intentAnalysis: {
      intent: "find_candidates_with_boolean_search",
      confidence: 0.95,
      suggestedTools: ["generate_boolean_search"],
      parameters: {
        generate_boolean_search: {
          requirements: "React developers with 5+ years of experience",
          searchType: "linkedin"
        }
      },
      reasoning: "User wants to find React developers with specific experience requirements. This is a perfect use case for generating a boolean search string."
    },
    agentOutputId: 12345
  }
};

// Example of how to use the chat assistant from a client
export const clientExample = `
// Frontend usage example
const response = await fetch('/functions/v1/chat-assistant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${supabaseAnonKey}\`
  },
  body: JSON.stringify({
    message: "Find me senior Python developers who know Django",
    systemPrompt: "You are an expert recruitment assistant",
    history: conversationHistory,
    sessionId: currentSessionId,
    userId: currentUser.id,
    projectId: currentProject?.id
  })
});

const data = await response.json();

// Handle the response
if (data.toolCalls) {
  // Tools were used, show the results
  data.toolCalls.forEach(toolCall => {
    console.log(\`Tool \${toolCall.tool} returned:\`, toolCall.result);
  });
}

// Display the assistant's response
console.log(data.response);

// Store the agent output ID for future reference
if (data.metadata.agentOutputId) {
  console.log(\`Agent output saved with ID: \${data.metadata.agentOutputId}\`);
}
`;