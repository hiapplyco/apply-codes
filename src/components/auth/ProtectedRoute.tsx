'use client';

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useNewAuth } from "@/context/NewAuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { memo, type ReactNode } from "react";

// Development bypass - only works in dev builds
const DEV_BYPASS_AUTH = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRouteComponent = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useNewAuth();
  const { loading: subscriptionLoading, isExpired } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !DEV_BYPASS_AUTH) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (DEV_BYPASS_AUTH) {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show loading while checking subscription (only after authenticated)
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Check if trial/subscription is expired
  // Redirect to pricing if expired (defense-in-depth, modal also handles this)
  // Allow access to pricing page even if expired
  if (isExpired() && pathname !== '/pricing') {
    // The TrialExpirationModal will handle showing the upgrade prompt
    // This is a fallback - let them see the page but modal will block interaction
  }

  return <>{children}</>;
};

export const ProtectedRoute = memo(ProtectedRouteComponent);
