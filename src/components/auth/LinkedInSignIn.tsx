import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Linkedin } from 'lucide-react';

interface LinkedInSignInProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LinkedInSignIn({ onSuccess, redirectTo = '/dashboard' }: LinkedInSignInProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLinkedInSignIn = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          scopes: 'openid profile email',
        },
      });

      if (error) {
        console.error('LinkedIn sign-in error:', error);
        toast.error(error.message || 'Failed to sign in with LinkedIn');
        setIsLoading(false);
        return;
      }

      // The OAuth flow will redirect the user, so no need to handle success here
      // The auth callback will handle the redirect and onSuccess callback
    } catch (error) {
      console.error('Unexpected error during LinkedIn sign-in:', error);
      toast.error('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLinkedInSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-start gap-3 px-6 py-2.5 border border-gray-300 rounded-full bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <div className="w-5 h-5 flex items-center justify-center">
            <Linkedin className="w-4 h-4" style={{ color: '#0077B5' }} />
          </div>
          <span>Sign in with LinkedIn</span>
        </>
      )}
    </button>
  );
}