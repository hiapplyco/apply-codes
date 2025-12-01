import React from 'react';
import { ProjectSelector } from '@/components/project/ProjectSelector';
import { ContextButtons, ContextButtonsProps } from './ContextButtons';
import { cn } from '@/lib/utils';
import { useProjectContext } from '@/context/ProjectContext';

export interface ContextBarProps extends Omit<ContextButtonsProps, 'context' | 'onContentProcessed'> {
  /** Current page context for targeted content handling */
  context: 'sourcing' | 'meeting' | 'chat' | 'job-posting' | 'screening' | 'general';
  
  /** Show the project selector alongside context buttons */
  showProjectSelector?: boolean;
  
  /** Project selector configuration */
  projectSelectorProps?: {
    label?: string;
    placeholder?: string;
    className?: string;
    required?: boolean;
  };
  
  /** Callback when content is processed and ready */
  onContentProcessed?: (content: {
    type: 'upload' | 'firecrawl' | 'perplexity' | 'location';
    text: string;
    metadata?: Record<string, any>;
    projectId?: string;
  }) => void;
  
  /** Custom styling classes */
  className?: string;
  
  /** Title for the context bar */
  title?: string;
  
  /** Description text */
  description?: string;
  
  /** Position of context buttons relative to project selector */
  layout?: 'horizontal' | 'vertical' | 'stacked';
  
  /** Hide on mobile devices */
  hideOnMobile?: boolean;
  
  /** Compact mode for small spaces */
  compact?: boolean;
}

export const ContextBar: React.FC<ContextBarProps> = ({
  context,
  showProjectSelector = true,
  projectSelectorProps,
  onContentProcessed,
  className,
  title,
  description,
  layout = 'horizontal',
  hideOnMobile = false,
  compact = false,
  ...contextButtonsProps
}) => {
  const { selectedProject } = useProjectContext();

  // Clean, minimal container styling
  const containerStyles = cn(
    compact
      ? "bg-transparent border-none shadow-none p-2 mb-2"
      : "bg-white border border-gray-200 rounded-lg p-4 mb-4",
    hideOnMobile && "hidden sm:block",
    className
  );

  // Layout-specific styling
  const layoutStyles = cn(
    compact ? "flex gap-4 items-center justify-between" : "flex flex-col gap-6",
    layout === 'vertical' && "flex-col items-start gap-6",
    layout === 'stacked' && "flex-col gap-6",
    "w-full"
  );

  return (
    <div className={containerStyles}>
      {/* Header Section */}
      {(title || description) && !compact && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className={layoutStyles}>
        {/* Project Selector */}
        {showProjectSelector && (
          <div className="w-full mb-4">
            <ProjectSelector
              placeholder={projectSelectorProps?.placeholder || "Choose a project to save..."}
              className={cn("w-full", projectSelectorProps?.className)}
              required={projectSelectorProps?.required}
            />
          </div>
        )}

        {/* Context Buttons */}
        <div className="w-full pr-2 pb-2">
          <ContextButtons
            context={context}
            onContentProcessed={onContentProcessed}
            variant="responsive"
            size={compact ? "compact" : "default"}
            {...contextButtonsProps}
          />
        </div>

        {/* Project Status Indicator */}
        {selectedProject && !compact && (
          <div className="flex items-center gap-2 text-sm text-gray-600 lg:ml-auto mt-2 lg:mt-0">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Content will be saved to <strong>{selectedProject.name}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextBar;