import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Filter, Download, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { DashboardCard } from './DashboardCard';
import { ChartDataPoint } from '../../types/dashboard';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  chartType: 'bar' | 'pie' | 'line' | 'radar' | 'heatmap' | 'funnel' | 'gauge';
  originalData?: ChartDataPoint;
  jobId: string;
  metric: string;
  segment: string;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  chartType,
  originalData,
  jobId,
  metric,
  segment
}) => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [view, setView] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export drill-down data', { jobId, metric, segment });
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    const shareUrl = `${window.location.origin}/dashboard/${jobId}/${metric}/${segment}`;
    navigator.clipboard.writeText(shareUrl);
    // TODO: Add toast notification
    console.log('Share URL copied:', shareUrl);
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: `/dashboard/${jobId}` },
    { label: title, href: null },
    { label: segment, href: null }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full h-full max-w-7xl max-h-[90vh] rounded-lg shadow-2xl border-2 border-black overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black bg-gray-50">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span>/</span>}
                    <span className={index === breadcrumbs.length - 1 ? 'font-semibold text-black' : 'hover:text-black cursor-pointer'}>
                      {crumb.label}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex border-2 border-black rounded-lg overflow-hidden">
              <button
                onClick={() => setView('chart')}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  view === 'chart' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  view === 'table' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Table
              </button>
            </div>

            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-full">
          {view === 'chart' ? (
            <div className="space-y-6">
              {/* Original Data Summary */}
              {originalData && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-black">
                  <h3 className="font-semibold text-gray-900 mb-2">Selection Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className="ml-2 font-medium">{originalData.name}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Value:</span>
                      <span className="ml-2 font-medium">{originalData.value}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Chart */}
              <div className="bg-white border-2 border-black rounded-lg p-6">
                <DashboardCard
                  title={`Detailed ${title}`}
                  subtitle={`Breakdown of ${segment}`}
                  type="chart"
                  size="large"
                  data={data}
                  chartType={chartType}
                  className="border-0 shadow-none"
                />
              </div>

              {/* Additional Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-black rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-medium">{data.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Value:</span>
                      <span className="font-medium">
                        {(data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Value:</span>
                      <span className="font-medium">
                        {Math.max(...data.map(item => item.value))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Value:</span>
                      <span className="font-medium">
                        {Math.min(...data.map(item => item.value))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-black rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Top Performers</h3>
                  <div className="space-y-3">
                    {data
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 truncate">{item.name}</span>
                          <span className="font-medium text-purple-600">{item.value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-black rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-black">
                      <th className="text-left p-4 font-semibold text-gray-900">Name</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Value</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Label</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => {
                      const total = data.reduce((sum, d) => sum + d.value, 0);
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      
                      return (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-4 font-medium text-gray-900">{item.name}</td>
                          <td className="p-4 text-gray-700">{item.value}</td>
                          <td className="p-4 text-gray-700">{item.label || item.name}</td>
                          <td className="p-4 text-gray-700">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};