import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails with invalid credentials, try to sign up
        if (signInError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectTo || `${window.location.origin}/dashboard`,
            },
          });

          if (signUpError) {
            throw signUpError;
          }

          if (signUpData?.user?.identities?.length === 0) {
            toast({
              title: "Account already exists",
              description: "Please sign in with your existing account or reset your password.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Account created!",
              description: "Please check your email to confirm your account.",
            });
            if (onSuccess) onSuccess();
          }
        } else {
          throw signInError;
        }
      } else {
        // Sign in successful
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication error",
        description: error.message || "An error occurred during authentication.",
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
                onClick={() => window.location.href = '/reset-password'}
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