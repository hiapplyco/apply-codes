/**
 * BooleanSearchPanel Component
 *
 * Displays the generated boolean search string with:
 * - Copy to clipboard
 * - Re-roll to generate variations
 * - Variant selection (Strict, Balanced, Broad)
 * - History browser for previous generations
 * - Explanation of boolean components
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Copy,
  Check,
  RefreshCw,
  History,
  ChevronDown,
  Search,
  Loader2,
  Sparkles,
  Target,
  Maximize2,
  Minimize2,
  Info,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BooleanState, BooleanHistoryEntry, BooleanExplanation } from './ContextBuilder/workflowTypes';

interface BooleanSearchPanelProps {
  booleanState: BooleanState;
  onReroll: (variant?: 'strict' | 'balanced' | 'broad') => Promise<string | null>;
  onSetVariant: (variant: 'strict' | 'balanced' | 'broad') => Promise<string | null>;
  onRestoreFromHistory: (historyId: string) => void;
  canGenerate: boolean;
  className?: string;
}

const VARIANT_CONFIG = {
  strict: {
    label: 'Strict',
    description: 'Precise matching, fewer results',
    icon: Target,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
  balanced: {
    label: 'Balanced',
    description: 'Good mix of precision and volume',
    icon: Zap,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  broad: {
    label: 'Broad',
    description: 'Maximum reach, more results',
    icon: Maximize2,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
};

export function BooleanSearchPanel({
  booleanState,
  onReroll,
  onSetVariant,
  onRestoreFromHistory,
  canGenerate,
  className,
}: BooleanSearchPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleCopy = async () => {
    if (booleanState.current) {
      await navigator.clipboard.writeText(booleanState.current);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentVariantConfig = VARIANT_CONFIG[booleanState.variant];

  // Loading state
  if (booleanState.isGenerating) {
    return (
      <Card className={cn("border-2 border-purple-200 bg-purple-50/30", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-medium text-purple-900">Generating Boolean Search...</p>
              <p className="text-sm text-purple-600 mt-1">
                Analyzing job context and creating recruiter-grade search string
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!booleanState.current) {
    return (
      <Card className={cn("border-2 border-dashed border-gray-300 bg-gray-50/50", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium">No Boolean Search Yet</p>
            <p className="text-sm mt-1 text-center max-w-md">
              Generate a job description first, then a sophisticated boolean search string will be created automatically
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-2 shadow-lg transition-all",
      currentVariantConfig.color.split(' ')[2],
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5" />
            Boolean Search String
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Variant Badge */}
            <Badge
              variant="outline"
              className={cn("font-medium", currentVariantConfig.color)}
            >
              <currentVariantConfig.icon className="w-3 h-3 mr-1" />
              {currentVariantConfig.label}
            </Badge>

            {/* History count */}
            {booleanState.history.length > 1 && (
              <Badge variant="secondary" className="text-xs">
                {booleanState.history.length} versions
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Boolean String Display */}
        <div className="relative">
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap break-words">{booleanState.current}</pre>
          </div>

          {/* Copy Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Re-roll Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReroll()}
            disabled={booleanState.isGenerating}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-roll
          </Button>

          {/* Variant Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Target className="w-4 h-4 mr-2" />
                Change Variant
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Search Precision</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(VARIANT_CONFIG).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onSetVariant(key as 'strict' | 'balanced' | 'broad')}
                  className={cn(
                    "cursor-pointer",
                    booleanState.variant === key && "bg-gray-100"
                  )}
                >
                  <config.icon className="w-4 h-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs text-gray-500">{config.description}</span>
                  </div>
                  {booleanState.variant === key && (
                    <Check className="w-4 h-4 ml-auto text-green-600" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* History Dropdown */}
          {booleanState.history.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="w-4 h-4 mr-2" />
                  History
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-64 overflow-y-auto">
                <DropdownMenuLabel>Previous Generations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {booleanState.history.slice().reverse().map((entry, index) => (
                  <DropdownMenuItem
                    key={entry.id}
                    onClick={() => onRestoreFromHistory(entry.id)}
                    className="cursor-pointer flex-col items-start"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", VARIANT_CONFIG[entry.variant].color)}
                      >
                        {VARIANT_CONFIG[entry.variant].label}
                      </Badge>
                      {entry.isReroll && (
                        <Badge variant="secondary" className="text-xs">
                          Re-roll
                        </Badge>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {index === 0 ? 'Current' : `v${booleanState.history.length - index}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 font-mono">
                      {entry.searchString.substring(0, 100)}...
                    </p>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Toggle Explanation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExplanation(!showExplanation)}
            className="ml-auto"
          >
            <Info className="w-4 h-4 mr-2" />
            {showExplanation ? 'Hide' : 'Show'} Breakdown
          </Button>
        </div>

        {/* Explanation Section */}
        {showExplanation && booleanState.explanation && (
          <BooleanBreakdown explanation={booleanState.explanation} />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Boolean Breakdown Component
 * Shows detailed explanation of boolean components
 */
function BooleanBreakdown({ explanation }: { explanation: BooleanExplanation }) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
      <h4 className="font-medium text-gray-900 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-600" />
        Search Breakdown
      </h4>

      {/* Components */}
      {explanation.components.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">Components</h5>
          <div className="space-y-2">
            {explanation.components.map((comp, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-2 bg-white rounded border border-gray-100"
              >
                <Badge variant="outline" className="text-xs capitalize shrink-0">
                  {comp.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600">{comp.purpose}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {comp.terms.slice(0, 5).map((term, j) => (
                      <Badge key={j} variant="secondary" className="text-xs font-mono">
                        {term}
                      </Badge>
                    ))}
                    {comp.terms.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{comp.terms.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Will Include / Exclude */}
      <div className="grid grid-cols-2 gap-4">
        {explanation.willInclude.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-green-700 mb-2">Will Include</h5>
            <div className="flex flex-wrap gap-1">
              {explanation.willInclude.map((term, i) => (
                <Badge key={i} className="bg-green-100 text-green-800 text-xs">
                  {term}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {explanation.willExclude.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-red-700 mb-2">Will Exclude</h5>
            <div className="flex flex-wrap gap-1">
              {explanation.willExclude.map((term, i) => (
                <Badge key={i} className="bg-red-100 text-red-800 text-xs">
                  {term}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pro Tips */}
      {explanation.proTips.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Pro Tips</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            {explanation.proTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default BooleanSearchPanel;
