'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Target,
  Send,
  Rocket,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'hiapply_onboarding_complete';

interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
}

const steps: OnboardingStep[] = [
  {
    title: 'Skip the Noise. Find the People.',
    subtitle: 'Welcome to Apply',
    description:
      'The big job platforms got bloated. Paywalls, sponsored profiles, the same recycled candidates everyone else is fighting over. You deserve better. Apply cuts straight to the source — real talent, found faster, without the algorithm tax.',
    icon: Zap,
    color: 'text-amber-600',
    bgGradient: 'from-amber-50 to-orange-50',
  },
  {
    title: 'Search Like a Recruiter Who Has Places to Be',
    subtitle: 'AI-Powered Sourcing',
    description:
      'Describe your ideal candidate in plain English. We generate precision Boolean queries and search across the open web — surfacing people that bloated platforms buried under pay-to-play rankings. No more page 47. No more "upgrade to see this profile."',
    icon: Target,
    color: 'text-purple-600',
    bgGradient: 'from-purple-50 to-indigo-50',
  },
  {
    title: 'Make Contact. Skip the Middleman.',
    subtitle: 'Outreach & Engagement',
    description:
      'Find verified emails and phone numbers, craft personalized outreach, and post AI-optimized job descriptions. No credits to buy. No subscriptions on top of subscriptions. Just a direct line to the people you actually want to hire.',
    icon: Send,
    color: 'text-blue-600',
    bgGradient: 'from-blue-50 to-cyan-50',
  },
  {
    title: 'Close Fast. The Good Ones Don\'t Wait.',
    subtitle: 'Interviews & Hiring',
    description:
      'Prep with AI-generated interview questions, run video calls with real-time coaching, and move fast enough to actually land your top pick. From first search to signed offer — let\'s go.',
    icon: Rocket,
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-50 to-teal-50',
  },
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      dismiss();
    }
  }, [currentStep, dismiss]);

  const prev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
        {/* Skip button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Skip tour"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon header */}
        <div className={cn('flex items-center justify-center py-8 bg-gradient-to-br', step.bgGradient)}>
          <div className="h-16 w-16 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center">
            <Icon className={cn('h-8 w-8', step.color)} />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pt-6 pb-4 text-center">
          <p className={cn('text-xs font-semibold uppercase tracking-wider mb-1', step.color)}>
            {step.subtitle}
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 pt-2">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === currentStep ? 'w-6 bg-gray-900' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStep > 0 ? (
                <Button variant="ghost" size="sm" onClick={prev} className="text-gray-500">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={dismiss} className="text-gray-400">
                  Skip
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {currentStep + 1} of {steps.length}
              </span>
              <Button size="sm" onClick={next} className="rounded-lg px-4">
                {isLast ? (
                  <>
                    Get Started
                    <Sparkles className="h-3.5 w-3.5 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
