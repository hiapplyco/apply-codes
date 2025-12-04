import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, X, Sparkles, FileText, Search, Globe, Brain, Zap, Mail, Users, MapPin, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingStep {
  icon?: React.ElementType;
  title: string;
  description: string;
}

export interface StepLoadingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  steps: LoadingStep[];
  isLoading: boolean;
  hasContext?: boolean;
  contextMessage?: string;
  /** Time in ms between step transitions */
  stepInterval?: number;
  /** Allow closing while loading */
  allowCloseWhileLoading?: boolean;
}

// Default icon mapping based on step titles
const getDefaultIcon = (title: string): React.ElementType => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('search') || lowerTitle.includes('finding')) return Search;
  if (lowerTitle.includes('analyz') || lowerTitle.includes('process')) return Brain;
  if (lowerTitle.includes('generat') || lowerTitle.includes('creat')) return Sparkles;
  if (lowerTitle.includes('final') || lowerTitle.includes('complet')) return CheckCircle;
  if (lowerTitle.includes('scrape') || lowerTitle.includes('fetch') || lowerTitle.includes('web')) return Globe;
  if (lowerTitle.includes('document') || lowerTitle.includes('file')) return FileText;
  if (lowerTitle.includes('email') || lowerTitle.includes('outreach')) return Mail;
  if (lowerTitle.includes('candidate') || lowerTitle.includes('profile')) return Users;
  if (lowerTitle.includes('location') || lowerTitle.includes('place')) return MapPin;
  if (lowerTitle.includes('meeting') || lowerTitle.includes('video')) return Video;
  return Zap;
};

export const StepLoadingDialog: React.FC<StepLoadingDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  steps,
  isLoading,
  hasContext = false,
  contextMessage = 'Using additional context for better results',
  stepInterval = 1500,
  allowCloseWhileLoading = true
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      setIsComplete(false);
      return;
    }

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setCurrentStep(stepIndex);
      } else {
        clearInterval(interval);
      }
    }, stepInterval);

    return () => clearInterval(interval);
  }, [isLoading, steps.length, stepInterval]);

  useEffect(() => {
    if (!isLoading && isOpen) {
      // Show completion state briefly
      setIsComplete(true);
      setCurrentStep(steps.length - 1);
      const timeout = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, isOpen, onClose, steps.length]);

  const handleClose = () => {
    if (!isLoading || allowCloseWhileLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          {/* Close button */}
          {allowCloseWhileLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 p-0 hover:bg-gray-100"
              type="button"
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {/* Animated AI Icon */}
          <div className="relative">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
              "bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
              isLoading ? "animate-pulse scale-110" : "scale-100"
            )}>
              {isComplete ? (
                <CheckCircle className="w-10 h-10 text-white animate-bounce" />
              ) : (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              )}
            </div>

            {/* Floating particles */}
            {isLoading && (
              <>
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce delay-100"></div>
                <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-green-400 rounded-full animate-bounce delay-300"></div>
                <div className="absolute top-1/2 -right-4 w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-500"></div>
              </>
            )}
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-purple-900">
              {isComplete ? `${title.replace(/ing\b/g, 'ed').replace('Creating', 'Created').replace('Searching', 'Search Complete').replace('Processing', 'Processed')}!` : title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>

          {/* Progress Steps */}
          <div className="w-full space-y-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon || getDefaultIcon(step.title);
              const isActive = index === currentStep && !isComplete;
              const isCompleted = index < currentStep || isComplete;

              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-500",
                    isActive
                      ? "border-purple-500 bg-purple-50 shadow-[2px_2px_0px_0px_rgba(139,92,246,0.3)]"
                      : isCompleted
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isActive
                      ? "border-purple-500 bg-purple-100 scale-110"
                      : isCompleted
                      ? "border-green-500 bg-green-100"
                      : "border-gray-300 bg-gray-100"
                  )}>
                    {isCompleted && !isActive ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <StepIcon className={cn(
                        "w-4 h-4 transition-colors duration-300",
                        isActive ? "text-purple-600" : "text-gray-400"
                      )} />
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className={cn(
                      "font-medium transition-colors duration-300",
                      isActive ? "text-purple-900" : isCompleted ? "text-green-900" : "text-gray-600"
                    )}>
                      {step.title}
                    </h4>
                    <p className={cn(
                      "text-sm transition-colors duration-300",
                      isActive ? "text-purple-700" : isCompleted ? "text-green-700" : "text-gray-500"
                    )}>
                      {step.description}
                    </p>
                  </div>

                  {isActive && (
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 border border-gray-300">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-in-out",
                isComplete
                  ? "bg-green-500 w-full"
                  : "bg-gradient-to-r from-purple-500 to-purple-600"
              )}
              style={{
                width: isComplete
                  ? '100%'
                  : `${((currentStep + 1) / steps.length) * 100}%`
              }}
            ></div>
          </div>

          {/* Context Indicator */}
          {hasContext && (
            <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              <Sparkles className="w-3 h-3" />
              <span>{contextMessage}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Preset configurations for common use cases
export const LOADING_PRESETS = {
  perplexitySearch: {
    title: 'Searching the Internet',
    steps: [
      { title: 'Finding Sources', description: 'Searching across the web for relevant information...' },
      { title: 'Analyzing Results', description: 'Processing and validating search results...' },
      { title: 'Generating Summary', description: 'Creating a comprehensive summary...' }
    ]
  },
  booleanGeneration: {
    title: 'Generating Search Query',
    steps: [
      { title: 'Analyzing Requirements', description: 'Processing your job requirements...' },
      { title: 'Building Query', description: 'Constructing optimized boolean search string...' },
      { title: 'Finalizing', description: 'Applying LinkedIn-specific optimizations...' }
    ]
  },
  candidateAnalysis: {
    title: 'Analyzing Candidate',
    steps: [
      { title: 'Fetching Profile', description: 'Retrieving candidate information...' },
      { title: 'AI Analysis', description: 'Evaluating skills and experience match...' },
      { title: 'Generating Insights', description: 'Creating detailed assessment...' }
    ]
  },
  contentGeneration: {
    title: 'Creating Your Content',
    steps: [
      { title: 'Analyzing Context', description: 'Processing your uploaded content and project details...' },
      { title: 'Generating Content', description: 'Creating your content with AI assistance...' },
      { title: 'Finalizing', description: 'Applying formatting and optimization...' }
    ]
  },
  urlScrape: {
    title: 'Scraping Website',
    steps: [
      { title: 'Fetching Page', description: 'Loading the webpage content...' },
      { title: 'Extracting Content', description: 'Parsing and cleaning the content...' },
      { title: 'Processing', description: 'Preparing content for use...' }
    ]
  },
  documentUpload: {
    title: 'Processing Document',
    steps: [
      { title: 'Reading File', description: 'Loading your document...' },
      { title: 'Extracting Text', description: 'Parsing document content...' },
      { title: 'Finalizing', description: 'Preparing content for use...' }
    ]
  },
  emailGeneration: {
    title: 'Generating Emails',
    steps: [
      { title: 'Analyzing Profiles', description: 'Understanding candidate backgrounds...' },
      { title: 'Creating Templates', description: 'Generating personalized email content...' },
      { title: 'Finalizing', description: 'Optimizing for engagement...' }
    ]
  },
  meetingSetup: {
    title: 'Setting Up Meeting',
    steps: [
      { title: 'Creating Room', description: 'Setting up your video meeting room...' },
      { title: 'Preparing Tools', description: 'Loading interview assistance features...' },
      { title: 'Ready', description: 'Your meeting room is ready...' }
    ]
  }
};

export default StepLoadingDialog;
