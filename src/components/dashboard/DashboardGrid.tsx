import React from 'react';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  className = ""
}) => {
  return (
    <div 
      className={`
        grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 
        gap-6 auto-rows-min
        ${className}
      `}
    >
      {children}
    </div>
  );
};