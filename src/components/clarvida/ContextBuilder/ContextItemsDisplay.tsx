import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Link2,
  Sparkles,
  MapPin,
  Type,
  ExternalLink
} from 'lucide-react';
import { ContextItemsDisplayProps, ContextItem } from './types';
import { cn } from '@/lib/utils';

// Icon mapping for context item types
const ITEM_ICONS: Record<ContextItem['type'], React.ComponentType<{ className?: string }>> = {
  file_upload: FileText,
  url_scrape: Link2,
  perplexity_search: Sparkles,
  location_input: MapPin,
  manual_input: Type,
};

// Color mapping for context item types
const ITEM_COLORS: Record<ContextItem['type'], string> = {
  file_upload: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  url_scrape: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
  perplexity_search: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100',
  location_input: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
  manual_input: 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100',
};

// Icon color mapping
const ICON_COLORS: Record<ContextItem['type'], string> = {
  file_upload: 'text-emerald-600',
  url_scrape: 'text-blue-600',
  perplexity_search: 'text-purple-600',
  location_input: 'text-amber-600',
  manual_input: 'text-gray-600',
};

// Type labels
const TYPE_LABELS: Record<ContextItem['type'], string> = {
  file_upload: 'File',
  url_scrape: 'URL',
  perplexity_search: 'AI Search',
  location_input: 'Location',
  manual_input: 'Text',
};

export function ContextItemsDisplay({ items, onRemove }: ContextItemsDisplayProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  if (items.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Collected Context ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h4>
        {items.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (expandedItems.size === items.length) {
                setExpandedItems(new Set());
              } else {
                setExpandedItems(new Set(items.map(i => i.id)));
              }
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {expandedItems.size === items.length ? 'Collapse All' : 'Expand All'}
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {items.map(item => {
          const Icon = ITEM_ICONS[item.type];
          const isExpanded = expandedItems.has(item.id);
          const colorClasses = ITEM_COLORS[item.type];
          const iconColor = ICON_COLORS[item.type];

          return (
            <Card
              key={item.id}
              className={cn(
                'p-3 border transition-colors cursor-pointer',
                colorClasses
              )}
              onClick={() => toggleExpand(item.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn('p-1.5 rounded', iconColor)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {item.title.replace(/^(File|URL|Search|Location): /, '')}
                      </p>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        'bg-white/50'
                      )}>
                        {TYPE_LABELS[item.type]}
                      </span>
                    </div>

                    {!isExpanded && item.summary && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {item.summary}
                      </p>
                    )}

                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            {item.source_url}
                          </a>
                        )}
                        {item.file_name && (
                          <p className="text-xs text-gray-500">
                            File: {item.file_name}
                          </p>
                        )}
                        <div className="bg-white/70 border border-gray-200 rounded p-2 max-h-40 overflow-y-auto">
                          <p className="text-xs text-gray-700 whitespace-pre-wrap">
                            {item.content.substring(0, 800)}
                            {item.content.length > 800 && (
                              <span className="text-gray-400">
                                ... ({item.content.length - 800} more characters)
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          Added {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(item.id);
                    }}
                    className="h-6 w-6 p-0 hover:bg-white/50"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default ContextItemsDisplay;
