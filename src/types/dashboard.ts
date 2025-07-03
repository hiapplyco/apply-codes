export interface DashboardMetric {
  id: string;
  name: string;
  value: number | string;
  type: 'number' | 'percentage' | 'currency' | 'text';
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  icon?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  label?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface RadarChartData {
  subject: string;
  value: number;
  fullMark: number;
}

export interface MultiLineChartData {
  name: string;
  [key: string]: string | number; // Allow dynamic series data
}

export interface MultiLineChartSeries {
  key: string;
  name: string;
  color: string;
}

export interface DashboardCardProps {
  title: string;
  subtitle?: string;
  type: 'metric' | 'chart';
  size: 'small' | 'medium' | 'large';
  data: DashboardMetric | ChartDataPoint[] | TimeSeriesData[] | RadarChartData[] | MultiLineChartData[];
  chartType?: 'pie' | 'bar' | 'line' | 'gauge' | 'radar' | 'funnel' | 'heatmap';
  loading?: boolean;
  error?: string;
  className?: string;
  onChartClick?: (data: ChartDataPoint) => void;
}

export interface DashboardConfig {
  cards: DashboardCardProps[];
  layout: 'grid' | 'masonry';
  refreshInterval?: number;
}

export interface RecruitmentMetrics {
  kpis: {
    totalCandidates: DashboardMetric;
    qualifiedCandidates: DashboardMetric;
    timeToFill: DashboardMetric;
    costPerHire: DashboardMetric;
  };
  pipeline: {
    stages: ChartDataPoint[];
    conversionRates: ChartDataPoint[];
  };
  skills: {
    distribution: ChartDataPoint[];
    demand: ChartDataPoint[];
  };
  compensation: {
    ranges: ChartDataPoint[];
    benefits: ChartDataPoint[];
  };
  locations: {
    geographic: ChartDataPoint[];
    remote: DashboardMetric;
  };
  trends: {
    applications: TimeSeriesData[];
    qualityScore: TimeSeriesData[];
  };
  predictions: {
    successProbability: DashboardMetric;
    timeToHire: DashboardMetric;
    retentionLikelihood: DashboardMetric;
  };
}

export interface DashboardState {
  jobId: string;
  metrics: RecruitmentMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  autoRefresh: boolean;
}

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  locations: string[];
  experienceLevels: string[];
  skills: string[];
  salaryRange: {
    min: number;
    max: number;
  };
}

export interface DashboardExportOptions {
  format: 'pdf' | 'csv' | 'excel' | 'json';
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}