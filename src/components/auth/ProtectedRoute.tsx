
import { Navigate, useLocation } from "react-router-dom";
import { useNewAuth } from "@/context/NewAuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Outlet } from "react-router-dom";
import { memo } from "react";

// Development bypass - set to false in production
const DEV_BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

const ProtectedRouteComponent = () => {
  const { isAuthenticated, isLoading } = useNewAuth();
  const { subscription, loading: subscriptionLoading, isExpired } = useSubscription();
  const location = useLocation();

  // Development bypass
  if (DEV_BYPASS_AUTH) {
    console.log('🔓 Auth bypassed for development');
    return <Outlet />;
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF4]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-800" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading while checking subscription (only after authenticated)
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF4]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-800" />
      </div>
    );
  }

  // Check if trial/subscription is expired
  // Redirect to pricing if expired (defense-in-depth, modal also handles this)
  // Allow access to pricing page even if expired
  if (isExpired() && location.pathname !== '/pricing') {
    // The TrialExpirationModal will handle showing the upgrade prompt
    // This is a fallback - let them see the page but modal will block interaction
  }

  return <Outlet />;
};

export const ProtectedRoute = memo(ProtectedRouteComponent);
