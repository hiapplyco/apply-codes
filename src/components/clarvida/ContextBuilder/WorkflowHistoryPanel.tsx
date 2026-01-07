/**
 * WorkflowHistoryPanel
 *
 * Displays saved workflow history for the current user/organization.
 * Allows viewing, copying, and restoring previous workflows.
 */

import { useEffect, useState } from 'react';
import { useWorkflowHistory, WorkflowHistoryItem } from '@/hooks/useWorkflowHistory';
import { useClarvidaAuth } from '@/context/ClarvidaAuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  Star,
  StarOff,
  Trash2,
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  FileText,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface WorkflowHistoryPanelProps {
  onRestoreWorkflow?: (item: WorkflowHistoryItem) => void;
  className?: string;
}

export function WorkflowHistoryPanel({
  onRestoreWorkflow,
  className = '',
}: WorkflowHistoryPanelProps) {
  const { user, organization } = useClarvidaAuth();
  const {
    workflowHistory,
    loading,
    loadingMore,
    hasMore,
    fetchHistory,
    loadMore,
    toggleFavorite,
    deleteWorkflow,
  } = useWorkflowHistory({
    userId: user?.uid,
    organizationId: organization?.id,
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch history on mount
  useEffect(() => {
    if (user?.uid && organization?.id) {
      fetchHistory();
    }
  }, [user?.uid, organization?.id, fetchHistory]);

  const handleCopyBoolean = async (booleanString: string) => {
    try {
      await navigator.clipboard.writeText(booleanString);
      toast.success('Boolean copied to clipboard');
    } catch (error) {
      console.error('[WorkflowHistoryPanel] Copy failed:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteWorkflow(id);
    setDeletingId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getVariantColor = (variant: string) => {
    switch (variant) {
      case 'strict':
        return 'bg-red-100 text-red-700';
      case 'broad':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (!user || !organization) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Sign in to view workflow history</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#0B5B5E]" />
          <h3 className="font-semibold text-gray-900">Workflow History</h3>
          {workflowHistory.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {workflowHistory.length}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchHistory()}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 max-h-[500px]">
        {loading && workflowHistory.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#0B5B5E]" />
          </div>
        ) : workflowHistory.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">No saved workflows yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Your generated job descriptions and boolean searches will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {workflowHistory.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                {/* Main Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.jobTitle || 'Untitled Job'}
                      </h4>
                      <Badge className={getVariantColor(item.booleanVariant)} variant="secondary">
                        {item.booleanVariant}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.jobLocation || 'No location'} •{' '}
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleFavorite(item.id, item.isFavorite)}
                    >
                      {item.isFavorite ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleExpand(item.id)}
                    >
                      {expandedId === item.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === item.id && (
                  <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Boolean String */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <Search className="h-3 w-3" /> Boolean Search
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleCopyBoolean(item.booleanSearchString)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-gray-100 rounded-md p-3 text-xs font-mono text-gray-700 break-all max-h-24 overflow-y-auto">
                        {item.booleanSearchString}
                      </div>
                    </div>

                    {/* Job Description Preview */}
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">Job Description</span>
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-3">
                        {item.generatedDescription.slice(0, 200)}
                        {item.generatedDescription.length > 200 ? '...' : ''}
                      </div>
                    </div>

                    {/* History count */}
                    {item.booleanHistory.length > 1 && (
                      <div className="text-xs text-gray-500">
                        <History className="h-3 w-3 inline mr-1" />
                        {item.booleanHistory.length} boolean variations generated
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {onRestoreWorkflow && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => onRestoreWorkflow(item)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Load Workflow
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="p-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Load More
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
