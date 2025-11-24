import { useState } from "react";
import { Mail, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useNewAuth } from "@/context/NewAuthContext";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { PhoneAuth } from "./PhoneAuth";

interface UnifiedAuthFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export function UnifiedAuthForm({ redirectTo, onSuccess }: UnifiedAuthFormProps) {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useNewAuth();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, try to sign in using the AuthContext (which uses the bridge)
      const signInResult = await signIn(email, password);

      if (signInResult.error) {
        // If sign in fails with invalid credentials, try to sign up
        if (signInResult.error.message.includes('Invalid login credentials')) {
          const signUpResult = await signUp(email, password);

          if (signUpResult.error) {
            throw signUpResult.error;
          }

          toast({
            title: "Account created!",
            description: "Please check your email to confirm your account.",
          });
          if (onSuccess) onSuccess();
        } else {
          throw signInResult.error;
        }
      } else {
        // Sign in successful
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        if (onSuccess) onSuccess();
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication error",
        description: error instanceof Error ? error.message : "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Unified title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Sign in or Sign up</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your credentials below. We'll automatically create an account if you're new.
        </p>
      </div>

      {/* Tab Buttons for Email/Phone */}
      <div className="flex rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <button
          onClick={() => setAuthMethod('email')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
            authMethod === 'email'
              ? 'bg-[#8B5CF6] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
        <button
          onClick={() => setAuthMethod('phone')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors border-l-2 border-black ${
            authMethod === 'phone'
              ? 'bg-[#8B5CF6] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Phone className="h-4 w-4" />
          Phone
        </button>
      </div>
      
      {/* Auth Forms */}
      {authMethod === 'email' ? (
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={async () => {
                  if (email) {
                    try {
                      const result = await resetPasswordForEmail(email, { redirectTo: redirectTo || `${window.location.origin}/reset-password` });
                      if (result.error) {
                        toast({
                          title: "Error",
                          description: result.error.message,
                          variant: "destructive",
                        });
                      } else {
                        toast({
                          title: "Password reset email sent",
                          description: "Please check your email for password reset instructions.",
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to send password reset email.",
                        variant: "destructive",
                      });
                    }
                  } else {
                    toast({
                      title: "Email required",
                      description: "Please enter your email address first.",
                      variant: "destructive",
                    });
                  }
                }}
                className="text-sm text-[#8B5CF6] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            />
            <p className="text-xs text-gray-500">
              Minimum 6 characters
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      ) : (
        /* Phone Authentication */
        <PhoneAuth onSuccess={onSuccess} redirectTo={redirectTo} />
      )}
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>
      
      {/* Social Auth Buttons - Google, LinkedIn, etc. */}
      <SocialAuthButtons onSuccess={onSuccess} redirectTo={redirectTo} />
    </div>
  );
}