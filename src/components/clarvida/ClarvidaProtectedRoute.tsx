'use client';

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useClarvidaAuth } from "@/context/ClarvidaAuthContext";

// Changed to accept children as a prop instead of using Outlet
export const ClarvidaProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useClarvidaAuth();
  const router = useRouter();
  const _pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/clarvida/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F0FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-800" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F0FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-800" />
      </div>
    );
  }

  // User is authenticated, render the children
  return <>{children}</>;
};
