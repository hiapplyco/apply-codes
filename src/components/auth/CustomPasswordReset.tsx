
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomPasswordResetProps {
  onBack?: () => void;
}

export function CustomPasswordReset({ onBack }: CustomPasswordResetProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Use Supabase's built-in password reset
      // This generates the reset token and sends the email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast.success('Password reset email sent! Check your inbox (and spam folder).');

      // NOTE: To use custom SendGrid emails, you need to:
      // 1. Disable Supabase's default emails in the dashboard
      // 2. Set up Supabase Auth Hooks to capture the reset token
      // 3. Send the custom email with the actual reset token link
      // See: https://supabase.com/docs/guides/auth/auth-hooks

    } catch (error: unknown) {
      console.error('Password reset error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Reset Your Password</h2>
        <p className="text-gray-600 mt-2">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      {onBack && (
        <Button variant="ghost" onClick={onBack} className="w-full">
          Back to Sign In
        </Button>
      )}
    </div>
  );
}
