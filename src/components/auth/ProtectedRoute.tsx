
import { Navigate, useLocation } from "react-router-dom";
import { useNewAuth } from "@/context/NewAuthContext";
import { Outlet } from "react-router-dom";
import { memo } from "react";

// Development bypass - set to false in production
const DEV_BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

const ProtectedRouteComponent = () => {
  const { isAuthenticated, isLoading } = useNewAuth();
  const location = useLocation();

  // Development bypass
  if (DEV_BYPASS_AUTH) {
    console.log('🔓 Auth bypassed for development');
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF4]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-800" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const ProtectedRoute = memo(ProtectedRouteComponent);
