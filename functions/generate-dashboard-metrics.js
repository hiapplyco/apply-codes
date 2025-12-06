const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const logger = require('firebase-functions/logger');

const geminiApiKey = defineSecret('GEMINI_API_KEY');

exports.generateDashboardMetrics = onRequest(
  {
    cors: true,
    timeoutSeconds: 540,
    memory: '2GiB',
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
      const { jobId, agentOutputIds, forceRefresh = false } = req.body;

      if (!jobId) {
        res.status(400).json({ error: 'Job ID is required' });
        return;
      }

      logger.info(`Generating dashboard metrics for job ${jobId}`);

      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ error: 'No authorization header' });
        return;
      }

      // Initialize Supabase client
      const supabaseClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Set auth for supabase client
      await supabaseClient.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: ''
      });

      // Check if we already have recent metrics (unless force refresh)
      if (!forceRefresh) {
        const { data: existingMetrics } = await supabaseClient
          .from('dashboard_metrics')
          .select('*')
          .eq('job_id', jobId)
          .gte('generated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // 30 minutes
          .order('generated_at', { ascending: false })
          .limit(1);

        if (existingMetrics && existingMetrics.length > 0) {
          logger.info('Returning existing recent metrics');
          res.status(200).json({
            success: true,
            message: 'Recent metrics found',
            metricsCount: existingMetrics.length
          });
          return;
        }
      }

      // Get agent outputs for this job
      let agentOutputsQuery = supabaseClient
        .from('agent_outputs')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (agentOutputIds && agentOutputIds.length > 0) {
        agentOutputsQuery = agentOutputsQuery.in('id', agentOutputIds);
      } else {
        // Get by job ID from input_data
        agentOutputsQuery = agentOutputsQuery.or(`input_data->>jobId.eq.${jobId},input_data->>job_id.eq.${jobId}`);
      }

      const { data: agentOutputs, error: outputsError } = await agentOutputsQuery;

      if (outputsError) {
        throw new Error(`Failed to fetch agent outputs: ${outputsError.message}`);
      }

      if (!agentOutputs || agentOutputs.length === 0) {
        res.status(404).json({
          error: 'No analysis data found. Please generate an analysis report first.'
        });
        return;
      }

      logger.info(`Found ${agentOutputs.length} agent outputs for analysis`);

      // Generate metrics using Gemini
      const generatedMetrics = await generateMetricsWithGemini(agentOutputs, jobId, process.env.GEMINI_API_KEY);

      // Store metrics in database
      const metricsStored = await storeGeneratedMetrics(jobId, generatedMetrics, agentOutputs[0], supabaseClient);

      logger.info(`Generated and stored ${metricsStored} dashboard metrics`);

      res.status(200).json({
        success: true,
        metricsGenerated: metricsStored,
        jobId: jobId
      });

    } catch (error) {
      logger.error('Error generating dashboard metrics:', error);
      res.status(500).json({
        error: 'Failed to generate dashboard metrics',
        details: error.message
      });
    }
  }
);

