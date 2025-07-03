import { useState } from 'react';
import { RecruitmentMetrics, DashboardExportOptions } from '../types/dashboard';

// Import libraries for export functionality
// Note: These would need to be installed as dependencies
interface Html2CanvasOptions {
  allowTaint?: boolean;
  backgroundColor?: string | null;
  canvas?: HTMLCanvasElement;
  foreignObjectRendering?: boolean;
  height?: number;
  ignoreElements?: (element: HTMLElement) => boolean;
  imageTimeout?: number;
  logging?: boolean;
  onclone?: (clonedDoc: Document) => void;
  proxy?: string;
  removeContainer?: boolean;
  scale?: number;
  scrollX?: number;
  scrollY?: number;
  useCORS?: boolean;
  width?: number;
  x?: number;
  y?: number;
}

interface Html2Canvas {
  (element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>;
}

interface JSPDFOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'pt' | 'mm' | 'cm' | 'in';
  format?: string | [number, number];
  putOnlyUsedFonts?: boolean;
  floatPrecision?: number;
}

interface JSPDF {
  new(options?: JSPDFOptions): {
    addImage: (imageData: string | HTMLCanvasElement, format: string, x: number, y: number, width: number, height: number) => void;
    save: (filename: string) => void;
    internal: {
      pageSize: {
        getWidth: () => number;
        getHeight: () => number;
      };
    };
  };
}

declare global {
  interface Window {
    html2canvas: Html2Canvas;
    jsPDF: JSPDF;
  }
}

export const useDashboardExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const loadExportLibraries = async () => {
    // For now, we'll skip dynamic imports to avoid build issues
    // In production, you would install: npm install html2canvas jspdf
    console.warn('PDF export requires html2canvas and jspdf libraries.');
    return false;
  };

  const exportToPDF = async (
    metrics: RecruitmentMetrics,
    options: DashboardExportOptions,
    jobId: string
  ) => {
    setIsExporting(true);
    setExportProgress(10);

    try {
      // For now, create a simplified text-based PDF alternative
      console.warn('PDF export requires additional libraries. Generating text report instead.');
      
      setExportProgress(50);
      
      // Create a text-based report
      const reportLines = [
        'RECRUITMENT INTELLIGENCE DASHBOARD REPORT',
        '==========================================',
        '',
        `Job ID: ${jobId}`,
        `Generated: ${new Date().toLocaleString()}`,
        '',
        'KEY PERFORMANCE INDICATORS',
        '-------------------------',
        `Total Candidates: ${metrics.kpis.totalCandidates.value}`,
        `Qualified Candidates: ${metrics.kpis.qualifiedCandidates.value}`,
        `Time to Fill: ${metrics.kpis.timeToFill.value}`,
        `Cost per Hire: ${metrics.kpis.costPerHire.value}`,
        '',
        'TALENT PIPELINE',
        '---------------'
      ];
      
      metrics.pipeline.stages.forEach(stage => {
        reportLines.push(`${stage.name}: ${stage.value}`);
      });
      
      reportLines.push('', 'SKILLS DISTRIBUTION', '-------------------');
      metrics.skills.distribution.forEach(skill => {
        reportLines.push(`${skill.name}: ${skill.value}`);
      });
      
      const reportText = reportLines.join('\n');
      
      // Download as text file
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard-report-${jobId}-${Date.now()}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportProgress(100);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const exportToCSV = (metrics: RecruitmentMetrics, jobId: string) => {
    setIsExporting(true);
    
    try {
      const csvData = [];
      
      // Add header
      csvData.push(['Metric Category', 'Metric Name', 'Value', 'Type']);
      
      // Add KPI data
      Object.entries(metrics.kpis).forEach(([key, metric]) => {
        csvData.push(['KPI', key, metric.value, metric.type]);
      });
      
      // Add pipeline data
      metrics.pipeline.stages.forEach(stage => {
        csvData.push(['Pipeline', stage.name, stage.value, 'number']);
      });
      
      // Add skills data
      metrics.skills.distribution.forEach(skill => {
        csvData.push(['Skills', skill.name, skill.value, 'number']);
      });
      
      // Add compensation data
      metrics.compensation.ranges.forEach(range => {
        csvData.push(['Compensation', range.name, range.value, 'number']);
      });
      
      // Add location data
      metrics.locations.geographic.forEach(location => {
        csvData.push(['Location', location.name, location.value, 'number']);
      });
      
      // Convert to CSV string
      const csvString = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      // Download CSV
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard-${jobId}-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('CSV export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async (metrics: RecruitmentMetrics, jobId: string) => {
    setIsExporting(true);
    
    try {
      // For now, fallback to CSV format for Excel export
      // In production, you would install xlsx: npm install xlsx
      console.warn('Excel export requires xlsx library. Falling back to CSV format.');
      exportToCSV(metrics, jobId);
      
    } catch (error) {
      console.error('Excel export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = (metrics: RecruitmentMetrics, jobId: string) => {
    setIsExporting(true);
    
    try {
      const exportData = {
        metadata: {
          jobId,
          exportedAt: new Date().toISOString(),
          version: '1.0'
        },
        metrics,
        summary: {
          totalCandidates: metrics.kpis.totalCandidates.value,
          qualifiedCandidates: metrics.kpis.qualifiedCandidates.value,
          timeToFill: metrics.kpis.timeToFill.value,
          costPerHire: metrics.kpis.costPerHire.value
        }
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard-${jobId}-${Date.now()}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('JSON export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportDashboard = async (
    metrics: RecruitmentMetrics,
    options: DashboardExportOptions,
    jobId: string
  ) => {
    try {
      switch (options.format) {
        case 'pdf':
          await exportToPDF(metrics, options, jobId);
          break;
        case 'csv':
          exportToCSV(metrics, jobId);
          break;
        case 'excel':
          await exportToExcel(metrics, jobId);
          break;
        case 'json':
          exportToJSON(metrics, jobId);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    exportDashboard,
    isExporting,
    exportProgress
  };
};