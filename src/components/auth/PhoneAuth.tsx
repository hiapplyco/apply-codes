import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, ArrowLeft, Shield } from 'lucide-react';
import { trackEvent, trackRecruiterSignup, trackFormSubmit } from '@/lib/analytics';

interface PhoneAuthProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function PhoneAuth({ onSuccess, redirectTo = '/dashboard' }: PhoneAuthProps) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [countryCode, setCountryCode] = useState('+1'); // Default to US

  // Format phone number for display
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (countryCode === '+1') {
      if (phoneNumber.length <= 3) {
        return phoneNumber;
      } else if (phoneNumber.length <= 6) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
      } else {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
      }
    }
    
    return phoneNumber;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Remove formatting from phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!cleanPhone) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      const fullPhoneNumber = `${countryCode}${cleanPhone}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhoneNumber,
      });

      if (error) {
        toast.error(error.message || 'Failed to send verification code');
        trackEvent('Phone OTP Send', { success: 0 });
      } else {
        toast.success('Verification code sent!');
        setShowOtpInput(true);
        trackEvent('Phone OTP Send', { success: 1 });
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Phone auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const fullPhoneNumber = `${countryCode}${cleanPhone}`;
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        token: otp,
        type: 'sms',
      });

      if (error) {
        toast.error(error.message || 'Invalid verification code');
        trackFormSubmit('Phone Auth', false);
      } else if (data.user) {
        toast.success('Successfully signed in!');
        
        // Track successful phone sign-in
        const isNewUser = data.user.created_at === data.user.updated_at;
        if (isNewUser) {
          trackRecruiterSignup(true);
          trackEvent('Sign Up', { method: 'phone' });
        } else {
          trackEvent('Sign In', { method: 'phone' });
        }
        trackFormSubmit('Phone Auth', true);
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(redirectTo);
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {!showOtpInput ? (
        // Phone number input
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-24 px-3 py-2 border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              >
                <option value="+1">+1 🇺🇸</option>
                <option value="+44">+44 🇬🇧</option>
                <option value="+33">+33 🇫🇷</option>
                <option value="+49">+49 🇩🇪</option>
                <option value="+81">+81 🇯🇵</option>
                <option value="+86">+86 🇨🇳</option>
                <option value="+91">+91 🇮🇳</option>
                {/* Add more country codes as needed */}
              </select>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder={countryCode === '+1' ? '(555) 123-4567' : 'Phone number'}
                className="flex-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-[#8B5CF6]"
                required
              />
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#8B5CF6] hover:bg-[#7c4ef3] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Phone className="mr-2 h-4 w-4" />
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </form>
      ) : (
        // OTP verification
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center mb-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#8B5CF6]/10 border-2 border-black">
              <Shield className="h-6 w-6 text-[#8B5CF6]" />
            </div>
            <h3 className="text-lg font-semibold">Enter Verification Code</h3>
            <p className="text-sm text-gray-600 mt-1">
              We sent a 6-digit code to {countryCode} {phone}
            </p>
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              value={otp}
              onChange={(e) => {
                // Only allow digits and limit to 6 characters
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
              }}
              placeholder="123456"
              className="text-center text-2xl tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-[#8B5CF6]"
              maxLength={6}
              required
              autoComplete="one-time-code"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-[#8B5CF6] hover:bg-[#7c4ef3] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {isLoading ? 'Verifying...' : 'Verify & Sign In'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setShowOtpInput(false);
              setOtp('');
            }}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Use Different Number
          </Button>

          <p className="text-center text-sm text-gray-600">
            Didn't receive a code?{' '}
            <button
              type="button"
              onClick={handleSendOtp}
              className="text-[#8B5CF6] hover:underline font-medium"
              disabled={isLoading}
            >
              Resend
            </button>
          </p>
        </form>
      )}
    </div>
  );
}