async function generateMetricsWithGemini(agentOutputs, jobId, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Compile all analysis data
  const analysisData = {
    jobId,
    nlpTerms: agentOutputs.find(o => o.agent_type === 'extract-nlp-terms')?.output_data,
    compensation: agentOutputs.find(o => o.agent_type === 'analyze-compensation')?.output_data,
    jobDescription: agentOutputs.find(o => o.agent_type === 'enhance-job-description')?.output_data,
    jobSummary: agentOutputs.find(o => o.agent_type === 'summarize-job')?.output_data,
    inputData: agentOutputs[0]?.input_data
  };

  const prompt = `
You are an expert recruitment analytics specialist. Analyze the provided job analysis data and generate comprehensive dashboard metrics for recruitment intelligence.

Analysis Data:
${JSON.stringify(analysisData, null, 2)}

Generate dashboard metrics in the following JSON structure. Use real insights from the analysis data to create meaningful, actionable metrics:

{
  "kpis": {
    "total_candidates": {
      "id": "total-candidates",
      "name": "Total Candidates",
      "value": [realistic number based on job complexity and market],
      "type": "number",
      "trend": {
        "direction": "up|down|stable",
        "percentage": [percentage change]
      }
    },
    "qualified_candidates": {
      "id": "qualified-candidates",
      "name": "Qualified Candidates",
      "value": [realistic number based on requirements],
      "type": "number",
      "trend": {
        "direction": "up|down|stable",
        "percentage": [percentage change]
      }
    },
    "time_to_fill": {
      "id": "time-to-fill",
      "name": "Estimated Time to Fill",
      "value": [days based on role complexity],
      "type": "number",
      "trend": {
        "direction": "down",
        "percentage": [improvement percentage]
      }
    },
    "cost_per_hire": {
      "id": "cost-per-hire",
      "name": "Estimated Cost per Hire",
      "value": [realistic cost based on role level],
      "type": "currency",
      "trend": {
        "direction": "stable",
        "percentage": 0
      }
    }
  },
  "pipeline": {
    "stages": [
      {"name": "Applications", "value": [number], "color": "#8B5CF6"},
      {"name": "Screening", "value": [number], "color": "#10B981"},
      {"name": "Interviews", "value": [number], "color": "#F59E0B"},
      {"name": "Offers", "value": [number], "color": "#EF4444"},
      {"name": "Hired", "value": [number], "color": "#3B82F6"}
    ],
    "conversion_rates": [
      {"name": "Screen Rate", "value": [percentage], "color": "#8B5CF6"},
      {"name": "Interview Rate", "value": [percentage], "color": "#10B981"},
      {"name": "Offer Rate", "value": [percentage], "color": "#F59E0B"},
      {"name": "Accept Rate", "value": [percentage], "color": "#EF4444"}
    ]
  },
  "skills": {
    "distribution": [
      [Array of top 8 skills from analysis with realistic demand numbers and colors]
    ],
    "demand": [
      {"name": "High Demand", "value": [percentage], "color": "#EF4444"},
      {"name": "Medium Demand", "value": [percentage], "color": "#F59E0B"},
      {"name": "Low Demand", "value": [percentage], "color": "#10B981"}
    ]
  },
  "compensation": {
    "ranges": [
      [Array of salary ranges with percentages based on compensation analysis]
    ],
    "benefits": [
      [Array of benefits with adoption percentages]
    ]
  },
  "locations": {
    "geographic": [
      [Array of location data with candidate counts]
    ],
    "remote": {
      "id": "remote-percentage",
      "name": "Remote-Friendly",
      "value": [percentage based on job requirements],
      "type": "percentage"
    }
  },
  "trends": {
    "applications": [
      [30-day time series data for applications trend]
    ],
    "quality_score": [
      [30-day time series data for candidate quality]
    ]
  },
  "predictions": {
    "success_probability": {
      "id": "success-probability",
      "name": "Hiring Success Probability",
      "value": [percentage based on job clarity and market conditions],
      "type": "percentage"
    },
    "time_to_hire": {
      "id": "predicted-time",
      "name": "Predicted Time to Hire",
      "value": [days based on role complexity and requirements],
      "type": "number"
    },
    "retention_likelihood": {
      "id": "retention-likelihood",
      "name": "12-Month Retention Likelihood",
      "value": [percentage based on role and compensation],
      "type": "percentage"
    }
  }
}

Base your metrics on:
1. Skills complexity and market demand from NLP analysis
2. Compensation competitiveness from compensation analysis
3. Job requirements clarity and specificity
4. Industry standards and market conditions
5. Location factors and remote work trends

Ensure all numbers are realistic and consistent with the job analysis data. Return only valid JSON without any additional text or formatting.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logger.info('Generated metrics response:', text.substring(0, 500));

    return JSON.parse(text);
  } catch (error) {
    logger.error('Error generating metrics with Gemini:', error);
    throw new Error(`Failed to generate metrics: ${error.message}`);
  }
}

async function storeGeneratedMetrics(jobId, metrics, sourceAgentOutput, supabaseClient) {
  let storedCount = 0;

  try {
    // Store KPI metrics
    for (const [key, metric] of Object.entries(metrics.kpis)) {
      await supabaseClient
        .from('dashboard_metrics')
        .upsert({
          user_id: sourceAgentOutput.user_id,
          job_id: jobId,
          metric_type: 'kpi',
          metric_name: key,
          metric_data: metric,
          source_agent_output_id: sourceAgentOutput.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }, {
          onConflict: 'job_id,metric_type,metric_name'
        });
      storedCount++;
    }

    // Store pipeline metrics
    for (const [key, data] of Object.entries(metrics.pipeline)) {
      await supabaseClient
        .from('dashboard_metrics')
        .upsert({
          user_id: sourceAgentOutput.user_id,
          job_id: jobId,
          metric_type: 'pipeline',
          metric_name: key,
          metric_data: data,
          source_agent_output_id: sourceAgentOutput.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'job_id,metric_type,metric_name'
        });
      storedCount++;
    }

    // Store skills metrics
    for (const [key, data] of Object.entries(metrics.skills)) {
      await supabaseClient
        .from('dashboard_metrics')
        .upsert({
          user_id: sourceAgentOutput.user_id,
          job_id: jobId,
          metric_type: 'skills',
          metric_name: key,
          metric_data: data,
          source_agent_output_id: sourceAgentOutput.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'job_id,metric_type,metric_name'
        });
      storedCount++;
    }

    // Store compensation metrics
    for (const [key, data] of Object.entries(metrics.compensation)) {
      await supabaseClient
        .from('dashboard_metrics')
        .upsert({
          user_id: sourceAgentOutput.user_id,
          job_id: jobId,
          metric_type: 'compensation',
          metric_name: key,
          metric_data: data,
          source_agent_output_id: sourceAgentOutput.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'job_id,metric_type,metric_name'
        });
      storedCount++;
    }

    // Store location metrics
    for (const [key, data] of Object.entries(metrics.locations)) {
      await supabaseClient
        .from('dashboard_metrics')
        .upsert({
          user_id: sourceAgentOutput.user_id,
          job_id: jobId,
          metric_type: 'locations',
          metric_name: key,
          metric_data: data,
          source_agent_output_id: sourceAgentOutput.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'job_id,metric_type,metric_name'
        });
      storedCount++;
    }

    // Store trends metrics
    for (const [key, data] of Object.entries(metrics.trends)) {
      await supabaseClient
        .from('dashboard_metrics')
        .upsert({
          user_id: sourceAgentOutput.user_id,
          job_id: jobId,
          metric_type: 'trends',
          metric_name: key,
          metric_data: data,
          source_agent_output_id: sourceAgentOutput.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'job_id,metric_type,metric_name'
        });
      storedCount++;
    }

    // Store predictions metrics
    for (const [key, data] of Object.entries(metrics.predictions)) {
      await supabaseClient
        .from('dashboard_metrics')
        .upsert({
          user_id: sourceAgentOutput.user_id,
          job_id: jobId,
          metric_type: 'predictions',
          metric_name: key,
          metric_data: data,
          source_agent_output_id: sourceAgentOutput.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'job_id,metric_type,metric_name'
        });
      storedCount++;
    }

    // Refresh materialized view
    await supabaseClient.rpc('refresh_dashboard_analytics');

    return storedCount;
  } catch (error) {
    logger.error('Error storing metrics:', error);
    throw new Error(`Failed to store metrics: ${error.message}`);
  }
}