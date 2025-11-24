import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RecruitmentMetrics, DashboardMetric, ChartDataPoint, TimeSeriesData } from '../types/dashboard';
import { metricsCache, CACHE_DURATIONS } from '../lib/metricsCache';

interface DashboardMetricsResponse {
  metrics: RecruitmentMetrics;
  lastUpdated: Date;
}

const fetchDashboardMetrics = async (jobId: string): Promise<DashboardMetricsResponse> => {
  console.log(`Fetching dashboard metrics for job ${jobId}`);

  // Check cache first
  const cacheKey = metricsCache.getDashboardMetricsKey(jobId);
  const cachedData = metricsCache.get<DashboardMetricsResponse>(cacheKey);
  
  if (cachedData) {
    console.log('Returning cached dashboard metrics');
    return cachedData;
  }

  // First, try to get dashboard metrics from the database
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const dashboardMetricsRef = collection(db, 'dashboard_metrics');
  const metricsQuery = query(
    dashboardMetricsRef,
    where('job_id', '==', jobId),
    where('expires_at', '>', Timestamp.fromDate(new Date())),
    orderBy('expires_at', 'desc'),
    orderBy('generated_at', 'desc')
  );

  const dashboardMetricsSnapshot = await getDocs(metricsQuery);
  const dashboardMetrics = dashboardMetricsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    generated_at: doc.data().generated_at instanceof Timestamp
      ? doc.data().generated_at.toDate().toISOString()
      : doc.data().generated_at,
    expires_at: doc.data().expires_at instanceof Timestamp
      ? doc.data().expires_at.toDate().toISOString()
      : doc.data().expires_at
  }));

  // If we have dashboard metrics, use them
  if (dashboardMetrics && dashboardMetrics.length > 0) {
    console.log(`Found ${dashboardMetrics.length} dashboard metrics`);
    const metrics = transformDashboardMetricsToRecruitmentMetrics(dashboardMetrics);
    const lastUpdated = new Date(Math.max(...dashboardMetrics.map(m => new Date(m.generated_at).getTime())));
    
    const result = {
      metrics,
      lastUpdated
    };

    // Cache the result
    metricsCache.set(cacheKey, result, CACHE_DURATIONS.DASHBOARD_METRICS);
    
    return result;
  }

  // Fallback: check if we have agent outputs for this job
  console.log('No dashboard metrics found, checking for agent outputs...');
  const agentOutputsRef = collection(db, 'agent_outputs');
  const agentOutputsQuery = query(
    agentOutputsRef,
    where('status', '==', 'completed'),
    orderBy('created_at', 'desc')
  );

  const agentOutputsSnapshot = await getDocs(agentOutputsQuery);
  const allAgentOutputs = agentOutputsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at instanceof Timestamp
      ? doc.data().created_at.toDate().toISOString()
      : doc.data().created_at
  }));

  // Filter agent outputs that match the jobId (client-side since Firestore doesn't support OR with different field paths)
  const agentOutputs = allAgentOutputs.filter(output => {
    const inputData = output.input_data || {};
    return inputData.jobId === jobId || inputData.job_id === jobId;
  });

  if (!agentOutputs || agentOutputs.length === 0) {
    throw new Error('No analysis data available. Please generate an analysis report first.');
  }

  console.log(`Found ${agentOutputs.length} agent outputs, using fallback transformation`);

  // Transform agent outputs into dashboard metrics (fallback)
  const metrics = transformAgentOutputsToMetrics(agentOutputs);

  const result = {
    metrics,
    lastUpdated: agentOutputs.length > 0 ? new Date(agentOutputs[0].created_at) : new Date()
  };

  // Cache the fallback result with shorter TTL
  metricsCache.set(cacheKey, result, CACHE_DURATIONS.CHART_DATA);
  
  return result;
};

