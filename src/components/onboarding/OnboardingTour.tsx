'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Search,
  Send,
  Video,
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
    title: 'Welcome to Apply',
    subtitle: 'Fighting Brain Waste',
    description:
      'Every year, millions of skilled professionals — veterans, immigrants, military spouses — are overlooked by traditional hiring. Their talent goes to waste. Apply exists to change that, giving recruiters AI-powered tools to find the people others miss.',
    icon: Heart,
    color: 'text-rose-600',
    bgGradient: 'from-rose-50 to-orange-50',
  },
  {
    title: 'Search Smarter',
    subtitle: 'AI-Powered Candidate Discovery',
    description:
      'Describe who you\'re looking for in plain English. Apply generates Boolean search queries and finds candidates across Google, LinkedIn, and more — instantly surfacing talent that traditional searches miss.',
    icon: Search,
    color: 'text-purple-600',
    bgGradient: 'from-purple-50 to-indigo-50',
  },
  {
    title: 'Reach & Engage',
    subtitle: 'Contact, Outreach & Job Posts',
    description:
      'Find verified emails and phone numbers, send personalized outreach, and create AI-optimized job postings — all from one place. Every touchpoint is designed to connect you with the right candidates.',
    icon: Send,
    color: 'text-blue-600',
    bgGradient: 'from-blue-50 to-cyan-50',
  },
  {
    title: 'Interview & Hire',
    subtitle: 'AI Coaching & Video Calls',
    description:
      'Prep with AI-generated interview questions, run video interviews with real-time guidance, and close candidates faster. From first search to signed offer — Apply is with you every step.',
    icon: Video,
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
