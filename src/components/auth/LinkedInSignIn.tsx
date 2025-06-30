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
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-black rounded-full bg-[#0077B5] text-white font-medium hover:bg-[#005885] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <Linkedin className="w-5 h-5" />
          <span>Sign in with LinkedIn</span>
        </>
      )}
    </button>
  );
}