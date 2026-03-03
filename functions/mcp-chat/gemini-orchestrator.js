'use strict';

const { logger } = require('firebase-functions/v2');
const { getModel } = require('../utils/gemini');
const { loadMCPTools, executeTool } = require('./tool-bundler');
const { StreamEventType, HIGH_IMPACT_TOOLS, MAX_TOOL_CALLS_PER_TURN } = require('./types');

const SYSTEM_PROMPT = `You are the HiApply AI recruitment assistant. You help recruiters find candidates, analyze resumes, create interview plans, and manage recruitment workflows.

You have access to recruitment tools that you should use when the user asks for help with:
- Finding candidates (use boolean_search)
- Analyzing job requirements (use analyze_job_requirements)
- Market research (use get_market_intelligence)
- Resume parsing (use parse_resume)
- Job description enhancement (use enhance_job_description)
- Document comparison (use compare_documents)
- Recruitment planning (use create_recruitment_plan)
- Interview questions (use generate_interview_questions)
- Interview feedback analysis (use analyze_interview_feedback)
- Workflow execution (use execute_workflow)
- System status (use get_system_status)

Always explain what you're doing before calling a tool. After getting results, summarize the key findings in a conversational way.
If a tool returns an error, explain the issue to the user and suggest alternatives.`;

async function orchestrate(message, history, sendEvent, options = {}) {
  const { sessionId, projectId, confirmation } = options;

  const { tools, functionDeclarations } = await loadMCPTools();

  if (confirmation) {
    return handleConfirmation(confirmation, tools, sendEvent);
  }

  const model = getModel(undefined, {
    maxOutputTokens: 4096,
    temperature: 0.7,
  });

  if (!model) {
    sendEvent(StreamEventType.ERROR, { message: 'Gemini API key not configured' });
    return;
  }

  const chatHistory = buildChatHistory(history);

  const chat = model.startChat({
    history: chatHistory,
    tools: [{ functionDeclarations }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
  });

  let toolCallCount = 0;

  sendEvent(StreamEventType.SESSION, {
    session_id: sessionId,
    model: 'gemini-3.1-pro-preview',
  });

  let currentMessage = message;

  while (toolCallCount <= MAX_TOOL_CALLS_PER_TURN) {
    const result = await chat.sendMessageStream(currentMessage);

    let accumulatedText = '';
    let pendingFunctionCalls = [];

    for await (const chunk of result.stream) {
      const candidates = chunk.candidates || [];
      for (const candidate of candidates) {
        for (const part of candidate.content?.parts || []) {
          if (part.text) {
            accumulatedText += part.text;
            sendEvent(StreamEventType.TOKEN, { content: part.text });
          }
          if (part.functionCall) {
            pendingFunctionCalls.push(part.functionCall);
          }
        }
      }
    }

    if (pendingFunctionCalls.length === 0) {
      break;
    }

    const functionResponses = [];

    for (const fc of pendingFunctionCalls) {
      toolCallCount++;
      if (toolCallCount > MAX_TOOL_CALLS_PER_TURN) {
        logger.warn('[orchestrator] Max tool calls exceeded');
        sendEvent(StreamEventType.ERROR, {
          message: 'Maximum tool calls per turn reached',
        });
        break;
      }

      const requiresConfirmation = HIGH_IMPACT_TOOLS.includes(fc.name);

      sendEvent(StreamEventType.TOOL_CALL, {
        tool: { name: fc.name, args: fc.args },
        requiresConfirmation,
      });

      if (requiresConfirmation) {
        const confirmationId = `confirm_${Date.now()}_${fc.name}`;
        sendEvent(StreamEventType.TOOL_RESULT, {
          tool: fc.name,
          result: null,
          status: 'awaiting_confirmation',
        });
        sendEvent(StreamEventType.DONE, {
          pendingConfirmation: {
            confirmationId,
            tool: fc.name,
            args: fc.args,
            description: `Execute ${fc.name} with provided parameters`,
          },
        });
        return;
      }

      sendEvent(StreamEventType.TOOL_PROGRESS, {
        tool: fc.name,
        message: `Executing ${fc.name}...`,
      });

      try {
        const toolResult = await executeTool(tools, fc.name, fc.args);
        const resultText = toolResult.content?.[0]?.text || JSON.stringify(toolResult);

        let parsedResult;
        try {
          parsedResult = JSON.parse(resultText);
        } catch {
          parsedResult = resultText;
        }

        sendEvent(StreamEventType.TOOL_RESULT, {
          tool: fc.name,
          result: parsedResult,
          status: toolResult.isError ? 'error' : 'complete',
        });

        functionResponses.push({
          functionResponse: {
            name: fc.name,
            response: { result: resultText },
          },
        });
      } catch (err) {
        logger.error(`[orchestrator] Tool ${fc.name} failed:`, err);

        sendEvent(StreamEventType.TOOL_RESULT, {
          tool: fc.name,
          result: { error: err.message },
          status: 'error',
        });

        functionResponses.push({
          functionResponse: {
            name: fc.name,
            response: { error: err.message },
          },
        });
      }
    }

    if (functionResponses.length === 0) break;

    currentMessage = functionResponses;
  }

  sendEvent(StreamEventType.DONE, { toolCalls: toolCallCount });
}

async function handleConfirmation(confirmation, tools, sendEvent) {
  const { tool, args, approved, confirmationId } = confirmation;

  if (!approved) {
    sendEvent(StreamEventType.TOKEN, {
      content: `Understood, I've cancelled the ${tool} action.`,
    });
    sendEvent(StreamEventType.DONE, {});
    return;
  }

  sendEvent(StreamEventType.TOOL_CALL, {
    tool: { name: tool, args },
    requiresConfirmation: false,
  });

  sendEvent(StreamEventType.TOOL_PROGRESS, {
    tool,
    message: `Executing confirmed ${tool}...`,
  });

  try {
    const toolResult = await executeTool(tools, tool, args);
    const resultText = toolResult.content?.[0]?.text || JSON.stringify(toolResult);

    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch {
      parsedResult = resultText;
    }

    sendEvent(StreamEventType.TOOL_RESULT, {
      tool,
      result: parsedResult,
      status: toolResult.isError ? 'error' : 'complete',
    });

    sendEvent(StreamEventType.TOKEN, {
      content: `Successfully executed ${tool}.`,
    });
  } catch (err) {
    logger.error(`[orchestrator] Confirmed tool ${tool} failed:`, err);
    sendEvent(StreamEventType.TOOL_RESULT, {
      tool,
      result: { error: err.message },
      status: 'error',
    });
  }

  sendEvent(StreamEventType.DONE, {});
}

function buildChatHistory(history) {
  if (!history || !Array.isArray(history)) return [];

  return history
    .filter((msg) => msg.role && msg.content)
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
}

module.exports = { orchestrate };
