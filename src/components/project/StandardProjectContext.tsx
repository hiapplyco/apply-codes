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
    return (
        <div className={cn(
            "bg-white rounded-xl shadow-md border border-gray-200 p-6",
            className
        )}>
            <ContextBar
                {...props}
                title={title}
                description={description}
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
    );
};
