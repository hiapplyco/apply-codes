'use client';

import { useCallback, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleNavigation = useCallback((path: string) => {
    if (path === pathname) return;

    setIsNavigating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);

    router.push(path);

    return () => clearInterval(interval);
  }, [router, pathname]);

  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isNavigating]);

  return {
    isNavigating,
    progress,
    handleNavigation,
    currentPath: pathname
  };
}
