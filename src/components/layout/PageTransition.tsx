import { ReactNode } from 'react';
import { getAnimationClass } from '@/utils/animations';

interface PageTransitionProps {
    children: ReactNode;
}

/**
 * PageTransition Component
 * 
 * Provides a consistent, lightweight fade-in animation for page loads.
 * Respects user's motion preferences for accessibility.
 */
export const PageTransition = ({ children }: PageTransitionProps) => {
    const animationClass = getAnimationClass(
        'animate-page-enter',
        '' // No animation class if reduced motion is preferred
    );

    return (
        <div className={animationClass}>
            {children}
        </div>
    );
};
