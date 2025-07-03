import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Download, Settings, AlertCircle, Filter, Share2 } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { DashboardGrid } from './DashboardGrid';
import { DrillDownModal } from './DrillDownModal';
import { DashboardFilters as FiltersModal } from './DashboardFilters';
import { ExportModal } from './ExportModal';
import { ShareModal } from './ShareModal';
import { AnomalyList } from './AnomalyAlert';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Button } from '../ui/button';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { useDrillDown } from '../../hooks/useDrillDown';
import { useDashboardExport } from '../../hooks/useDashboardExport';
import { useAnomalyDetection } from '../../hooks/useAnomalyDetection';
import { DashboardState, DashboardFilters, DashboardExportOptions } from '../../types/dashboard';

interface DashboardProps {
  jobId: string;
  title?: string;
  refreshInterval?: number;
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  jobId,
  title = "Recruitment Intelligence Dashboard",
  refreshInterval = 30000,
  className = ""
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAnomalies, setShowAnomalies] = useState(true);

  const {
    data: metrics,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useDashboardMetrics(jobId, {
    enabled: !!jobId,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { drillDownState, closeDrillDown, handleChartClick } = useDrillDown(jobId);
  const { exportDashboard, isExporting, exportProgress } = useDashboardExport();
  const { 
    anomalies, 
    isAnalyzing, 
    analyzeMetrics, 
    dismissAnomaly,
    getCriticalAnomalies 
  } = useAnomalyDetection(jobId);

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = async (options: DashboardExportOptions) => {
    if (!metrics) {
      return { success: false, error: 'No data available to export' };
    }
    
    return await exportDashboard(metrics, options, jobId);
  };

  const handleSettings = () => {
    // TODO: Implement settings modal
    console.log('Open dashboard settings');
  };

  const handleApplyFilters = () => {
    // Trigger data refresh with new filters
    refetch();
  };

  // Run anomaly detection when metrics are updated
  useEffect(() => {
    if (metrics && !isLoading && !error) {
      analyzeMetrics(metrics);
    }
  }, [metrics, isLoading, error, analyzeMetrics]);

  const hasActiveFilters = () => {
    if (!filters) return false;
    return filters.locations.length > 0 ||
           filters.experienceLevels.length > 0 ||
           filters.skills.length > 0 ||
           filters.salaryRange.min > 0 ||
           filters.salaryRange.max < 300000;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading dashboard metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Dashboard Error
        </h3>
        <p className="text-gray-600 text-center mb-4">
          Unable to load dashboard metrics. Please try again.
        </p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600 mb-4">
            Generate an analysis report to see dashboard metrics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`dashboard-container ${className}`}>
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-gray-600 text-sm">
                Last updated: {metrics.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'Never'}
              </p>
              {hasActiveFilters() && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full border border-purple-300">
                  <Filter className="w-3 h-3 mr-1" />
                  Filters Active
                </span>
              )}
              {isAnalyzing && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-300">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                  Analyzing...
                </span>
              )}
              {anomalies.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full border border-red-300">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {anomalies.length} Anomal{anomalies.length !== 1 ? 'ies' : 'y'}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            
            <Button
              onClick={() => setShowFilters(true)}
              variant="outline"
              size="sm"
              className={`border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                hasActiveFilters() ? 'bg-purple-100 border-purple-600' : ''
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters() && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-purple-600 rounded-full">
                  {(filters?.locations.length || 0) + (filters?.experienceLevels.length || 0) + (filters?.skills.length || 0)}
                </span>
              )}
            </Button>
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefetching}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              onClick={() => setShowShare(true)}
              variant="outline"
              size="sm"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              disabled={!metrics}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            <Button
              onClick={() => setShowExport(true)}
              variant="outline"
              size="sm"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              disabled={!metrics || isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
              {isExporting && (
                <span className="ml-2 inline-flex items-center justify-center w-4 h-4">
                  <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </span>
              )}
            </Button>
            
            <Button
              onClick={handleSettings}
              variant="outline"
              size="sm"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="Total Candidates"
            type="metric"
            size="small"
            data={metrics.kpis.totalCandidates}
          />
          <DashboardCard
            title="Qualified Candidates"
            type="metric"
            size="small"
            data={metrics.kpis.qualifiedCandidates}
          />
          <DashboardCard
            title="Time to Fill"
            type="metric"
            size="small"
            data={metrics.kpis.timeToFill}
          />
          <DashboardCard
            title="Cost per Hire"
            type="metric"
            size="small"
            data={metrics.kpis.costPerHire}
          />
        </div>

        {/* Main Dashboard Grid */}
        <DashboardGrid>
          {/* Talent Pipeline */}
          <DashboardCard
            title="Talent Pipeline"
            subtitle="Candidate funnel progression"
            type="chart"
            size="large"
            data={metrics.pipeline.stages}
            chartType="funnel"
            className="col-span-2"
            onChartClick={(data) => handleChartClick(data, 'funnel', 'pipeline', 'Talent Pipeline')}
          />

          {/* Skills Distribution */}
          <DashboardCard
            title="Skills Distribution"
            subtitle="Most demanded skills"
            type="chart"
            size="medium"
            data={metrics.skills.distribution}
            chartType="pie"
            onChartClick={(data) => handleChartClick(data, 'pie', 'skills', 'Skills Distribution')}
          />

          {/* Compensation Analysis */}
          <DashboardCard
            title="Compensation Ranges"
            subtitle="Salary distribution"
            type="chart"
            size="medium"
            data={metrics.compensation.ranges}
            chartType="bar"
            onChartClick={(data) => handleChartClick(data, 'bar', 'compensation', 'Compensation Ranges')}
          />

          {/* Location Heat Map */}
          <DashboardCard
            title="Talent Locations"
            subtitle="Geographic distribution"
            type="chart"
            size="large"
            data={metrics.locations.geographic}
            chartType="heatmap"
            className="col-span-2"
            onChartClick={(data) => handleChartClick(data, 'heatmap', 'locations', 'Talent Locations')}
          />

          {/* Trend Analysis */}
          <DashboardCard
            title="Application Trends"
            subtitle="Applications over time"
            type="chart"
            size="medium"
            data={metrics.trends.applications}
            chartType="line"
            onChartClick={(data) => handleChartClick(data, 'line', 'trends', 'Application Trends')}
          />

          {/* Predictive Insights */}
          <DashboardCard
            title="Success Probability"
            subtitle="Hiring success prediction"
            type="chart"
            size="medium"
            data={metrics.predictions.successProbability}
            chartType="gauge"
            onChartClick={(data) => handleChartClick(data, 'gauge', 'predictions', 'Success Probability')}
          />
        </DashboardGrid>
      </div>

      {/* Filters Modal */}
      <FiltersModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        jobId={jobId}
        dashboardTitle={title}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExport={handleExport}
        isExporting={isExporting}
        exportProgress={exportProgress}
      />

      {/* Drill Down Modal */}
      {drillDownState && (
        <DrillDownModal
          isOpen={drillDownState.isOpen}
          onClose={closeDrillDown}
          title={drillDownState.title}
          subtitle={drillDownState.subtitle}
          data={drillDownState.data}
          chartType={drillDownState.chartType}
          originalData={drillDownState.originalData}
          jobId={drillDownState.jobId}
          metric={drillDownState.metric}
          segment={drillDownState.segment}
        />
      )}

      {/* Anomaly Detection Alerts */}
      <AnomalyList
        anomalies={anomalies}
        onDismiss={dismissAnomaly}
        isVisible={showAnomalies}
        onToggleVisibility={() => setShowAnomalies(!showAnomalies)}
      />
    </>
  );
};