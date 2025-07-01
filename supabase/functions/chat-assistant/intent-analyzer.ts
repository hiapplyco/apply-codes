import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
import { IntentAnalysis } from "./types.ts";

export class IntentAnalyzer {
  private model: any;
  private toolDescriptions: string;

  constructor(genAI: GoogleGenerativeAI, toolDescriptions: string) {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.toolDescriptions = toolDescriptions;
  }

  async analyzeIntent(message: string, history: any[]): Promise<IntentAnalysis> {
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

  async generateContextualResponse(
    message: string,
    intentAnalysis: IntentAnalysis,
    toolResults: any[],
    history: any[]
  ): Promise<string> {
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