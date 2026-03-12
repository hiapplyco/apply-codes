import { Globe, FileText, Sparkles, MapPin, Eye, EyeOff, Trash2 } from 'lucide-react';
import { PerplexityResult } from '@/components/perplexity/PerplexityResult';
import { FirecrawlResult } from '@/components/firecrawl/FirecrawlResult';
import type { ContextItem } from '@/types/search-form';

interface ContextItemCardProps {
  item: ContextItem;
  onToggleExpansion: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ContextItemCard({ item, onToggleExpansion, onRemove }: ContextItemCardProps) {
  // Determine card styling based on type
  const isPerplexity = item.type === 'perplexity' || item.type === 'perplexity_search';
  const isUrlScrape = item.type === 'url_scrape';
  const isFileUpload = item.type === 'file_upload';
  const isLocation = item.type === 'manual_input' && item.title?.includes('Location:');
  const isLocationInput = item.type === 'location_input';

  const cardColors = isPerplexity
    ? { icon: 'bg-purple-100 text-purple-600', border: 'border-gray-100' }
    : isUrlScrape
    ? { icon: 'bg-blue-100 text-blue-600', border: 'border-gray-100' }
    : isFileUpload
    ? { icon: 'bg-emerald-100 text-emerald-600', border: 'border-gray-100' }
    : (isLocation || isLocationInput)
    ? { icon: 'bg-amber-100 text-amber-600', border: 'border-gray-100' }
    : { icon: 'bg-gray-100 text-gray-600', border: 'border-gray-100' };

  const typeLabel = isPerplexity ? 'AI Research' : isUrlScrape ? 'Web Scrape' : isFileUpload ? 'Document' : (isLocation || isLocationInput) ? 'Location' : 'Note';

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border ${cardColors.border} bg-white shadow-sm
        hover:shadow-md transition-all duration-200`}
    >
      <div className="p-3.5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Icon Badge */}
            <div className={`flex items-center justify-center w-7 h-7 rounded-md ${cardColors.icon} flex-shrink-0`}>
              {isUrlScrape && <Globe className="w-4 h-4" />}
              {isFileUpload && <FileText className="w-4 h-4" />}
              {isPerplexity && <Sparkles className="w-4 h-4" />}
              {(isLocation || isLocationInput) && <MapPin className="w-4 h-4" />}
              {!isUrlScrape && !isFileUpload && !isPerplexity && !isLocation && !isLocationInput && <FileText className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-gray-900 truncate block">
                {item.title}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{typeLabel}</span>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-1 ml-2 opacity-60 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onToggleExpansion(item.id)}
              className="text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              title={item.isExpanded ? 'Collapse' : 'Expand'}
            >
              {item.isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onRemove(item.id)}
              className="text-gray-500 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Preview text with gradient fade */}
        <div className="relative">
          <p className="text-xs text-gray-600 line-clamp-2 pr-4">
            {(() => {
              const previewText = item.summary || item.content;
              if (isPerplexity) {
                const stripped = previewText
                  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                  .replace(/[#*_`~]/g, '')
                  .replace(/\n+/g, ' ')
                  .trim();
                return stripped.substring(0, 150) + (stripped.length > 150 ? '...' : '');
              }
              return previewText.substring(0, 120) + (previewText.length > 120 ? '...' : '');
            })()}
          </p>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent" />
        </div>

        {/* Footer - Source info */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 mt-3 pt-2 border-t border-gray-100">
          <span className="truncate max-w-[60%]">
            {isUrlScrape && item.source_url && (() => {
              try {
                const url = item.source_url!.startsWith('http') ? item.source_url! : `https://${item.source_url}`;
                return <span title={item.source_url} className="text-blue-600">{new URL(url).hostname}</span>;
              } catch {
                const hostname = item.source_url!.replace(/^https?:\/\//, '').split('/')[0];
                return <span title={item.source_url} className="text-blue-600">{hostname}</span>;
              }
            })()}
            {isFileUpload && item.file_name && (
              <span className="text-emerald-600">{item.file_name}</span>
            )}
            {isPerplexity && (
              <span className="text-purple-600">Perplexity AI</span>
            )}
            {(isLocation || isLocationInput) && (
              <span className="text-amber-600">Google Maps</span>
            )}
          </span>
          <span className="text-gray-400">{new Date(item.created_at as string | number | Date).toLocaleDateString()}</span>
        </div>

        {/* Expanded content */}
        {item.isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {isPerplexity ? (
              <div className="max-h-96 overflow-y-auto rounded-lg bg-white border p-2">
                <PerplexityResult
                  content={item.content}
                  citations={item.metadata?.citations}
                  query={item.metadata?.query || item.title}
                  compact={false}
                  className="text-xs"
                />
              </div>
            ) : isUrlScrape ? (
              <div className="max-h-96 overflow-y-auto rounded-lg bg-white border p-2">
                <FirecrawlResult
                  content={item.content}
                  sourceUrl={item.source_url}
                  compact={false}
                  className="text-xs"
                />
              </div>
            ) : (
              <>
                <div className="max-h-32 overflow-y-auto text-xs text-gray-700 bg-white p-3 rounded-lg border">
                  {item.content}
                </div>
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    View original source
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
