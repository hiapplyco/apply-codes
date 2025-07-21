import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  Sparkles, 
  Eye, 
  Zap, 
  Target, 
  FileText, 
  Filter, 
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BooleanGenerationAnimationProps {
  isOpen: boolean;
  onComplete?: () => void;
  estimatedTimeMs?: number;
}

type AnimationStep = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
  duration: number; // in seconds
  color: string;
};

const ANIMATION_STEPS: AnimationStep[] = [
  {
    id: 'analyzing',
    icon: <Eye className="h-8 w-8" />,
    title: 'Reading Your Requirements',
    description: 'AI is carefully analyzing your job description and context documents',
    details: [
      'Extracting key skills and technologies',
      'Identifying required experience levels', 
      'Understanding company culture fit',
      'Parsing location preferences'
    ],
    duration: 25,
    color: 'text-blue-600'
  },
  {
    id: 'processing',
    icon: <Brain className="h-8 w-8" />,
    title: 'Processing Context',
    description: 'Advanced AI is understanding the nuances of your hiring needs',
    details: [
      'Analyzing industry-specific terminology',
      'Mapping skills to LinkedIn job titles',
      'Understanding role hierarchy levels',
      'Identifying must-have vs nice-to-have skills'
    ],
    duration: 30,
    color: 'text-purple-600'
  },
  {
    id: 'strategizing',
    icon: <Target className="h-8 w-8" />,
    title: 'Crafting Search Strategy',
    description: 'Building an intelligent search strategy tailored to your needs',
    details: [
      'Selecting optimal keyword combinations',
      'Balancing inclusivity vs specificity',
      'Adding alternative job title variations',
      'Planning boolean logic operators'
    ],
    duration: 25,
    color: 'text-green-600'
  },
  {
    id: 'optimizing',
    icon: <Zap className="h-8 w-8" />,
    title: 'Optimizing Boolean Logic',
    description: 'Fine-tuning the search string for maximum candidate discovery',
    details: [
      'Testing operator combinations',
      'Avoiding over-restrictive filters',
      'Adding industry synonym variations',
      'Ensuring LinkedIn-compatible syntax'
    ],
    duration: 20,
    color: 'text-orange-600'
  },
  {
    id: 'validating',
    icon: <Filter className="h-8 w-8" />,
    title: 'Validating & Polishing',
    description: 'Final quality checks and optimization for best results',
    details: [
      'Syntax validation for LinkedIn search',
      'Removing redundant search terms',
      'Optimizing for diverse candidate backgrounds',
      'Adding final quality improvements'
    ],
    duration: 20,
    color: 'text-red-600'
  }
];

// Calculate total duration from steps
const TOTAL_DURATION = ANIMATION_STEPS.reduce((sum, step) => sum + step.duration, 0) * 1000; // Convert to ms

export const BooleanGenerationAnimation: React.FC<BooleanGenerationAnimationProps> = ({
  isOpen,
  onComplete,
  estimatedTimeMs = TOTAL_DURATION
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentDetailIndex, setCurrentDetailIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const currentStep = ANIMATION_STEPS[currentStepIndex];
  const totalSteps = ANIMATION_STEPS.length;
  
  // Calculate progress including detail completion within current step
  const completedSteps = currentStepIndex;
  const currentStepProgress = (currentDetailIndex + 1) / currentStep.details.length;
  const totalProgress = (completedSteps + currentStepProgress) / totalSteps;
  const progressPercentage = totalProgress * 100;

  // Calculate estimated time remaining
  const timeRemaining = Math.max(0, estimatedTimeMs - elapsedTime);
  const timeRemainingSeconds = Math.ceil(timeRemaining / 1000);
  const timeRemainingMinutes = Math.floor(timeRemainingSeconds / 60);
  const timeRemainingSecondsDisplay = timeRemainingSeconds % 60;

  // Auto-advance through steps
  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setCurrentDetailIndex(0);
      setElapsedTime(0);
      setIsCompleting(false);
      return;
    }

    const stepDuration = currentStep.duration * 1000; // Convert to ms
    const detailInterval = stepDuration / currentStep.details.length;
    
    // Timer for elapsed time (updates every second)
    const elapsedTimer = setInterval(() => {
      setElapsedTime(prev => prev + 1000);
    }, 1000);
    
    // Timer for advancing details
    const detailTimer = setInterval(() => {
      if (currentDetailIndex < currentStep.details.length - 1) {
        // Advance to next detail
        setCurrentDetailIndex(prev => prev + 1);
      } else if (currentStepIndex < totalSteps - 1) {
        // Move to next step
        setCurrentStepIndex(prev => prev + 1);
        setCurrentDetailIndex(0);
      } else if (!isCompleting) {
        // Animation complete
        setIsCompleting(true);
        setTimeout(() => onComplete?.(), 1000);
      }
    }, detailInterval);

    return () => {
      clearInterval(elapsedTimer);
      clearInterval(detailTimer);
    };
  }, [isOpen, currentStepIndex, currentStep, totalSteps, onComplete, currentDetailIndex, isCompleting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative max-w-lg w-full mx-4">
        <div className="bg-white rounded-lg border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 transform animate-in zoom-in-95 duration-500">
          
          {/* Header with time estimate */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">AI Boolean Generator</h2>
            </div>
            <p className="text-gray-600 text-sm">
              Estimated time remaining: {timeRemainingMinutes}:{timeRemainingSecondsDisplay.toString().padStart(2, '0')}
            </p>
          </div>

          {/* Step Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {ANIMATION_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                  index <= currentStepIndex 
                    ? "bg-purple-600 border-purple-600 text-white" 
                    : "border-gray-300 text-gray-400"
                )}>
                  {index < currentStepIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : index === currentStepIndex ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                {index < ANIMATION_STEPS.length - 1 && (
                  <ArrowRight className={cn(
                    "h-4 w-4 mx-2 transition-colors duration-500",
                    index < currentStepIndex ? "text-purple-600" : "text-gray-300"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Display */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className={cn("p-4 rounded-full bg-gray-100", currentStep.color)}>
                  {currentStep.icon}
                </div>
                <div className="absolute -inset-2">
                  <div className="w-full h-full rounded-full border-2 border-purple-300 animate-pulse" />
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentStep.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {currentStep.description}
            </p>
          </div>

          {/* Current Details */}
          <div className="space-y-3 mb-6">
            {currentStep.details.map((detail, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 text-sm transition-all duration-700",
                  index <= currentDetailIndex 
                    ? "opacity-100 translate-x-0" 
                    : "opacity-30 translate-x-2"
                )}
              >
                <div className={cn(
                  "h-2 w-2 rounded-full transition-all duration-500",
                  index < currentDetailIndex 
                    ? "bg-green-500" 
                    : index === currentDetailIndex 
                      ? "bg-purple-600 animate-pulse" 
                      : "bg-gray-300"
                )} />
                <span className={cn(
                  "transition-colors duration-500",
                  index <= currentDetailIndex ? "text-gray-800" : "text-gray-400"
                )}>
                  {detail}
                </span>
                {index < currentDetailIndex && (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-green-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Completion State */}
          {isCompleting && (
            <div className="text-center mt-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Boolean search generated successfully!</span>
              </div>
            </div>
          )}

          {/* Pro tip */}
          <div className="mt-6 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-purple-800">
                <span className="font-semibold">Pro Tip:</span> The AI is analyzing hundreds of factors to create the perfect search string that balances precision with candidate discovery.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};