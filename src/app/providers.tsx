'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { NewAuthProvider } from '@/context/NewAuthContext';
import { ClarvidaAuthProvider } from '@/context/ClarvidaAuthContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { Toaster } from 'sonner';
import { TrialExpirationModal } from '@/components/subscription/TrialExpirationModal';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <NewAuthProvider>
          <ProjectProvider>
            <ClarvidaAuthProvider>
              <Toaster position="top-center" />
              <TrialExpirationModal />
              {children}
            </ClarvidaAuthProvider>
          </ProjectProvider>
        </NewAuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
