const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.generateContent = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      // Support both 'prompt' and 'userInput' field names for compatibility
      const {
        prompt,
        userInput,
        type,
        contentType,
        context,
        systemPrompt: clientSystemPrompt,
        contextContent,
        projectContext
      } = data;

      // Use prompt or userInput (client sends userInput, some components send prompt)
      const finalPrompt = prompt || userInput;

      if (!finalPrompt) {
        throw new HttpsError('invalid-argument', 'Prompt is required');
      }

      const model = getModel();
      if (!model) {
        throw new HttpsError('failed-precondition', 'Gemini API key not configured');
      }

      // Use client-provided systemPrompt if available, otherwise generate based on type
      let systemPrompt = '';
      if (clientSystemPrompt) {
        systemPrompt = clientSystemPrompt;
      } else {
        const effectiveType = type || contentType;
        if (effectiveType === 'email' || effectiveType === 'Cold Outreach Email') {
          systemPrompt = 'You are an expert copywriter specializing in professional emails.';
        } else if (effectiveType === 'job_description' || effectiveType === 'Job Description') {
          systemPrompt = 'You are an HR specialist skilled in writing compelling job descriptions.';
        } else {
          systemPrompt = 'You are a helpful AI assistant.';
        }
      }

      // Add context if provided
      if (context) {
        systemPrompt += `\nContext: ${JSON.stringify(context)}`;
      }
      if (contextContent) {
        systemPrompt += `\nAdditional Context: ${contextContent}`;
      }
      if (projectContext) {
        systemPrompt += `\nProject Context: ${projectContext}`;
      }

      const result = await model.generateContent(`${systemPrompt}\n\nTask: ${finalPrompt}`);
      const content = result.response.text();

      return { content };

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error generating content:', error);
      throw new HttpsError('internal', error.message);
    }
  }
);
