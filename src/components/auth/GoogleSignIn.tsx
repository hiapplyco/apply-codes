import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

declare global {
  interface Window {
    google: any;
    handleSignInWithGoogle: (response: any) => void;
  }
}

interface GoogleSignInProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function GoogleSignIn({ onSuccess, redirectTo = '/dashboard' }: GoogleSignInProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [nonce, setNonce] = useState<string>('');
  const [hashedNonce, setHashedNonce] = useState<string>('');

  // Generate nonce for security
  const generateNonce = async () => {
    const nonceValue = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonceValue);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonceValue = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    
    setNonce(nonceValue);
    setHashedNonce(hashedNonceValue);
    
    return { nonce: nonceValue, hashedNonce: hashedNonceValue };
  };

  useEffect(() => {
    const initializeGoogleSignIn = async () => {
      // Generate nonce first
      const { nonce: generatedNonce, hashedNonce: generatedHashedNonce } = await generateNonce();
      
      // Create global callback function
      window.handleSignInWithGoogle = async (response: any) => {
        setIsLoading(true);
        
        try {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
            nonce: generatedNonce,
          });

          if (error) {
            console.error('Google sign-in error:', error);
            toast.error(error.message || 'Failed to sign in with Google');
            return;
          }

          if (data.user) {
            toast.success('Successfully signed in with Google!');
            
            // Call onSuccess callback if provided
            if (onSuccess) {
              onSuccess();
            } else {
              // Default navigation
              navigate(redirectTo);
            }
          }
        } catch (error) {
          console.error('Unexpected error during Google sign-in:', error);
          toast.error('An unexpected error occurred');
        } finally {
          setIsLoading(false);
        }
      };

      // Load Google Sign-In script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Initialize Google Sign-In
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: window.handleSignInWithGoogle,
            nonce: generatedHashedNonce,
            use_fedcm_for_prompt: true, // Chrome third-party cookie phase-out support
            auto_select: false,
            cancel_on_tap_outside: true,
            auto_prompt: false, // Disable automatic prompt
          });

          // Render the button
          if (buttonRef.current) {
            window.google.accounts.id.renderButton(buttonRef.current, {
              type: 'standard',
              shape: 'pill',
              theme: 'outline',
              text: 'signin_with',
              size: 'large',
              logo_alignment: 'left',
              width: '100%',
              state: 'signin', // Force signin state (not continue)
            });
          }

          // Optional: Enable One Tap (can be toggled based on UX preferences)
          // window.google.accounts.id.prompt();
        }
      };

      document.head.appendChild(script);

      // Cleanup
      return () => {
        // Revoke Google session to ensure fresh state
        if (window.google?.accounts?.id) {
          window.google.accounts.id.disableAutoSelect();
        }
        // Remove the script when component unmounts
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        // Clean up global function
        delete window.handleSignInWithGoogle;
      };
    };

    initializeGoogleSignIn();
  }, [navigate, onSuccess, redirectTo]);

  // Fallback loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-3 border-2 border-gray-300 rounded-full">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
        <span className="ml-3 text-gray-600">Signing in...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* This div will be replaced by Google's button */}
      <div ref={buttonRef} className="google-signin-button"></div>
      
      {/* Fallback if Google script fails to load */}
      <noscript>
        <div className="text-center text-sm text-gray-500 p-4 border rounded">
          JavaScript is required to use Google Sign-In
        </div>
      </noscript>
    </div>
  );
}