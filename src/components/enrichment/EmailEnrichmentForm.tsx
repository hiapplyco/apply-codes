/**
 * Form for enriching profiles by email address
 */

import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Search } from 'lucide-react';
import { EmailFormProps } from './types';

const EmailEnrichmentForm = memo(({ onSubmit, isLoading }: EmailFormProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Please enter an email address');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    await onSubmit(email.trim().toLowerCase());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-input" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="email-input"
            type="email"
            placeholder="john.doe@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            disabled={isLoading}
            className={`pl-11 py-6 text-base border-2 ${
              error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
            } rounded-xl`}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <p className="text-xs text-gray-500">
          Enter a work or personal email address to find associated profile information
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !email.trim()}
        className="w-full py-6 bg-purple-600 hover:bg-purple-700 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl text-white font-bold text-lg transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Looking up email...
          </>
        ) : (
          <>
            <Search className="w-5 h-5 mr-2" />
            Find Contact Info
          </>
        )}
      </Button>
    </form>
  );
});

EmailEnrichmentForm.displayName = 'EmailEnrichmentForm';

export default EmailEnrichmentForm;
