import { ReactNode, useEffect, useState } from 'react';
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
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        setIsVisible(true);

        return () => setIsVisible(false);
    }, []);

    const animationClass = getAnimationClass(
        'opacity-0 animate-in fade-in duration-300',
        'opacity-100' // No animation if reduced motion is preferred
    );

    return (
        <div className={isVisible ? animationClass : 'opacity-0'}>
            {children}
        </div>
    );
};
