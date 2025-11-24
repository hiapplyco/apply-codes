const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.generateContent = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set(corsHeaders);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed', success: false });
    return;
  }

  try {
    console.log('Content generation request received');

    const requestBody = req.body;
    console.log('Request body received:', {
      contentType: requestBody?.contentType,
      userInputLength: requestBody?.userInput?.length,
      systemPromptLength: requestBody?.systemPrompt?.length
    });

    const {
      contentType,
      userInput,
      systemPrompt,
      contextContent = '',
      projectContext = '',
      projectId = null
    } = requestBody;

    if (!contentType || !userInput?.trim() || !systemPrompt) {
      const missingFields = [];
      if (!contentType) missingFields.push('contentType');
      if (!userInput?.trim()) missingFields.push('userInput');
      if (!systemPrompt) missingFields.push('systemPrompt');

      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(errorMsg);

      res.status(400).json({
        error: errorMsg,
        success: false,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured');

      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured',
        success: false,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    console.log(`Starting content generation for: ${contentType}`);

    // Build comprehensive prompt with all context sources
    let fullPrompt = systemPrompt;

    // Add project context if available
    if (projectContext.trim()) {
      fullPrompt += `\n\n**PROJECT CONTEXT:**\n${projectContext}`;
    }

    // Add additional context content if available (from uploads, scraping, etc.)
    if (contextContent.trim()) {
      fullPrompt += `\n\n**ADDITIONAL CONTEXT:**\n${contextContent}`;
    }

    // Add user input
    fullPrompt += `\n\n**USER INPUT:**\n${userInput}`;

    // Add formatting instructions
    fullPrompt += `\n\n**FORMATTING INSTRUCTIONS:**\nFormat your response in Markdown with proper headings, lists, and formatting. Make it visually appealing and well-structured. Use the project context and additional context to make the content more relevant and personalized.`;

    console.log(`Prompt prepared, total length: ${fullPrompt.length}`, {
      hasProjectContext: !!projectContext.trim(),
      hasContextContent: !!contextContent.trim(),
      projectId: projectId
    });

    const result = await model.generateContent([
      {
        text: fullPrompt,
      }
    ]);

    console.log('Gemini API call completed');

    const generatedContent = result.response.text();
    console.log(`Raw content generated, length: ${generatedContent.length}`);

    // Clean up the response - remove any system-like prefixes
    const cleanedContent = generatedContent
      .replace(/^(Sure|Here's|I'll|Let me|Certainly|Of course)[^]*?(?=\n|$)/i, '')
      .trim();

    console.log(`Content cleaned, final length: ${cleanedContent.length}`);
    console.log(`Content generated successfully for ${contentType}`);

    const response = {
      content: cleanedContent,
      markdown: cleanedContent,
      contentType: contentType,
      projectId: projectId,
      hasProjectContext: !!projectContext.trim(),
      hasContextContent: !!contextContent.trim(),
      success: true
    };

    console.log('Sending response:', {
      contentLength: response.content.length,
      contentType: response.contentType,
      success: response.success
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error in content generator:', error);
    console.error('Error stack:', error.stack);

    const errorResponse = {
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    };

    res.status(500).json(errorResponse);
  }
});