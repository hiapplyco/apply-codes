import React, { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIFieldProps {
  path: string;
  label: string;
  placeholder: string;
  type?: string;
  value: any;
  isExtracted: boolean;
  sourceInfo?: {
    source: string;
    confidence: number;
  };
  onUpdate: (path: string, value: any) => void;
}

/**
 * Memoized input field with AI extraction indicator.
 * CRITICAL: Defined outside of ContextBuilder to prevent recreation on every parent render.
 */
export const AIField = memo(function AIField({
  path,
  label,
  placeholder,
  type = 'text',
  value,
  isExtracted,
  sourceInfo,
  onUpdate,
}: AIFieldProps) {
  const confidenceColor = sourceInfo?.confidence
    ? sourceInfo.confidence >= 0.8 ? 'text-green-600'
    : sourceInfo.confidence >= 0.5 ? 'text-yellow-600'
    : 'text-red-600'
    : '';

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        {isExtracted && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="text-xs bg-purple-100 text-purple-700 border-purple-200 cursor-help"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  AI
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="text-sm">
                  {sourceInfo ? (
                    <>
                      <p className="font-medium">Extracted from: {sourceInfo.source}</p>
                      <p className={cn("text-xs mt-0.5", confidenceColor)}>
                        {Math.round(sourceInfo.confidence * 100)}% confidence
                      </p>
                    </>
                  ) : (
                    <p>AI extracted field</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onUpdate(path, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className={cn(
          isExtracted && 'border-purple-300 bg-purple-50/50 focus:border-purple-500'
        )}
      />
    </div>
  );
});
