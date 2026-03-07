import { SOURCE_CONFIGS, DEFAULT_SOURCES, type CandidateSource } from '@/types/candidate-search';
import { Linkedin, Briefcase, Code, MessageSquare, Building, Palette, Paintbrush } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Linkedin,
  Briefcase,
  Code,
  MessageSquare,
  Building,
  Palette,
  Paintbrush,
};

interface SourceSelectorProps {
  selectedSources: CandidateSource[];
  onSourcesChange: (sources: CandidateSource[]) => void;
  disabled?: boolean;
}

export function SourceSelector({ selectedSources, onSourcesChange, disabled }: SourceSelectorProps) {
  const allSources = Object.values(SOURCE_CONFIGS);
  const allSelected = selectedSources.length === allSources.length;

  const toggle = (source: CandidateSource) => {
    if (disabled) return;
    if (selectedSources.includes(source)) {
      if (selectedSources.length === 1) return; // Must have at least one
      onSourcesChange(selectedSources.filter((s) => s !== source));
    } else {
      onSourcesChange([...selectedSources, source]);
    }
  };

  const toggleAll = () => {
    if (disabled) return;
    if (allSelected) {
      onSourcesChange(DEFAULT_SOURCES);
    } else {
      onSourcesChange(allSources.map((s) => s.id));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleAll}
        disabled={disabled}
        className="text-xs text-gray-500 hover:text-purple-600 px-2 py-1 rounded border border-gray-200 hover:border-purple-300 transition-colors disabled:opacity-50"
      >
        {allSelected ? 'Reset' : 'All'}
      </button>
      {allSources.map((config) => {
        const Icon = ICON_MAP[config.icon];
        const isSelected = selectedSources.includes(config.id);

        return (
          <button
            key={config.id}
            type="button"
            onClick={() => toggle(config.id)}
            disabled={disabled}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-200 disabled:opacity-50
              ${isSelected
                ? `${config.color} text-white border-transparent shadow-sm`
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }
            `}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
