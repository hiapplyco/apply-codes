import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BooleanGenerationAnimationProps {
  isOpen: boolean;
  onComplete?: () => void;
  estimatedTimeMs?: number;
}

// Fun messages about time savings
const MESSAGES = [
  "While a human would still be drinking their first coffee...",
  "In the time it takes to say 'Boolean search', we've analyzed 1,000 factors",
  "Making your recruiter friends jealous with this speed...",
  "Faster than ordering a complicated coffee at Starbucks",
  "Meanwhile, your competitors are still writing their first OR statement",
  "Saving you from a lifetime of LinkedIn search tutorials",
  "This used to take an expert recruiter 30 minutes. We're almost done!",
  "By now you've saved enough time for a proper lunch break",
  "While others debate AND vs OR, we're already optimizing",
  "Creating search magic while you relax..."
];

const TOTAL_DURATION = 120000; // 2 minutes in ms

export const BooleanGenerationAnimation: React.FC<BooleanGenerationAnimationProps> = ({
  isOpen,
  onComplete,
  estimatedTimeMs = TOTAL_DURATION
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Calculate progress
  const progressPercentage = Math.min((elapsedTime / estimatedTimeMs) * 100, 100);
  const isComplete = progressPercentage >= 100;

  // Change message every 12 seconds
  useEffect(() => {
    if (!isOpen) {
      setElapsedTime(0);
      setCurrentMessageIndex(0);
      return;
    }

    // Timer for elapsed time (updates every 100ms for smooth progress)
    const elapsedTimer = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 100;
        if (newTime >= estimatedTimeMs) {
          setTimeout(() => onComplete?.(), 500);
        }
        return newTime;
      });
    }, 100);

    // Timer for changing messages
    const messageTimer = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % MESSAGES.length);
    }, 12000);

    return () => {
      clearInterval(elapsedTimer);
      clearInterval(messageTimer);
    };
  }, [isOpen, estimatedTimeMs, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative max-w-md w-full mx-4">
        <div className="bg-white rounded-lg border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 transform animate-in zoom-in-95 duration-500">
          
          {/* Simple Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-900">Creating Your Boolean Search</h2>
              <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
            </div>
          </div>

          {/* Fun Message */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 font-medium leading-relaxed animate-in fade-in duration-1000">
              {MESSAGES[currentMessageIndex]}
            </p>
          </div>

          {/* Simple Progress Bar */}
          <div className="mb-8">
            <div className="h-6 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-green-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{Math.round(progressPercentage)}% complete</span>
              <span className="font-medium">
                {isComplete ? "Almost there!" : `${Math.ceil((estimatedTimeMs - elapsedTime) / 1000)}s remaining`}
              </span>
            </div>
          </div>

          {/* Completion State */}
          {isComplete && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-500">
              <p className="text-lg font-semibold text-green-600">
                ✨ Search string ready! You just saved 30 minutes!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};