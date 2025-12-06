const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('firebase-functions/logger');

// Define secrets
const geminiApiKey = defineSecret('GEMINI_API_KEY');

exports.analyzeCompensation = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: '1GiB',
    secrets: [geminiApiKey]
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { content } = req.body;

      if (!content) {
        res.status(400).json({ error: 'Content is required in request body' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      });

      // Enhanced compensation analysis prompt
      const prompt = `You are an expert compensation analyst. Analyze the following job description or content and provide comprehensive compensation insights.

Content to analyze:
${content}

Perform a detailed compensation analysis and return a JSON object with the following structure:

{
  "salary_ranges": {
    "min": [minimum salary estimate],
    "max": [maximum salary estimate],
    "median": [median salary estimate],
    "currency": "USD",
    "frequency": "annual"
  },
  "market_positioning": {
    "percentile": [market percentile 10-90],
    "competitive_rating": "below_market|at_market|above_market",
    "market_factors": ["factor1", "factor2", "factor3"]
  },
  "location_impact": {
    "location": "[extracted or inferred location]",
    "cost_of_living_adjustment": [percentage adjustment],
    "regional_premium": [percentage premium/discount]
  },
  "skill_premiums": [
    {
      "skill": "[skill name]",
      "premium_percentage": [percentage premium],
      "market_demand": "low|medium|high|critical"
    }
  ],
  "experience_scaling": {
    "entry_level": [salary range for 0-2 years],
    "mid_level": [salary range for 3-7 years],
    "senior_level": [salary range for 8+ years]
  },
  "benefits_analysis": {
    "total_compensation_multiplier": [1.2-1.8 typically],
    "key_benefits": ["benefit1", "benefit2", "benefit3"],
    "benefits_value_estimate": [dollar amount]
  },
  "market_trends": {
    "growth_trajectory": "declining|stable|growing|hot",
    "demand_vs_supply": "oversupplied|balanced|undersupplied",
    "trend_factors": ["factor1", "factor2"]
  },
  "negotiation_insights": {
    "negotiation_leverage": "low|medium|high",
    "key_negotiation_points": ["point1", "point2", "point3"],
    "market_leverage_factors": ["factor1", "factor2"]
  },
  "recommendations": {
    "compensation_strategy": "[strategic recommendation]",
    "market_adjustments": ["adjustment1", "adjustment2"],
    "competitive_positioning": "[positioning advice]"
  }
}

Base your analysis on:
1. Job title, level, and responsibilities extracted from the content
2. Required skills and their market value
3. Industry standards and current market conditions
4. Geographic location factors (if specified)
5. Company size and type indicators
6. Current market trends for the role

Provide realistic, data-driven estimates. If specific information is missing, make reasonable inferences based on context clues and state your assumptions.

Return only the JSON object, no additional text or formatting.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      let analysis;
      try {
        analysis = JSON.parse(response);
      } catch (parseError) {
        logger.error('Failed to parse Gemini response as JSON:', parseError);
        // Fallback: return the text response wrapped in an object
        analysis = {
          raw_analysis: response,
          error: 'Failed to parse structured response'
        };
      }

      res.status(200).json({ analysis });

    } catch (error) {
      logger.error('Error in analyze-compensation:', error);

      let status = 500;
      if (error.message.includes('not configured')) status = 503;
      if (error.message.includes('required')) status = 400;
      if (error.message.includes('rate limit') || error.message.includes('429')) status = 429;

      res.status(status).json({
        error: error.message,
        details: error.stack
      });
    }
  }
);