import { SOURCE_CONFIGS, type CandidateSource, type SourceSearchResult } from '@/types/candidate-search';

interface SourceTabsProps {
  sources: SourceSearchResult[];
  activeTab: CandidateSource | 'all';
  onTabChange: (tab: CandidateSource | 'all') => void;
}

export function SourceTabs({ sources, activeTab, onTabChange }: SourceTabsProps) {
  const totalCount = sources.reduce((sum, s) => sum + s.results.length, 0);
  const successfulSources = sources.filter((s) => s.status === 'fulfilled' && s.results.length > 0);

  if (successfulSources.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      <button
        type="button"
        onClick={() => onTabChange('all')}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          ${activeTab === 'all'
            ? 'bg-purple-600 text-white shadow-sm'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
      >
        All
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === 'all' ? 'bg-white/20' : 'bg-gray-200'}`}>
          {totalCount}
        </span>
      </button>
      {successfulSources.map((sourceResult) => {
        const config = SOURCE_CONFIGS[sourceResult.source];
        const isActive = activeTab === sourceResult.source;

        return (
          <button
            key={sourceResult.source}
            type="button"
            onClick={() => onTabChange(sourceResult.source)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${isActive
                ? `${config.color} text-white shadow-sm`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {config.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-200'}`}>
              {sourceResult.results.length}
            </span>
            {sourceResult.status === 'rejected' && (
              <span className="text-red-400 text-[10px]" title={sourceResult.error}>!</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
