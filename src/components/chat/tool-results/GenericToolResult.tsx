import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Copy, Check, AlertCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolResultComponentProps } from '@/types/mcp-chat';

export const GenericToolResult: React.FC<ToolResultComponentProps> = ({
  toolName,
  data,
  status,
}) => {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);
  const isSmall = jsonString.length < 500;
  const [isOpen, setIsOpen] = useState(isSmall);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border border-gray-200 bg-white/80 shadow-sm my-2">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-purple-500" />
            <Badge variant="outline" className="text-xs font-mono">
              {toolName.replace(/_/g, ' ')}
            </Badge>
            <Badge
              variant={status === 'error' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {status}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs text-gray-500"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        {status === 'error' && (
          <div className="flex items-start gap-2 mb-2 p-2 bg-red-50 rounded text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Tool execution failed</span>
          </div>
        )}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-1">
            <ChevronDown className={cn(
              'w-3 h-3 transition-transform',
              isOpen && 'rotate-180'
            )} />
            {isOpen ? 'Collapse' : 'View result'}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs bg-gray-50 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto font-mono text-gray-700 leading-relaxed">
              {jsonString}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default GenericToolResult;
