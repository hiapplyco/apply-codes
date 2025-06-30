import { GoogleSignIn } from './GoogleSignIn';
import { LinkedInSignIn } from './LinkedInSignIn';

interface SocialAuthButtonsProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function SocialAuthButtons({ onSuccess, redirectTo }: SocialAuthButtonsProps) {
  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-black"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-600 font-medium">Or continue with</span>
        </div>
      </div>

      {/* Social login buttons */}
      <div className="space-y-3">
        <GoogleSignIn onSuccess={onSuccess} redirectTo={redirectTo} />
        <LinkedInSignIn onSuccess={onSuccess} redirectTo={redirectTo} />
        
        {/* Future social providers can be added here */}
        {/* <GitHubSignIn /> */}
      </div>
    </div>
  );
}