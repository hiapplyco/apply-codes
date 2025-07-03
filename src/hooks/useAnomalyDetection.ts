import { useState, useEffect, useCallback } from 'react';
import { RecruitmentMetrics, ChartDataPoint, TimeSeriesData } from '../types/dashboard';

interface Anomaly {
  id: string;
  type: 'metric' | 'trend' | 'threshold' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  value: number | string;
  expectedValue?: number | string;
  deviation?: number;
  metric: string;
  category: string;
  detectedAt: Date;
  suggestions: string[];
  impact: 'positive' | 'negative' | 'neutral';
}

interface AnomalyDetectionConfig {
  enabledCategories: string[];
  sensitivityLevel: 'low' | 'medium' | 'high';
  thresholds: {
    [key: string]: {
      min?: number;
      max?: number;
      expectedGrowth?: number;
    };
  };
}

export const useAnomalyDetection = (jobId: string) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [config, setConfig] = useState<AnomalyDetectionConfig>({
    enabledCategories: ['kpis', 'pipeline', 'trends', 'compensation'],
    sensitivityLevel: 'medium',
    thresholds: {
      totalCandidates: { min: 50, max: 10000, expectedGrowth: 0.1 },
      qualifiedCandidates: { min: 5, max: 1000 },
      timeToFill: { min: 7, max: 90 },
      costPerHire: { min: 1000, max: 50000 },
      conversionRate: { min: 0.1, max: 0.9 },
      applicationVolume: { expectedGrowth: 0.05 }
    }
  });

  // Statistical helper functions
  const calculateMean = (values: number[]): number => {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const calculateStandardDeviation = (values: number[], mean: number): number => {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  const calculateZScore = (value: number, mean: number, stdDev: number): number => {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  };

  const detectThresholdAnomalies = (metrics: RecruitmentMetrics): Anomaly[] => {
    const anomalies: Anomaly[] = [];

    // Check KPI thresholds
    Object.entries(metrics.kpis).forEach(([key, metric]) => {
      const threshold = config.thresholds[key];
      if (!threshold) return;

      const value = typeof metric.value === 'number' ? metric.value : parseFloat(metric.value.toString());
      if (isNaN(value)) return;

      let anomaly: Anomaly | null = null;

      if (threshold.min && value < threshold.min) {
        anomaly = {
          id: `threshold_${key}_low_${Date.now()}`,
          type: 'threshold',
          severity: value < threshold.min * 0.5 ? 'critical' : 'high',
          title: `${metric.name} Below Threshold`,
          description: `${metric.name} (${value}) is below the minimum threshold of ${threshold.min}`,
          value,
          expectedValue: threshold.min,
          deviation: ((threshold.min - value) / threshold.min) * 100,
          metric: key,
          category: 'kpis',
          detectedAt: new Date(),
          impact: 'negative',
          suggestions: [
            'Review recruitment channels and sourcing strategies',
            'Increase job posting visibility and reach',
            'Consider adjusting job requirements or compensation',
            'Implement employee referral programs'
          ]
        };
      } else if (threshold.max && value > threshold.max) {
        anomaly = {
          id: `threshold_${key}_high_${Date.now()}`,
          type: 'threshold',
          severity: value > threshold.max * 1.5 ? 'critical' : 'medium',
          title: `${metric.name} Above Threshold`,
          description: `${metric.name} (${value}) exceeds the maximum threshold of ${threshold.max}`,
          value,
          expectedValue: threshold.max,
          deviation: ((value - threshold.max) / threshold.max) * 100,
          metric: key,
          category: 'kpis',
          detectedAt: new Date(),
          impact: key === 'costPerHire' || key === 'timeToFill' ? 'negative' : 'positive',
          suggestions: [
            'Review and optimize current processes',
            'Consider scaling recruitment team if needed',
            'Analyze quality vs quantity metrics',
            'Implement automation where possible'
          ]
        };
      }

      if (anomaly) {
        anomalies.push(anomaly);
      }
    });

    return anomalies;
  };

  const detectTrendAnomalies = (metrics: RecruitmentMetrics): Anomaly[] => {
    const anomalies: Anomaly[] = [];

    // Analyze application trends
    if (metrics.trends.applications.length >= 3) {
      const values = metrics.trends.applications.map(point => point.value);
      const recent = values.slice(-3);
      const earlier = values.slice(0, -3);

      if (earlier.length > 0 && recent.length > 0) {
        const recentMean = calculateMean(recent);
        const earlierMean = calculateMean(earlier);
        const changePercent = ((recentMean - earlierMean) / earlierMean) * 100;

        if (Math.abs(changePercent) > 50) {
          anomalies.push({
            id: `trend_applications_${Date.now()}`,
            type: 'trend',
            severity: Math.abs(changePercent) > 75 ? 'high' : 'medium',
            title: `Significant Application Trend Change`,
            description: `Application volume has ${changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}% recently`,
            value: recentMean,
            expectedValue: earlierMean,
            deviation: Math.abs(changePercent),
            metric: 'applicationTrend',
            category: 'trends',
            detectedAt: new Date(),
            impact: changePercent > 0 ? 'positive' : 'negative',
            suggestions: changePercent > 0 ? [
              'Prepare for increased screening workload',
              'Consider additional recruiter resources',
              'Implement automated initial screening',
              'Monitor quality metrics closely'
            ] : [
              'Review recent marketing campaigns',
              'Check job posting visibility',
              'Analyze competitor activity',
              'Consider market conditions impact'
            ]
          });
        }
      }
    }

    return anomalies;
  };

  const detectPatternAnomalies = (metrics: RecruitmentMetrics): Anomaly[] => {
    const anomalies: Anomaly[] = [];

    // Check pipeline conversion rates
    const pipelineStages = metrics.pipeline.stages;
    if (pipelineStages.length >= 2) {
      for (let i = 1; i < pipelineStages.length; i++) {
        const current = pipelineStages[i];
        const previous = pipelineStages[i - 1];
        
        if (previous.value > 0) {
          const conversionRate = current.value / previous.value;
          
          // Flag unusually low conversion rates
          if (conversionRate < 0.1 && i < pipelineStages.length - 1) {
            anomalies.push({
              id: `pattern_conversion_${i}_${Date.now()}`,
              type: 'pattern',
              severity: conversionRate < 0.05 ? 'high' : 'medium',
              title: `Low Conversion Rate Detected`,
              description: `Conversion from ${previous.name} to ${current.name} is only ${(conversionRate * 100).toFixed(1)}%`,
              value: conversionRate,
              expectedValue: 0.3, // Expected 30% conversion
              deviation: ((0.3 - conversionRate) / 0.3) * 100,
              metric: `conversion_${i}`,
              category: 'pipeline',
              detectedAt: new Date(),
              impact: 'negative',
              suggestions: [
                'Review qualification criteria',
                'Improve interview process efficiency',
                'Provide better candidate communication',
                'Analyze drop-off reasons'
              ]
            });
          }
        }
      }
    }

    // Check skills distribution imbalance
    const skills = metrics.skills.distribution;
    if (skills.length > 0) {
      const totalSkills = skills.reduce((sum, skill) => sum + skill.value, 0);
      const skillPercentages = skills.map(skill => (skill.value / totalSkills) * 100);
      
      // Flag if any skill dominates more than 60%
      skillPercentages.forEach((percentage, index) => {
        if (percentage > 60) {
          anomalies.push({
            id: `pattern_skill_dominance_${index}_${Date.now()}`,
            type: 'pattern',
            severity: percentage > 80 ? 'high' : 'medium',
            title: `Skill Distribution Imbalance`,
            description: `${skills[index].name} represents ${percentage.toFixed(1)}% of all skill requirements`,
            value: percentage,
            expectedValue: 100 / skills.length, // Expected even distribution
            deviation: percentage - (100 / skills.length),
            metric: 'skillDistribution',
            category: 'skills',
            detectedAt: new Date(),
            impact: 'neutral',
            suggestions: [
              'Consider diversifying skill requirements',
              'Review job posting accuracy',
              'Explore cross-functional roles',
              'Analyze market demand for skills'
            ]
          });
        }
      });
    }

    return anomalies;
  };

  const detectStatisticalAnomalies = (metrics: RecruitmentMetrics): Anomaly[] => {
    const anomalies: Anomaly[] = [];

    // Analyze compensation data for outliers
    const compensationRanges = metrics.compensation.ranges;
    if (compensationRanges.length >= 3) {
      const values = compensationRanges.map(range => range.value);
      const mean = calculateMean(values);
      const stdDev = calculateStandardDeviation(values, mean);

      compensationRanges.forEach(range => {
        const zScore = calculateZScore(range.value, mean, stdDev);
        
        if (Math.abs(zScore) > 2.5) { // More than 2.5 standard deviations
          anomalies.push({
            id: `statistical_compensation_${range.name}_${Date.now()}`,
            type: 'metric',
            severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
            title: `Compensation Outlier Detected`,
            description: `${range.name} compensation (${range.value}) is ${zScore > 0 ? 'significantly higher' : 'significantly lower'} than typical ranges`,
            value: range.value,
            expectedValue: mean,
            deviation: Math.abs(zScore),
            metric: 'compensation',
            category: 'compensation',
            detectedAt: new Date(),
            impact: zScore > 0 ? 'negative' : 'positive',
            suggestions: [
              'Review market compensation data',
              'Analyze role requirements and seniority',
              'Consider location-based adjustments',
              'Validate data accuracy'
            ]
          });
        }
      });
    }

    return anomalies;
  };

  const analyzeMetrics = useCallback(async (metrics: RecruitmentMetrics) => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const detectedAnomalies: Anomaly[] = [];
      
      if (config.enabledCategories.includes('kpis')) {
        detectedAnomalies.push(...detectThresholdAnomalies(metrics));
      }
      
      if (config.enabledCategories.includes('trends')) {
        detectedAnomalies.push(...detectTrendAnomalies(metrics));
      }
      
      if (config.enabledCategories.includes('pipeline')) {
        detectedAnomalies.push(...detectPatternAnomalies(metrics));
      }
      
      if (config.enabledCategories.includes('compensation')) {
        detectedAnomalies.push(...detectStatisticalAnomalies(metrics));
      }

      // Filter by sensitivity level
      const filteredAnomalies = detectedAnomalies.filter(anomaly => {
        switch (config.sensitivityLevel) {
          case 'low':
            return anomaly.severity === 'critical';
          case 'medium':
            return ['critical', 'high'].includes(anomaly.severity);
          case 'high':
            return ['critical', 'high', 'medium'].includes(anomaly.severity);
          default:
            return true;
        }
      });

      setAnomalies(filteredAnomalies);
      
    } catch (error) {
      console.error('Anomaly detection failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [config]);

  const dismissAnomaly = useCallback((anomalyId: string) => {
    setAnomalies(prev => prev.filter(anomaly => anomaly.id !== anomalyId));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<AnomalyDetectionConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const getAnomaliesByCategory = useCallback((category: string) => {
    return anomalies.filter(anomaly => anomaly.category === category);
  }, [anomalies]);

  const getAnomaliesBySeverity = useCallback((severity: Anomaly['severity']) => {
    return anomalies.filter(anomaly => anomaly.severity === severity);
  }, [anomalies]);

  const getCriticalAnomalies = useCallback(() => {
    return anomalies.filter(anomaly => anomaly.severity === 'critical');
  }, [anomalies]);

  return {
    anomalies,
    isAnalyzing,
    config,
    analyzeMetrics,
    dismissAnomaly,
    updateConfig,
    getAnomaliesByCategory,
    getAnomaliesBySeverity,
    getCriticalAnomalies
  };
};