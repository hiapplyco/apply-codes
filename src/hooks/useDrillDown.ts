import { useState, useCallback } from 'react';
import { ChartDataPoint } from '../types/dashboard';

interface DrillDownState {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  chartType: 'bar' | 'pie' | 'line' | 'radar' | 'heatmap' | 'funnel' | 'gauge';
  originalData?: ChartDataPoint;
  jobId: string;
  metric: string;
  segment: string;
}

export const useDrillDown = (jobId: string) => {
  const [drillDownState, setDrillDownState] = useState<DrillDownState | null>(null);

  const openDrillDown = useCallback((
    title: string,
    data: ChartDataPoint[],
    chartType: DrillDownState['chartType'],
    metric: string,
    segment: string,
    originalData?: ChartDataPoint,
    subtitle?: string
  ) => {
    setDrillDownState({
      isOpen: true,
      title,
      subtitle,
      data,
      chartType,
      originalData,
      jobId,
      metric,
      segment
    });
  }, [jobId]);

  const closeDrillDown = useCallback(() => {
    setDrillDownState(null);
  }, []);

  // Generate drill-down data based on chart type and selection
  const generateDrillDownData = useCallback((
    originalData: ChartDataPoint,
    metric: string,
    chartType: DrillDownState['chartType']
  ): ChartDataPoint[] => {
    // This would typically fetch real data from API
    // For now, we'll generate sample detailed data
    const baseValue = originalData.value;
    const baseName = originalData.name;

    switch (chartType) {
      case 'bar':
        if (metric === 'compensation') {
          return [
            { name: 'Base Salary', value: Math.round(baseValue * 0.7), label: 'Base Salary Component' },
            { name: 'Bonus', value: Math.round(baseValue * 0.15), label: 'Annual Bonus' },
            { name: 'Stock Options', value: Math.round(baseValue * 0.10), label: 'Equity Compensation' },
            { name: 'Benefits', value: Math.round(baseValue * 0.05), label: 'Benefits Package' }
          ];
        } else if (metric === 'skills') {
          return [
            { name: 'Senior Level', value: Math.round(baseValue * 0.4), label: 'Senior Professionals' },
            { name: 'Mid Level', value: Math.round(baseValue * 0.35), label: 'Mid-level Professionals' },
            { name: 'Junior Level', value: Math.round(baseValue * 0.20), label: 'Junior Professionals' },
            { name: 'Expert Level', value: Math.round(baseValue * 0.05), label: 'Expert Professionals' }
          ];
        }
        break;

      case 'pie':
        return [
          { name: `${baseName} - Primary`, value: Math.round(baseValue * 0.6), label: 'Primary Usage' },
          { name: `${baseName} - Secondary`, value: Math.round(baseValue * 0.25), label: 'Secondary Usage' },
          { name: `${baseName} - Tertiary`, value: Math.round(baseValue * 0.15), label: 'Tertiary Usage' }
        ];

      case 'funnel':
        return [
          { name: 'Initial Screen', value: Math.round(baseValue * 1.5), label: 'Initial Screening' },
          { name: 'Phone Interview', value: Math.round(baseValue * 1.2), label: 'Phone Screening' },
          { name: 'Technical Interview', value: baseValue, label: 'Technical Assessment' },
          { name: 'Final Interview', value: Math.round(baseValue * 0.7), label: 'Final Round' },
          { name: 'Offer Extended', value: Math.round(baseValue * 0.5), label: 'Offer Stage' }
        ];

      case 'heatmap':
        return [
          { name: 'Remote', value: Math.round(baseValue * 0.4), label: 'Remote Workers' },
          { name: 'On-site', value: Math.round(baseValue * 0.35), label: 'On-site Workers' },
          { name: 'Hybrid', value: Math.round(baseValue * 0.25), label: 'Hybrid Workers' }
        ];

      default:
        return [
          { name: 'Detailed View 1', value: Math.round(baseValue * 0.4), label: 'Primary Component' },
          { name: 'Detailed View 2', value: Math.round(baseValue * 0.35), label: 'Secondary Component' },
          { name: 'Detailed View 3', value: Math.round(baseValue * 0.25), label: 'Tertiary Component' }
        ];
    }

    return [];
  }, []);

  // Handle chart clicks with intelligent drill-down
  const handleChartClick = useCallback((
    data: ChartDataPoint,
    chartType: DrillDownState['chartType'],
    metric: string,
    chartTitle: string
  ) => {
    const drillDownData = generateDrillDownData(data, metric, chartType);
    const segment = data.name.toLowerCase().replace(/\s+/g, '-');
    
    openDrillDown(
      `${chartTitle} - ${data.name}`,
      drillDownData,
      chartType,
      metric,
      segment,
      data,
      `Detailed breakdown of ${data.name}`
    );
  }, [generateDrillDownData, openDrillDown]);

  return {
    drillDownState,
    openDrillDown,
    closeDrillDown,
    handleChartClick,
    generateDrillDownData
  };
};