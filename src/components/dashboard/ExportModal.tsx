import React, { useState } from 'react';
import { Download, FileText, Table, File, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Button } from '../ui/button';
import { DashboardExportOptions } from '../../types/dashboard';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: DashboardExportOptions) => Promise<{ success: boolean; error?: string }>;
  isExporting: boolean;
  exportProgress: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting,
  exportProgress
}) => {
  const [exportOptions, setExportOptions] = useState<DashboardExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeRawData: false
  });

  const [exportStatus, setExportStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  React.useEffect(() => {
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

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Comprehensive dashboard report with charts',
      icon: FileText,
      features: ['Visual charts', 'Professional layout', 'Print-ready']
    },
    {
      id: 'csv',
      name: 'CSV Data',
      description: 'Raw data in comma-separated format',
      icon: Table,
      features: ['Raw metrics', 'Excel compatible', 'Easy analysis']
    },
    {
      id: 'excel',
      name: 'Excel Workbook',
      description: 'Multi-sheet Excel file with organized data',
      icon: Table,
      features: ['Multiple sheets', 'Formatted data', 'Charts included']
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Machine-readable structured data',
      icon: File,
      features: ['API compatible', 'Complete dataset', 'Developer friendly']
    }
  ];

  const handleFormatChange = (format: DashboardExportOptions['format']) => {
    setExportOptions(prev => ({ ...prev, format }));
    setExportStatus({ type: 'idle' });
  };

  const handleExport = async () => {
    setExportStatus({ type: 'idle' });
    
    try {
      const result = await onExport(exportOptions);
      
      if (result.success) {
        setExportStatus({ 
          type: 'success', 
          message: `Dashboard exported successfully as ${exportOptions.format.toUpperCase()}!` 
        });
      } else {
        setExportStatus({ 
          type: 'error', 
          message: result.error || 'Export failed. Please try again.' 
        });
      }
    } catch (error) {
      setExportStatus({ 
        type: 'error', 
        message: 'Export failed. Please try again.' 
      });
    }
  };

  const canIncludeCharts = exportOptions.format === 'pdf' || exportOptions.format === 'excel';
  const canIncludeRawData = true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-lg shadow-2xl border-2 border-black overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black bg-gray-50">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Export Dashboard</h2>
              <p className="text-gray-600">Download your recruitment analytics</p>
            </div>
          </div>

          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            disabled={isExporting}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Export Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportFormats.map(format => {
                const Icon = format.icon;
                const isSelected = exportOptions.format === format.id;
                
                return (
                  <button
                    key={format.id}
                    onClick={() => handleFormatChange(format.id as DashboardExportOptions['format'])}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 shadow-[2px_2px_0px_0px_rgba(139,92,246,1)]'
                        : 'border-black bg-white hover:bg-gray-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                    disabled={isExporting}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`w-6 h-6 mt-1 ${isSelected ? 'text-purple-600' : 'text-gray-600'}`} />
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                          {format.name}
                        </h4>
                        <p className={`text-sm mt-1 ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                          {format.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {format.features.map(feature => (
                            <span
                              key={feature}
                              className={`text-xs px-2 py-1 rounded-full ${
                                isSelected
                                  ? 'bg-purple-200 text-purple-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCharts}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  disabled={!canIncludeCharts || isExporting}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className={`font-medium ${canIncludeCharts ? 'text-gray-900' : 'text-gray-400'}`}>
                    Include Charts
                  </span>
                  <p className="text-sm text-gray-600">
                    {canIncludeCharts 
                      ? 'Export visual charts and graphs along with data'
                      : 'Charts not available for this format'
                    }
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeRawData}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeRawData: e.target.checked }))}
                  disabled={!canIncludeRawData || isExporting}
                  className="w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className={`font-medium ${canIncludeRawData ? 'text-gray-900' : 'text-gray-400'}`}>
                    Include Raw Data
                  </span>
                  <p className="text-sm text-gray-600">
                    Include detailed raw metrics and data points
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 text-purple-600 animate-spin" />
                <span className="text-sm font-medium text-gray-900">Exporting dashboard...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 border border-gray-300">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 text-center">
                {exportProgress}% complete
              </div>
            </div>
          )}

          {/* Export Status */}
          {exportStatus.type !== 'idle' && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 ${
              exportStatus.type === 'success' 
                ? 'bg-green-50 border-green-300 text-green-800'
                : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              {exportStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{exportStatus.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 border-black bg-gray-50">
          <div className="text-sm text-gray-600">
            Export format: <span className="font-medium capitalize">{exportOptions.format}</span>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              disabled={isExporting}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleExport}
              className="bg-purple-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-700"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Dashboard
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};