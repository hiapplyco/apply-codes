import React from 'react';
import { ContextBar, ContextBarProps } from '@/components/context/ContextBar';
import { cn } from '@/lib/utils';

interface StandardProjectContextProps extends Omit<ContextBarProps, 'className' | 'layout' | 'compact' | 'showProjectSelector' | 'projectSelectorProps'> {
    className?: string;
    projectSelectorPlaceholder?: string;
}

export const StandardProjectContext: React.FC<StandardProjectContextProps> = ({
    className,
    projectSelectorPlaceholder = "Choose a project to save...",
    title = "Project & Context",
    description = "Select a project and add context through uploads, web scraping, or AI search",
    ...props
}) => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
        <div className={cn(
            "bg-white overflow-hidden",
            className
        )}>
            {/* Only show header if title is provided */}
            {title && (
                <div
                    className="p-3 flex items-center justify-between cursor-pointer bg-gray-50 border-b border-gray-100"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
                        {!isExpanded && description && (
                            <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                {description}
                            </span>
                        )}
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        {isExpanded ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        )}
                    </button>
                </div>
            )}

            <div className={cn(
                "transition-all duration-200 ease-in-out",
                (isExpanded || !title) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className={title ? "p-3" : ""}>
                    {isExpanded && description && (
                        <p className="text-xs text-gray-500 mb-3">
                            {description}
                        </p>
                    )}
                    <ContextBar
                        {...props}
                        title=""
                        description=""
                        showProjectSelector={true}
                        projectSelectorProps={{
                            placeholder: projectSelectorPlaceholder,
                            className: "w-full max-w-md"
                        }}
                        layout="horizontal"
                        compact={false}
                        className="border-none shadow-none p-0 mb-0 bg-transparent"
                        showLabels={true}
                    />
                </div>
            </div>
        </div>
    );
};
