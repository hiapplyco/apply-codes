import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Search, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LinkedInCandidateList } from '@/components/chat/LinkedInCandidateCard';
import type { ToolResultComponentProps, BooleanSearchResult } from '@/types/mcp-chat';

export const CandidateResultsGrid: React.FC<ToolResultComponentProps> = ({
  data,
  status,
  onAction,
}) => {
  const [rawOpen, setRawOpen] = useState(false);
  const result = data as BooleanSearchResult;

  if (status === 'error' || !result?.searchResults) {
    return (
      <Card className="border border-red-200 bg-red-50/50 my-2">
        <CardContent className="p-3 text-xs text-red-700">
          Search failed. Please try again with different criteria.
        </CardContent>
      </Card>
    );
  }

  const { booleanGeneration, searchResults, summary } = result;
  const candidates = searchResults?.candidates || [];
  const metadata = searchResults?.metadata;

  return (
    <Card className="border border-purple-200 bg-white shadow-sm my-2">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-900">Candidate Search</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {summary?.candidatesFound ?? candidates.length} found
            </Badge>
            {metadata?.platforms?.length > 0 && (
              <Badge variant="outline" className="text-xs capitalize">
                {metadata.platforms.join(', ')}
              </Badge>
            )}
            {metadata?.searchTime && (
              <Badge variant="outline" className="text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(metadata.searchTime).toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>

        {booleanGeneration?.query && (
          <div className="mt-2 p-2 bg-purple-50 rounded text-xs font-mono text-purple-800 break-all">
            {booleanGeneration.query}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {candidates.length > 0 && (
          <LinkedInCandidateList
            candidates={candidates}
            onSave={onAction ? (c) => onAction('save', c) : undefined}
            onGetContact={onAction ? (c) => onAction('get_contact', c) : undefined}
          />
        )}

        {summary?.stepsExecuted?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {summary.stepsExecuted.map((step, idx) => (
              <Badge key={idx} variant="outline" className="text-xs text-gray-500">
                {step}
              </Badge>
            ))}
          </div>
        )}

        <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-3">
            <ChevronDown className={cn(
              'w-3 h-3 transition-transform',
              rawOpen && 'rotate-180'
            )} />
            View raw data
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs bg-gray-50 rounded p-2 mt-1 overflow-x-auto max-h-48 overflow-y-auto font-mono text-gray-600">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default CandidateResultsGrid;
