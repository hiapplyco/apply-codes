const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Tool interface
class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaultTools();
  }

  registerDefaultTools() {
    // Boolean Search Generation Tool
    this.register({
      name: 'generate_boolean_search',
      description: 'Generate a boolean search string for finding candidates',
      execute: async (params) => {
        // Call Firebase Cloud Function instead
        const response = await fetch(`${process.env.FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/apply-codes-prod/us-central1'}/process-job-requirements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: params.requirements,
            searchType: params.searchType,
            companyName: params.companyName,
          }),
        });

        if (!response.ok) {
          throw new Error(`Boolean search generation failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });

    // Boolean Search Explanation Tool
    this.register({
      name: 'explain_boolean_search',
      description: 'Explain what a boolean search string does',
      execute: async (params) => {
        const response = await fetch(`${process.env.FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/apply-codes-prod/us-central1'}/explain-boolean`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booleanString: params.booleanString,
            requirements: params.requirements,
          }),
        });

        if (!response.ok) {
          throw new Error(`Boolean explanation failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });

    // Job Description Enhancement Tool
    this.register({
      name: 'enhance_job_description',
      description: 'Enhance and improve a job description',
      execute: async (params) => {
        const response = await fetch(`${process.env.FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/apply-codes-prod/us-central1'}/enhance-job-description`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: params.content,
          }),
        });

        if (!response.ok) {
          throw new Error(`Job description enhancement failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });

    // Compensation Analysis Tool
    this.register({
      name: 'analyze_compensation',
      description: 'Analyze compensation data for a role',
      execute: async (params) => {
        const response = await fetch(`${process.env.FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/apply-codes-prod/us-central1'}/analyze-compensation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: params.content,
          }),
        });

        if (!response.ok) {
          throw new Error(`Compensation analysis failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });

    // Profile Enrichment Tool
    this.register({
      name: 'enrich_profile',
      description: 'Enrich a candidate profile with additional information',
      execute: async (params) => {
        const response = await fetch(`${process.env.FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/apply-codes-prod/us-central1'}/enrich-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error(`Profile enrichment failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });

    // Contact Search Tool
    this.register({
      name: 'search_contacts',
      description: 'Search for contact information',
      execute: async (params) => {
        const response = await fetch(`${process.env.FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/apply-codes-prod/us-central1'}/search-contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: params.query,
            filters: params.filters,
          }),
        });

        if (!response.ok) {
          throw new Error(`Contact search failed: ${response.statusText}`);
        }

        return await response.json();
      }
    });
  }

  register(tool) {
    this.tools.set(tool.name, tool);
  }

  get(name) {
    return this.tools.get(name);
  }

  list() {
    return Array.from(this.tools.values());
  }

  getDescriptions() {
    return this.list()
      .map(tool => `- ${tool.name}: ${tool.description}`)
      .join('\n');
  }
}

// Intent Analyzer class
class IntentAnalyzer {
  constructor(genAI, toolDescriptions) {
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    this.toolDescriptions = toolDescriptions;
  }

  async analyzeIntent(message, history) {
    const prompt = `You are an AI assistant specialized in recruitment and talent acquisition. Analyze the user's message and determine their intent.

Available tools:
${this.toolDescriptions}

Recent conversation history:
${history.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's current message: "${message}"

Analyze this message using Chain of Thought reasoning:

1. **Understanding**: What is the user asking for or trying to accomplish?
2. **Context**: What relevant information is in the conversation history?
3. **Tool Selection**: Which tools (if any) would help fulfill this request?
4. **Parameters**: What parameters would these tools need?
5. **Confidence**: How confident are you in this interpretation?

Provide your analysis in this JSON format:
{
  "intent": "brief description of user intent",
  "confidence": 0.0-1.0,
  "suggestedTools": ["tool_name1", "tool_name2"],
  "parameters": {
    "tool_name1": { "param1": "value1" },
    "tool_name2": { "param1": "value1" }
  },
  "reasoning": "Step-by-step reasoning for this analysis"
}

Consider these common intents:
- Generating boolean searches for candidates
- Enhancing job descriptions
- Analyzing compensation data
- Enriching candidate profiles
- Searching for contacts
- Explaining boolean search strings
- General recruitment advice or questions

If no tools are needed (just conversation), return empty arrays/objects for tools and parameters.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in intent analysis');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate and sanitize the analysis
      return {
        intent: analysis.intent || 'general_conversation',
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        suggestedTools: Array.isArray(analysis.suggestedTools) ? analysis.suggestedTools : [],
        parameters: analysis.parameters || {},
        reasoning: analysis.reasoning || 'No reasoning provided'
      };
    } catch (error) {
      console.error('Intent analysis error:', error);

      // Fallback analysis
      return {
        intent: 'general_conversation',
        confidence: 0.3,
        suggestedTools: [],
        parameters: {},
        reasoning: 'Failed to analyze intent, treating as general conversation'
      };
    }
  }

  async generateContextualResponse(message, intentAnalysis, toolResults, history) {
    const toolResultsText = toolResults.length > 0
      ? `\n\nTool Results:\n${toolResults.map(tr =>
          `Tool: ${tr.tool}\nResult: ${JSON.stringify(tr.result, null, 2)}`
        ).join('\n\n')}`
      : '';

    const prompt = `You are an expert recruitment AI assistant. Generate a helpful response based on the user's message and any tool results.

User Intent: ${intentAnalysis.intent}
User Message: "${message}"

Recent Conversation:
${history.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
${toolResultsText}

Guidelines:
- Be conversational and helpful
- If tools were used, explain the results clearly
- Format responses with markdown for readability
- Include specific examples when relevant
- Suggest next steps when appropriate
- Keep responses concise but comprehensive

Generate a response that directly addresses the user's needs:`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}

// Storage Manager class
class StorageManager {
  constructor() {
    this.db = admin.firestore();
  }

  async saveAgentOutput(data) {
    try {
      // First, ensure we have a job record or create a placeholder
      let jobId = null;

      // If we have context about a job, try to find or create it
      if (data.intent.parameters.requirements || data.intent.parameters.content) {
        const content = data.intent.parameters.requirements || data.intent.parameters.content || '';
        
        const jobRef = this.db.collection('jobs').doc();
        await jobRef.set({
          userId: data.userId,
          content: content,
          source: 'chat_assistant',
          searchString: data.toolCalls.find(tc => tc.tool === 'generate_boolean_search')?.result?.searchString || '',
          projectId: data.projectId,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        jobId = jobRef.id;
      }

      // Structure the output data
      const outputData = {
        intent: data.intent,
        toolCalls: data.toolCalls,
        response: data.response,
        metadata: {
          ...data.metadata,
          sessionId: data.sessionId,
          projectId: data.projectId,
          timestamp: new Date().toISOString()
        }
      };

      // Store in agent_outputs collection
      const agentOutputRef = this.db.collection('agentOutputs').doc();
      await agentOutputRef.set({
        jobId: jobId,
        agentType: data.agentType,
        outputData: outputData,
        projectId: data.projectId,
        // Map specific tool results to fields if applicable
        compensationAnalysis: data.toolCalls.find(tc => tc.tool === 'analyze_compensation')?.result?.analysis || null,
        enhancedDescription: data.toolCalls.find(tc => tc.tool === 'enhance_job_description')?.result?.enhancedDescription || null,
        jobSummary: data.toolCalls.find(tc => tc.tool === 'summarize_job')?.result?.summary || null,
        terms: data.toolCalls.find(tc => tc.tool === 'extract_nlp_terms')?.result?.terms || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return agentOutputRef.id;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  }

  async saveChatMessage(data) {
    try {
      await this.db.collection('chatMessages').add({
        sessionId: data.sessionId,
        role: data.role,
        content: data.content,
        metadata: data.metadata,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Chat message storage error:', error);
    }
  }

  async getSessionContext(sessionId) {
    try {
      // Get recent messages
      const messagesSnapshot = await this.db.collection('chatMessages')
        .where('sessionId', '==', sessionId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();

      // Get session info
      let session = null;
      try {
        const sessionDoc = await this.db.collection('chatSessions').doc(sessionId).get();
        if (sessionDoc.exists) {
          session = { id: sessionDoc.id, ...sessionDoc.data() };
        }
      } catch (sessionError) {
        console.warn('Session not found:', sessionError);
      }

      // Get related agent outputs if any
      let agentOutputs = [];
      if (session?.projectId) {
        const agentOutputsSnapshot = await this.db.collection('agentOutputs')
          .where('projectId', '==', session.projectId)
          .orderBy('createdAt', 'desc')
          .limit(5)
          .get();
        
        agentOutputs = agentOutputsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      return {
        messages,
        session,
        agentOutputs
      };
    } catch (error) {
      console.error('Error getting session context:', error);
      return { messages: [], session: null, agentOutputs: [] };
    }
  }
}

exports.chatAssistant = functions.https.onRequest(async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  res.set(corsHeaders);

  try {
    const { message, systemPrompt, history, sessionId, userId, projectId } = req.body;

    if (!message) {
      res.status(400).json({
        error: 'Message is required'
      });
      return;
    }

    // Initialize services
    const apiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY or GOOGLE_AI_API_KEY is not configured'
      });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const toolRegistry = new ToolRegistry();
    const intentAnalyzer = new IntentAnalyzer(genAI, toolRegistry.getDescriptions());
    const storage = new StorageManager();

    // Get session context if available
    let sessionContext = { messages: [], session: null, agentOutputs: [] };
    if (sessionId) {
      sessionContext = await storage.getSessionContext(sessionId);
    }

    // Analyze user intent
    console.log('Analyzing user intent...');
    const intentAnalysis = await intentAnalyzer.analyzeIntent(message, history || []);
    console.log('Intent analysis:', intentAnalysis);

    // Execute suggested tools
    const toolCalls = [];

    for (const toolName of intentAnalysis.suggestedTools) {
      const tool = toolRegistry.get(toolName);
      if (!tool) {
        console.warn(`Tool ${toolName} not found`);
        continue;
      }

      const params = intentAnalysis.parameters[toolName] || {};
      console.log(`Executing tool: ${toolName}`, params);

      try {
        const result = await tool.execute(params);
        toolCalls.push({
          tool: toolName,
          parameters: params,
          result
        });
      } catch (error) {
        console.error(`Tool ${toolName} failed:`, error);
        toolCalls.push({
          tool: toolName,
          parameters: params,
          result: { error: error.message }
        });
      }
    }

    // Generate contextual response
    const response = await intentAnalyzer.generateContextualResponse(
      message,
      intentAnalysis,
      toolCalls,
      history || []
    );

    // Save agent output if user is authenticated
    let agentOutputId = null;
    if (userId) {
      agentOutputId = await storage.saveAgentOutput({
        userId,
        sessionId,
        projectId,
        agentType: 'chat_assistant',
        intent: intentAnalysis,
        toolCalls,
        response,
        metadata: {
          systemPrompt,
          model: 'gemini-2.5-flash'
        }
      });
    }

    // Save chat messages if session exists
    if (sessionId) {
      await storage.saveChatMessage({
        sessionId,
        role: 'user',
        content: message,
        metadata: { intentAnalysis }
      });

      await storage.saveChatMessage({
        sessionId,
        role: 'assistant',
        content: response,
        metadata: { toolCalls, agentOutputId }
      });
    }

    // Return the response
    const chatResponse = {
      response,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      metadata: {
        model: "gemini-2.5-flash",
        timestamp: new Date().toISOString(),
        intentAnalysis,
        agentOutputId
      }
    };

    res.status(200).json(chatResponse);

  } catch (error) {
    console.error('Chat assistant error:', error);
    res.status(400).json({
      error: error.message || 'An error occurred processing your request',
    });
  }
});