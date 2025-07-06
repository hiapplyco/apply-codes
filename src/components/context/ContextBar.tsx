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

  // Container styling with Apply's brutalist design system
  const containerStyles = cn(
    compact 
      ? "bg-transparent border-none shadow-none p-2 mb-2"
      : "bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4 mb-6",
    hideOnMobile && "hidden sm:block",
    className
  );

  // Layout-specific styling
  const layoutStyles = cn(
    compact ? "flex gap-4 items-center justify-between" : "flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between",
    layout === 'vertical' && "flex-col items-start gap-6",
    layout === 'stacked' && "flex-col sm:flex-row sm:items-center sm:gap-6",
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
        {/* Left side: Project Selector */}
        {showProjectSelector && (
          <div className={cn(
            "flex-shrink-0 w-full lg:w-auto lg:min-w-[300px] lg:max-w-sm",
            layout === 'vertical' && "w-full max-w-none"
          )}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Project
              </label>
              <ProjectSelector
                placeholder={projectSelectorProps?.placeholder || "Choose a project to save..."}
                className={cn("w-full", projectSelectorProps?.className)}
                required={projectSelectorProps?.required}
              />
            </div>
          </div>
        )}

        {/* Right side: Context Buttons */}
        <div className={cn(
          "flex-shrink-0 w-full lg:w-auto",
          layout === 'vertical' && "w-full",
          !showProjectSelector && "w-full"
        )}>
          <ContextButtons
            context={context}
            onContentProcessed={onContentProcessed}
            variant="inline"
            size="default"
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