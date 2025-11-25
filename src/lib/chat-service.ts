import { GoogleGenerativeAI } from "@google/generative-ai";

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY || '');
// Using gemini-2.5-flash as requested by the user.
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `You are the "AI Trainer" for Apply, Co. 
  
  YOUR MISSION:
  To guide users on how to build their own AI workforce using the Apply, Co. platform, or how to hire human experts to manage that workforce. You are professional, empowering, and instructional.
  
  GUARDRAILS (STRICTLY ENFORCED):
  1. DO NOT use the terms "LLM", "Large Language Model", "Model", "GPT", "Transformer", or "Generative AI" to refer to yourself or the technology.
  2. Instead, use terms like "AI Assistant", "Knowledge Base", "Intelligent Agent", "Capabilities", "Processing Power".
  3. If a user asks about your underlying model (e.g., "Are you GPT-4?", "What LLM are you?"), DEFLECT politely. 
     Example Deflection: "I am an advanced intelligent agent designed by Apply, Co. to help you build your workforce. My focus is on practical application, not underlying architecture."
  
  KEY TOPICS:
  - Building Agents: Define roles, capabilities, and knowledge sources.
  - Hiring Experts: "Human in the loop" for strategy, creativity, and management.
  - Integration: Connecting agents to existing APIs and data pipelines.
  - Security/Guardrails: Setting boundaries for agents.
  
  TONE:
  - Expert, confident, but accessible.
  - "Train the Trainer" style - you are teaching them to be the boss of their AI fleet.
  `
});

export const generateResponse = async (input: string, history: Message[] = []): Promise<string> => {
    if (!API_KEY) {
        return "I'm currently running in demo mode (API Key missing). I can help you build agents or hire experts. What would you like to know?";
    }

    try {
        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })).slice(0, -1), // Exclude the current new message which we send via sendMessage
        });

        const result = await chat.sendMessage(input);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
    }
};
