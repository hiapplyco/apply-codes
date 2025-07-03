import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PieChart } from '../charts/PieChart';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { GaugeChart } from '../charts/GaugeChart';
import { FunnelChart } from '../charts/FunnelChart';
import { HeatMapChart } from '../charts/HeatMapChart';
import { RadarChart } from '../charts/RadarChart';
import { MultiLineChart } from '../charts/MultiLineChart';
import { MetricCard } from '../charts/MetricCard';
import { 
  DashboardCardProps, 
  DashboardMetric, 
  ChartDataPoint, 
  TimeSeriesData, 
  RadarChartData, 
  MultiLineChartData,
  MultiLineChartSeries 
} from '../../types/dashboard';

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  type,
  size,
  data,
  chartType,
  loading = false,
  error,
  className = "",
  onChartClick
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2 row-span-1';
      case 'large':
        return 'col-span-1 md:col-span-2 lg:col-span-3 row-span-1';
      default:
        return 'col-span-1 row-span-1';
    }
  };

  const renderTrend = (metric: DashboardMetric) => {
    if (!metric.trend) return null;

    const { direction, percentage } = metric.trend;
    const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
    const trendColor = direction === 'up' ? 'text-green-500' : direction === 'down' ? 'text-red-500' : 'text-gray-500';

    return (
      <div className={`flex items-center ${trendColor} text-sm`}>
        <TrendIcon className="w-4 h-4 mr-1" />
        <span>{Math.abs(percentage)}%</span>
      </div>
    );
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-40 text-red-500">
          <span className="text-sm">Error loading chart</span>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex items-center justify-center h-40 text-gray-400">
          <span className="text-sm">No data available</span>
        </div>
      );
    }

    switch (chartType) {
      case 'pie':
        return <PieChart data={data as ChartDataPoint[]} onSliceClick={onChartClick} />;
      case 'bar':
        return <BarChart data={data as ChartDataPoint[]} onBarClick={onChartClick} />;
      case 'line':
        return <LineChart data={data as TimeSeriesData[]} onPointClick={onChartClick} />;
      case 'gauge':
        return <GaugeChart data={data as DashboardMetric} />;
      case 'funnel':
        return <FunnelChart data={data as ChartDataPoint[]} onSegmentClick={onChartClick} />;
      case 'heatmap':
        return <HeatMapChart data={data as ChartDataPoint[]} onCellClick={onChartClick} />;
      case 'radar':
        return <RadarChart data={data as RadarChartData[]} />;
      case 'multiline':
        return <MultiLineChart data={data as MultiLineChartData[]} series={[] as MultiLineChartSeries[]} />;
      default:
        return (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <span className="text-sm">Unsupported chart type</span>
          </div>
        );
    }
  };

  const renderContent = () => {
    if (type === 'metric') {
      return <MetricCard data={data as DashboardMetric} />;
    }

    return (
      <div className="h-full">
        {renderChart()}
      </div>
    );
  };

  return (
    <div 
      className={`
        bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200
        ${getSizeClasses()}
        ${className}
      `}
    >
      {/* Card Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          
          {type === 'metric' && (data as DashboardMetric).trend && (
            <div className="ml-4">
              {renderTrend(data as DashboardMetric)}
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};