const transformDashboardMetricsToRecruitmentMetrics = (dashboardMetrics: any[]): RecruitmentMetrics => {
  console.log('Transforming dashboard metrics to recruitment metrics:', dashboardMetrics);

  // Group metrics by type
  const metricsByType = dashboardMetrics.reduce((acc, metric) => {
    const type = metric.metric_type;
    if (!acc[type]) acc[type] = {};
    acc[type][metric.metric_name] = metric.metric_data;
    return acc;
  }, {} as Record<string, Record<string, any>>);

  return {
    kpis: {
      totalCandidates: metricsByType.kpi?.total_candidates || {
        id: 'total-candidates',
        name: 'Total Candidates',
        value: 0,
        type: 'number'
      },
      qualifiedCandidates: metricsByType.kpi?.qualified_candidates || {
        id: 'qualified-candidates',
        name: 'Qualified Candidates',
        value: 0,
        type: 'number'
      },
      timeToFill: metricsByType.kpi?.time_to_fill || {
        id: 'time-to-fill',
        name: 'Time to Fill',
        value: 0,
        type: 'number'
      },
      costPerHire: metricsByType.kpi?.cost_per_hire || {
        id: 'cost-per-hire',
        name: 'Cost per Hire',
        value: 0,
        type: 'currency'
      }
    },
    pipeline: {
      stages: metricsByType.pipeline?.stages || [],
      conversionRates: metricsByType.pipeline?.conversion_rates || []
    },
    skills: {
      distribution: metricsByType.skills?.distribution || [],
      demand: metricsByType.skills?.demand || []
    },
    compensation: {
      ranges: metricsByType.compensation?.ranges || [],
      benefits: metricsByType.compensation?.benefits || []
    },
    locations: {
      geographic: metricsByType.locations?.geographic || [],
      remote: metricsByType.locations?.remote || {
        id: 'remote-percentage',
        name: 'Remote-Friendly',
        value: 0,
        type: 'percentage'
      }
    },
    trends: {
      applications: metricsByType.trends?.applications || [],
      qualityScore: metricsByType.trends?.quality_score || []
    },
    predictions: {
      successProbability: metricsByType.predictions?.success_probability || {
        id: 'success-probability',
        name: 'Success Probability',
        value: 0,
        type: 'percentage'
      },
      timeToHire: metricsByType.predictions?.time_to_hire || {
        id: 'predicted-time',
        name: 'Predicted Time to Hire',
        value: 0,
        type: 'number'
      },
      retentionLikelihood: metricsByType.predictions?.retention_likelihood || {
        id: 'retention-likelihood',
        name: 'Retention Likelihood',
        value: 0,
        type: 'percentage'
      }
    }
  };
};

