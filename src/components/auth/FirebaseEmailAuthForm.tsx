import { useState } from 'react';
import { useNewAuth } from '@/context/NewAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { toast } from 'sonner';

interface FirebaseEmailAuthFormProps {
  view: 'sign_in' | 'sign_up';
  onSuccess?: () => void;
  redirectTo?: string;
}

export function FirebaseEmailAuthForm({ view, onSuccess, redirectTo }: FirebaseEmailAuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { signIn, signUp } = useNewAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (view === 'sign_in') {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password);
      }

      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success(view === 'sign_in' ? 'Successfully signed in!' : 'Account created successfully!');
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordForEmail(email, { redirectTo });
      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success('Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email address</Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-[#8B5CF6]"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#8B5CF6] hover:bg-[#7c4ef3] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {isLoading ? 'Sending...' : 'Send reset instructions'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowForgotPassword(false)}
          className="w-full"
        >
          Back to sign in
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-[#8B5CF6]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {view === 'sign_up' ? 'Create a secure password' : 'Password'}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={view === 'sign_up' ? 'Create a secure password' : 'Enter your password'}
            className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-[#8B5CF6] pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#8B5CF6] hover:bg-[#7c4ef3] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        {isLoading
          ? (view === 'sign_in' ? 'Signing in...' : 'Creating account...')
          : (view === 'sign_in' ? 'Sign in to your account' : 'Create your account')
        }
      </Button>

      {view === 'sign_in' && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-[#8B5CF6] hover:underline text-sm"
          >
            Forgot your password?
          </button>
        </div>
      )}
    </form>
  );
}