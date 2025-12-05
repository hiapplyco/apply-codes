/**
 * Dialog component for confirming high-impact tool executions.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Mail, Calendar, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tools that require user confirmation
export const HIGH_IMPACT_TOOLS = [
  'send_email',
  'send_outreach_email',
  'send_campaign_email',
  'schedule_interview',
  'share_google_doc',
] as const;

type HighImpactTool = typeof HIGH_IMPACT_TOOLS[number];

interface ToolConfirmationDialogProps {
  open: boolean;
  tool: string;
  description: string;
  parameters: Record<string, any>;
  onConfirm: () => void;
  onCancel: () => void;
}

// Tool metadata for display
const toolMetadata: Record<HighImpactTool, { icon: React.ElementType; color: string; warning: string }> = {
  send_email: {
    icon: Mail,
    color: 'text-blue-500',
    warning: 'This will send a real email to the recipient.',
  },
  send_outreach_email: {
    icon: Mail,
    color: 'text-purple-500',
    warning: 'This will send a real outreach email to the candidate.',
  },
  send_campaign_email: {
    icon: Mail,
    color: 'text-red-500',
    warning: 'This will send emails to multiple recipients.',
  },
  schedule_interview: {
    icon: Calendar,
    color: 'text-green-500',
    warning: 'This will create calendar events and send invitations.',
  },
  share_google_doc: {
    icon: Share2,
    color: 'text-orange-500',
    warning: 'This will share the document with the specified users.',
  },
};

export function ToolConfirmationDialog({
  open,
  tool,
  description,
  parameters,
  onConfirm,
  onCancel,
}: ToolConfirmationDialogProps) {
  const isHighImpact = HIGH_IMPACT_TOOLS.includes(tool as HighImpactTool);
  const metadata = toolMetadata[tool as HighImpactTool];
  const Icon = metadata?.icon || AlertTriangle;

  // Format parameter display
  const formatParameter = (key: string, value: any): string => {
    if (Array.isArray(value)) {
      return value.length > 3
        ? `${value.slice(0, 3).join(', ')}... (+${value.length - 3} more)`
        : value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'string' && value.length > 100) {
      return value.slice(0, 100) + '...';
    }
    return String(value);
  };

  // Filter out sensitive or unnecessary parameters
  const displayParameters = Object.entries(parameters).filter(
    ([key]) => !['token', 'userId', 'projectId'].includes(key)
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', metadata?.color || 'text-yellow-500')} />
            Confirm Action: {tool.replace(/_/g, ' ')}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning banner */}
          {isHighImpact && metadata && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">High Impact Action</p>
                <p className="text-sm text-yellow-700">{metadata.warning}</p>
              </div>
            </div>
          )}

          {/* Parameters */}
          {displayParameters.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Parameters:</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {displayParameters.map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-900 break-words">
                      {formatParameter(key, value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview for emails */}
          {(tool.includes('email') && parameters.subject) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Email Preview:</p>
              <div className="border rounded-lg p-3 bg-white">
                <p className="text-sm font-medium text-gray-900">
                  Subject: {parameters.subject}
                </p>
                {parameters.to_email && (
                  <p className="text-sm text-gray-600 mt-1">
                    To: {parameters.to_email}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm & Execute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper hook for managing confirmations
export function useToolConfirmation() {
  const [pendingConfirmation, setPendingConfirmation] = React.useState<{
    tool: string;
    description: string;
    parameters: Record<string, any>;
    resolve: (confirmed: boolean) => void;
  } | null>(null);

  const requestConfirmation = React.useCallback(
    (tool: string, description: string, parameters: Record<string, any>): Promise<boolean> => {
      return new Promise((resolve) => {
        setPendingConfirmation({ tool, description, parameters, resolve });
      });
    },
    []
  );

  const handleConfirm = React.useCallback(() => {
    if (pendingConfirmation) {
      pendingConfirmation.resolve(true);
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation]);

  const handleCancel = React.useCallback(() => {
    if (pendingConfirmation) {
      pendingConfirmation.resolve(false);
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation]);

  const isToolHighImpact = React.useCallback((tool: string): boolean => {
    return HIGH_IMPACT_TOOLS.includes(tool as HighImpactTool);
  }, []);

  return {
    pendingConfirmation,
    requestConfirmation,
    handleConfirm,
    handleCancel,
    isToolHighImpact,
    ConfirmationDialog: pendingConfirmation ? (
      <ToolConfirmationDialog
        open={true}
        tool={pendingConfirmation.tool}
        description={pendingConfirmation.description}
        parameters={pendingConfirmation.parameters}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ) : null,
  };
}

export default ToolConfirmationDialog;
