import { useState } from 'react';
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
      // Firebase doesn't have built-in LinkedIn OAuth like Supabase
      // We would need to implement LinkedIn OAuth manually or use a custom solution
      // For now, show a message that LinkedIn auth is not yet supported with Firebase
      toast.error('LinkedIn authentication is not yet configured for Firebase. Please use email/password or Google authentication.');

      // TODO: Implement LinkedIn OAuth with Firebase
      // This would require:
      // 1. Setting up LinkedIn OAuth app
      // 2. Implementing custom OAuth flow
      // 3. Using Firebase custom token generation

      console.log('LinkedIn OAuth with Firebase not implemented yet');
    } catch (error) {
      console.error('Unexpected error during LinkedIn sign-in:', error);
      toast.error('An unexpected error occurred');
    } finally {
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