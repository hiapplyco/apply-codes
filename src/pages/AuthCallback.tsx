import { useEffect, useRef } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useNewAuth } from '@/context/NewAuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useNewAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current || isLoading) {
      return;
    }

    handledRef.current = true;

    // Validate redirect target to prevent open redirects (must be relative path)
    const rawNext = decodeURIComponent(searchParams.get('next') || '/dashboard');
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

    if (isAuthenticated) {
      toast.success('Successfully signed in!');
      navigate(next, { replace: true });
    } else {
      toast.error('Authentication failed. Please try signing in again.');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text="Completing sign in..." />
    </div>
  );
}
