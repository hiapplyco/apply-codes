const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require("firebase-functions/v2");
const { getModel } = require('./utils/gemini');

exports.analyzeCompensation = onCall(
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
      const { content } = data;

      if (!content) {
        throw new HttpsError('invalid-argument', 'Content is required in request body');
      }

      const model = getModel(undefined, {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      });

      if (!model) {
        throw new HttpsError('failed-precondition', 'GEMINI_API_KEY is not configured');
      }

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
      let responseText = result.response.text();

      // Strip markdown code blocks if present
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      let analysis;
      try {
        analysis = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Failed to parse Gemini response as JSON:', parseError);
        analysis = {
          raw_analysis: responseText,
          error: 'Failed to parse structured response'
        };
      }

      return { analysis };

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error in analyze-compensation:', error);
      throw new HttpsError('internal', error.message);
    }
  }
);