const transformAgentOutputsToMetrics = (agentOutputs: any[]): RecruitmentMetrics => {
  // Find relevant agent outputs
  const nlpOutput = agentOutputs.find(output => output.agent_type === 'extract-nlp-terms');
  const compensationOutput = agentOutputs.find(output => output.agent_type === 'analyze-compensation');
  const jobOutput = agentOutputs.find(output => output.agent_type === 'enhance-job-description');
  const summaryOutput = agentOutputs.find(output => output.agent_type === 'summarize-job');

  // Generate mock data based on analysis outputs (will be replaced with real data)
  const skillsData = nlpOutput?.output_data?.skills || [];
  const compensationData = compensationOutput?.output_data || {};

  return {
    kpis: {
      totalCandidates: {
        id: 'total-candidates',
        name: 'Total Candidates',
        value: Math.floor(Math.random() * 1000) + 500,
        type: 'number',
        trend: {
          direction: 'up',
          percentage: Math.floor(Math.random() * 20) + 5
        }
      },
      qualifiedCandidates: {
        id: 'qualified-candidates',
        name: 'Qualified Candidates',
        value: Math.floor(Math.random() * 200) + 50,
        type: 'number',
        trend: {
          direction: 'up',
          percentage: Math.floor(Math.random() * 15) + 3
        }
      },
      timeToFill: {
        id: 'time-to-fill',
        name: 'Avg. Time to Fill',
        value: Math.floor(Math.random() * 30) + 15,
        type: 'number',
        trend: {
          direction: 'down',
          percentage: Math.floor(Math.random() * 10) + 2
        }
      },
      costPerHire: {
        id: 'cost-per-hire',
        name: 'Cost per Hire',
        value: Math.floor(Math.random() * 5000) + 3000,
        type: 'currency',
        trend: {
          direction: 'stable',
          percentage: 0
        }
      }
    },
    pipeline: {
      stages: [
        { name: 'Applications', value: 1000, color: '#8B5CF6' },
        { name: 'Screening', value: 300, color: '#10B981' },
        { name: 'Interviews', value: 100, color: '#F59E0B' },
        { name: 'Offers', value: 25, color: '#EF4444' },
        { name: 'Hired', value: 20, color: '#3B82F6' }
      ],
      conversionRates: [
        { name: 'Screen Rate', value: 30, color: '#8B5CF6' },
        { name: 'Interview Rate', value: 33, color: '#10B981' },
        { name: 'Offer Rate', value: 25, color: '#F59E0B' },
        { name: 'Accept Rate', value: 80, color: '#EF4444' }
      ]
    },
    skills: {
      distribution: skillsData.length > 0 
        ? skillsData.slice(0, 8).map((skill: string, index: number) => ({
            name: skill,
            value: Math.floor(Math.random() * 50) + 10,
            color: ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'][index % 5]
          }))
        : [
            { name: 'JavaScript', value: 85, color: '#8B5CF6' },
            { name: 'Python', value: 72, color: '#10B981' },
            { name: 'React', value: 68, color: '#F59E0B' },
            { name: 'Node.js', value: 55, color: '#EF4444' },
            { name: 'AWS', value: 45, color: '#3B82F6' }
          ],
      demand: [
        { name: 'High Demand', value: 65, color: '#EF4444' },
        { name: 'Medium Demand', value: 25, color: '#F59E0B' },
        { name: 'Low Demand', value: 10, color: '#10B981' }
      ]
    },
    compensation: {
      ranges: [
        { name: '$80-100k', value: 25, color: '#8B5CF6' },
        { name: '$100-120k', value: 35, color: '#10B981' },
        { name: '$120-150k', value: 30, color: '#F59E0B' },
        { name: '$150k+', value: 10, color: '#EF4444' }
      ],
      benefits: [
        { name: 'Health Insurance', value: 95, color: '#8B5CF6' },
        { name: 'Remote Work', value: 80, color: '#10B981' },
        { name: 'Equity', value: 60, color: '#F59E0B' },
        { name: 'Learning Budget', value: 70, color: '#EF4444' }
      ]
    },
    locations: {
      geographic: [
        { name: 'San Francisco', value: 120, color: '#8B5CF6' },
        { name: 'New York', value: 95, color: '#10B981' },
        { name: 'Austin', value: 75, color: '#F59E0B' },
        { name: 'Seattle', value: 85, color: '#EF4444' },
        { name: 'Boston', value: 60, color: '#3B82F6' },
        { name: 'Denver', value: 45, color: '#8B5A2B' },
        { name: 'Remote', value: 200, color: '#EC4899' },
        { name: 'Chicago', value: 55, color: '#6B7280' }
      ],
      remote: {
        id: 'remote-percentage',
        name: 'Remote-Friendly',
        value: 75,
        type: 'percentage'
      }
    },
    trends: {
      applications: generateTimeSeriesData('applications', 30),
      qualityScore: generateTimeSeriesData('quality', 30)
    },
    predictions: {
      successProbability: {
        id: 'success-probability',
        name: 'Success Probability',
        value: Math.floor(Math.random() * 30) + 65,
        type: 'percentage'
      },
      timeToHire: {
        id: 'predicted-time',
        name: 'Predicted Time to Hire',
        value: Math.floor(Math.random() * 15) + 20,
        type: 'number'
      },
      retentionLikelihood: {
        id: 'retention-likelihood',
        name: 'Retention Likelihood',
        value: Math.floor(Math.random() * 20) + 75,
        type: 'percentage'
      }
    }
  };
};

const generateTimeSeriesData = (type: string, days: number): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    let value;
    switch (type) {
      case 'applications':
        value = Math.floor(Math.random() * 50) + 10;
        break;
      case 'quality':
        value = Math.floor(Math.random() * 30) + 60;
        break;
      default:
        value = Math.floor(Math.random() * 100);
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      value,
      label: date.toLocaleDateString()
    });
  }
  
  return data;
};

export const useDashboardMetrics = (
  jobId: string,
  options?: Omit<UseQueryOptions<DashboardMetricsResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['dashboard-metrics', jobId],
    queryFn: () => fetchDashboardMetrics(jobId),
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
};