/**
 * Unified Animation System
 * 
 * Centralized animation constants and utilities for consistent,
 * performant animations across the application.
 */

// Animation durations in milliseconds
export const ANIMATION_DURATION = {
    INSTANT: 100,    // Micro-interactions (checkbox, toggle)
    FAST: 150,       // Hover states, tooltips
    NORMAL: 200,     // Standard transitions (buttons, cards)
    SLOW: 300,       // Page transitions, modals
    VERY_SLOW: 500,  // Complex animations
} as const;

// Animation easing functions
export const ANIMATION_EASING = {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',         // ease-in-out
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',           // ease-in
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',          // ease-out
    SPRING: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // bounce effect
} as const;

// Tailwind animation classes
export const ANIMATION_CLASS = {
    // Page transitions
    PAGE_ENTER: 'animate-fade-in',
    PAGE_EXIT: 'animate-fade-out',

    // Loading states
    SPIN: 'animate-spin',

    // Hover/interaction states
    TRANSITION_COLORS: 'transition-colors',
    TRANSITION_ALL: 'transition-all',

    // Durations
    DURATION_FAST: 'duration-150',
    DURATION_NORMAL: 'duration-200',
    DURATION_SLOW: 'duration-300',
} as const;

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get animation class with reduced motion support
export const getAnimationClass = (normalClass: string, reducedClass: string = ''): string => {
    return prefersReducedMotion() ? reducedClass : normalClass;
};

// Standard class combinations
export const STANDARD_TRANSITIONS = {
    HOVER: `${ANIMATION_CLASS.TRANSITION_COLORS} ${ANIMATION_CLASS.DURATION_FAST}`,
    INTERACTIVE: `${ANIMATION_CLASS.TRANSITION_ALL} ${ANIMATION_CLASS.DURATION_NORMAL}`,
    SMOOTH: `${ANIMATION_CLASS.TRANSITION_ALL} ${ANIMATION_CLASS.DURATION_SLOW}`,
} as const;
