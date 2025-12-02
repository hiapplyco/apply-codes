import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUnifiedAuth } from "@/context/UnifiedAuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, Eye, EyeOff, Chrome } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

const Login = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signIn, signUp, isLoading } = useUnifiedAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (result.error) {
        // Provide user-friendly error messages
        const errorMessage = getErrorMessage(result.error.message || result.error.code);
        toast.error(errorMessage);
      } else {
        toast.success(isSignUp ? 'Account created successfully! Starting your free trial...' : 'Welcome back!');
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error?.message || error?.code || 'Unknown error');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast.error('Authentication not initialized');
      return;
    }

    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      await signInWithPopup(auth, provider);
      toast.success('Welcome to Apply!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email. Would you like to sign up?',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/email-already-in-use': 'An account with this email already exists. Please sign in.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  };

  const buttonLoading = isLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/lovable-uploads/a36a9030-18dd-4eec-bf47-21de5406f97b.png"
            alt="Apply Logo"
            className="w-24 h-24 object-contain mb-4"
          />
          <h1 className="text-3xl font-black text-center mb-2 text-gray-900">
            {isSignUp ? 'Start Your Free Trial' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600 text-center">
            {isSignUp
              ? '7 days free, no credit card required'
              : 'Sign in to continue recruiting smarter'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-8 rounded-2xl">
          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || buttonLoading}
            className="w-full py-6 mb-6 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-medium flex items-center justify-center gap-3"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Chrome className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
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
                className="pl-11 py-6 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-base"
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
                className="pl-11 pr-11 py-6 border-2 border-gray-200 focus:border-purple-500 rounded-xl text-base"
                required
                disabled={buttonLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {!isSignUp && (
              <div className="text-right">
                <Link
                  to="/reset-password-request"
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              disabled={buttonLoading}
              className="w-full py-6 bg-purple-600 hover:bg-purple-700 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl text-white font-bold text-lg transition-all"
            >
              {buttonLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <span className="text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            {' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Start free trial'}
            </button>
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
          <a href="/terms" className="text-purple-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Login;