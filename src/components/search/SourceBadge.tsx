import { SOURCE_CONFIGS, type CandidateSource } from '@/types/candidate-search';
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

interface SourceBadgeProps {
  source: CandidateSource;
  size?: 'sm' | 'md';
}

export function SourceBadge({ source, size = 'sm' }: SourceBadgeProps) {
  const config = SOURCE_CONFIGS[source];
  if (!config) return null;

  const Icon = ICON_MAP[config.icon];
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${config.color} ${sizeClasses}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
      {config.label}
    </span>
  );
}
