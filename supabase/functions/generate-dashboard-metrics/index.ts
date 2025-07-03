import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '')

interface DashboardMetricsRequest {
  jobId: string
  agentOutputIds?: string[]
  forceRefresh?: boolean
}

interface KPIMetric {
  value: number | string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  target?: number;
  unit?: string;
}

interface PipelineData {
  stage: string;
  count: number;
  percentage: number;
  trend?: number;
}

interface SkillData {
  skill: string;
  demand: number;
  growth: number;
  salary_impact: number;
}

interface CompensationData {
  range: string;
  count: number;
  median: number;
  market_position: 'below' | 'at' | 'above';
}

interface LocationData {
  location: string;
  candidates: number;
  avg_salary: number;
  demand_score: number;
}

interface TrendData {
  date: string;
  value: number;
  metric: string;
}

interface PredictionData {
  metric: string;
  current_value: number;
  predicted_value: number;
  confidence: number;
  timeframe: string;
}

interface GeneratedMetrics {
  kpis: Record<string, KPIMetric>;
  pipeline: Record<string, PipelineData[]>;
  skills: Record<string, SkillData[]>;
  compensation: Record<string, CompensationData[]>;
  locations: Record<string, LocationData[]>;
  trends: Record<string, TrendData[]>;
  predictions: Record<string, PredictionData>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { jobId, agentOutputIds, forceRefresh = false }: DashboardMetricsRequest = await req.json()

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Generating dashboard metrics for job ${jobId}`)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set auth for supabase client
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    } as any)

    // Check if we already have recent metrics (unless force refresh)
    if (!forceRefresh) {
      const { data: existingMetrics } = await supabaseClient
        .from('dashboard_metrics')
        .select('*')
        .eq('job_id', jobId)
        .gte('generated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // 30 minutes
        .order('generated_at', { ascending: false })
        .limit(1)

      if (existingMetrics && existingMetrics.length > 0) {
        console.log('Returning existing recent metrics')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Recent metrics found',
            metricsCount: existingMetrics.length 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get agent outputs for this job
    let agentOutputsQuery = supabaseClient
      .from('agent_outputs')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (agentOutputIds && agentOutputIds.length > 0) {
      agentOutputsQuery = agentOutputsQuery.in('id', agentOutputIds)
    } else {
      // Get by job ID from input_data
      agentOutputsQuery = agentOutputsQuery.or(`input_data->>jobId.eq.${jobId},input_data->>job_id.eq.${jobId}`)
    }

    const { data: agentOutputs, error: outputsError } = await agentOutputsQuery

    if (outputsError) {
      throw new Error(`Failed to fetch agent outputs: ${outputsError.message}`)
    }

    if (!agentOutputs || agentOutputs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No analysis data found. Please generate an analysis report first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${agentOutputs.length} agent outputs for analysis`)

    // Generate metrics using Gemini
    const generatedMetrics = await generateMetricsWithGemini(agentOutputs, jobId)

    // Store metrics in database
    const metricsStored = await storeGeneratedMetrics(jobId, generatedMetrics, agentOutputs[0])

    console.log(`Generated and stored ${metricsStored} dashboard metrics`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        metricsGenerated: metricsStored,
        jobId: jobId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating dashboard metrics:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate dashboard metrics',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateMetricsWithGemini(agentOutputs: any[], jobId: string): Promise<GeneratedMetrics> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  // Compile all analysis data
  const analysisData = {
    jobId,
    nlpTerms: agentOutputs.find(o => o.agent_type === 'extract-nlp-terms')?.output_data,
    compensation: agentOutputs.find(o => o.agent_type === 'analyze-compensation')?.output_data,
    jobDescription: agentOutputs.find(o => o.agent_type === 'enhance-job-description')?.output_data,
    jobSummary: agentOutputs.find(o => o.agent_type === 'summarize-job')?.output_data,
    inputData: agentOutputs[0]?.input_data
  }

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
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('Generated metrics response:', text.substring(0, 500))
    
    return JSON.parse(text)
  } catch (error) {
    console.error('Error generating metrics with Gemini:', error)
    throw new Error(`Failed to generate metrics: ${error.message}`)
  }
}

async function storeGeneratedMetrics(
  jobId: string, 
  metrics: GeneratedMetrics, 
  sourceAgentOutput: any
): Promise<number> {
  let storedCount = 0

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
        })
      storedCount++
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
        })
      storedCount++
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
        })
      storedCount++
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
        })
      storedCount++
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
        })
      storedCount++
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
        })
      storedCount++
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
        })
      storedCount++
    }

    // Refresh materialized view
    await supabaseClient.rpc('refresh_dashboard_analytics')

    return storedCount
  } catch (error) {
    console.error('Error storing metrics:', error)
    throw new Error(`Failed to store metrics: ${error.message}`)
  }
}