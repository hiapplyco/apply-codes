import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContainedLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
  size?: 'sm' | 'md' | 'lg';
  spinnerColor?: string;
}

export const ContainedLoading: React.FC<ContainedLoadingProps> = ({
  isLoading,
  children,
  className,
  loadingText,
  size = 'md',
  spinnerColor = 'text-purple-600'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  };

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] rounded-md z-10 flex items-center justify-center border border-purple-100">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-purple-200">
          <Loader2 className={cn("animate-spin", sizeClasses[size], spinnerColor)} />
          {loadingText && (
            <span className="text-sm font-medium text-gray-700">{loadingText}</span>
          )}
        </div>
      </div>
      
      {/* Content (dimmed) */}
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  isLoading,
  children,
  loadingText,
  className
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </div>
  );
};

interface InlineLoadingProps {
  isLoading: boolean;
  loadingText: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  isLoading,
  loadingText,
  children,
  size = 'sm'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-sm'
  };

  if (!isLoading && !children) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-gray-600">
      {isLoading && (
        <>
          <Loader2 className={cn("animate-spin text-purple-600", sizeClasses[size].split(' ').slice(0, 2).join(' '))} />
          <span className={cn("font-medium", sizeClasses[size].split(' ').slice(2).join(' '))}>{loadingText}</span>
        </>
      )}
      {!isLoading && children}
    </div>
  );
};