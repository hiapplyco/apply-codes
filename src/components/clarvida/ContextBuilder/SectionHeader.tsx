import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  section: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  instruction?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SectionHeader({
  title,
  section,
  icon: Icon,
  badge,
  instruction,
  isExpanded,
  onToggle,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors",
        section === 'context'
          ? "bg-gradient-to-r from-purple-100 to-purple-50 hover:from-purple-150 hover:to-purple-100"
          : "bg-gray-50 hover:bg-gray-100"
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("w-5 h-5", section === 'context' ? "text-purple-600" : "text-gray-600")} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {instruction && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">{instruction}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {badge}
      </div>
      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
    </div>
  );
}
