import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, FileText, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: string;
  isGenerating: boolean;
  hasContext: boolean;
  projectName?: string;
}

export const ContentGenerationDialog: React.FC<ContentGenerationDialogProps> = ({
  isOpen,
  onClose,
  contentType,
  isGenerating,
  hasContext,
  projectName
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'analyzing' | 'generating' | 'finalizing' | 'complete'>('analyzing');

  const steps = [
    {
      icon: Sparkles,
      title: 'Analyzing Context',
      description: hasContext 
        ? 'Processing your uploaded content and project details...'
        : 'Preparing content generation parameters...'
    },
    {
      icon: FileText,
      title: 'Generating Content',
      description: `Creating your ${contentType.toLowerCase()} with AI assistance...`
    },
    {
      icon: CheckCircle,
      title: 'Finalizing',
      description: 'Applying formatting and optimization...'
    }
  ];

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      setAnimationPhase('analyzing');
      return;
    }

    const phases: ('analyzing' | 'generating' | 'finalizing')[] = ['analyzing', 'generating', 'finalizing'];
    let phaseIndex = 0;
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (phaseIndex < phases.length) {
        setAnimationPhase(phases[phaseIndex]);
        setCurrentStep(stepIndex);
        phaseIndex++;
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating && isOpen) {
      // Show completion state briefly
      setAnimationPhase('complete');
      setCurrentStep(2);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  }, [isGenerating, isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 p-0 hover:bg-gray-100"
            type="button"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Animated AI Icon */}
          <div className="relative">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
              "bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
              isGenerating ? "animate-pulse scale-110" : "scale-100"
            )}>
              {animationPhase === 'complete' ? (
                <CheckCircle className="w-10 h-10 text-white animate-bounce" />
              ) : (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              )}
            </div>
            
            {/* Floating particles */}
            {isGenerating && (
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
              {animationPhase === 'complete' ? 'Content Generated!' : 'Creating Your Content'}
            </h3>
            {projectName && (
              <p className="text-sm text-gray-600">
                for project: <span className="font-medium text-purple-700">{projectName}</span>
              </p>
            )}
          </div>

          {/* Progress Steps */}
          <div className="w-full space-y-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep || animationPhase === 'complete';
              
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
                animationPhase === 'complete' 
                  ? "bg-green-500 w-full" 
                  : "bg-gradient-to-r from-purple-500 to-purple-600"
              )}
              style={{ 
                width: animationPhase === 'complete' 
                  ? '100%' 
                  : `${((currentStep + 1) / steps.length) * 100}%` 
              }}
            ></div>
          </div>

          {/* Context Indicator */}
          {hasContext && (
            <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              <Sparkles className="w-3 h-3" />
              <span>Using additional context for better results</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};