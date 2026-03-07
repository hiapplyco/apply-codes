import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface ExtractionProgressPanelProps {
  contextItems: any[];
  extractionState: any;
  optimizationState: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ExtractionProgressPanel({
  contextItems,
  extractionState,
  optimizationState,
  isExpanded,
  onToggleExpand,
}: ExtractionProgressPanelProps) {
  const completedCount = contextItems.filter(
    (item: any) => extractionState?.completed?.includes(item.id)
  ).length;

  const isProcessing = extractionState?.isExtracting || optimizationState?.isOptimizing;

  return (
    <Card className="border border-purple-100 bg-purple-50/30">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-3 text-sm"
      >
        <span className="flex items-center gap-2 text-purple-700 font-medium">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : completedCount === contextItems.length ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          Extraction Progress ({completedCount}/{contextItems.length})
        </span>
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1">
          {contextItems.map((item: any) => {
            const isDone = extractionState?.completed?.includes(item.id);
            const isFailed = extractionState?.failed?.includes(item.id);
            return (
              <div key={item.id} className="flex items-center gap-2 text-xs text-gray-600">
                {isDone ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : isFailed ? (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                ) : (
                  <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                )}
                <span className="truncate">{item.title || item.file_name || 'Item'}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
