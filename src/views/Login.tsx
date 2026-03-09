'use client';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from 'next/navigation';
import { useNewAuth } from "@/context/NewAuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
interface FirebaseError {
  code?: string;
  message?: string;
}

const Login = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, signIn, signUp, signInWithGoogle, isLoading } = useNewAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Redirect destination: dashboard (Next.js doesn't have location state)
  const redirectTo = '/dashboard';

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success('Account created successfully! Starting your free trial...');
      } else {
        await signIn(email, password);
        toast.success('Welcome back!');
      }
    } catch (error: unknown) {
      const err = error as FirebaseError;
      const errorMessage = getErrorMessage(err?.code || err?.message || 'Unknown error');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome to Apply!');
    } catch (error: unknown) {
      const err = error as FirebaseError;
      if (err?.code !== 'auth/popup-closed-by-user') {
        toast.error('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    // Unified error messages — generic messages prevent account enumeration
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'Invalid email or password. Please check and try again.',
      'auth/wrong-password': 'Invalid email or password. Please check and try again.',
      'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/email-already-in-use': 'An account with this email already exists. Please sign in.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  };

  const buttonLoading = isLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/apply-logo-gradient.png"
            alt="Apply Logo"
            className="w-24 h-24 object-contain mb-4"
          />
          <h1 className="text-3xl font-black text-center mb-2 text-foreground">
            {isSignUp ? 'Start Your Free Trial' : 'Welcome Back'}
          </h1>
          <p className="text-muted-foreground text-center">
            {isSignUp
              ? '7 days free, no credit card required'
              : 'Sign in to continue recruiting smarter'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="border bg-card p-8 rounded-2xl shadow-sm">
          {/* Google Sign In - Primary Action */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || buttonLoading}
            className="w-full py-6 mb-6 rounded-xl font-semibold flex items-center justify-center gap-3"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-500">or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 py-6 border-2 border-gray-200 focus:border-primary rounded-xl text-base"
                required
                disabled={buttonLoading}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-11 py-6 border-2 border-gray-200 focus:border-primary rounded-xl text-base"
                required
                disabled={buttonLoading}
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>

            {!isSignUp && (
              <div className="text-right">
                <a
                  href="/reset-password-request"
                  className="text-sm text-primary hover:text-primary/80 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
            )}

            <Button
              type="submit"
              disabled={buttonLoading}
              className="w-full py-6 rounded-xl font-bold text-lg"
            >
              {buttonLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center mt-6 pt-6 border-t border-border">
            <span className="text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            {' '}
            <Button
              type="button"
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold p-0 h-auto"
            >
              {isSignUp ? 'Sign in' : 'Start free trial'}
            </Button>
          </div>
        </div>

        {/* Trial Benefits (only show on sign up) */}
        {isSignUp && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p className="mb-2">Your 7-day free trial includes:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <span>10 AI searches</span>
              <span>50 candidate enrichments</span>
              <span>100 AI assistant calls</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
