/**
 * Form for enriching profiles by LinkedIn URL or username
 */

import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Linkedin, Search } from 'lucide-react';
import { LinkedInFormProps } from './types';

const LinkedInEnrichmentForm = memo(({ onSubmit, isLoading }: LinkedInFormProps) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateInput = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Please enter a LinkedIn URL or username');
      return false;
    }

    // Check if it's a valid LinkedIn URL or username
    const isUrl = trimmed.includes('linkedin.com');
    const isUsername = /^@?[\w-]+$/.test(trimmed);

    if (!isUrl && !isUsername) {
      setError('Please enter a valid LinkedIn URL or username');
      return false;
    }

    // Check if it's a company page (not supported)
    if (trimmed.includes('/company/')) {
      setError('Company pages are not supported. Please use a personal profile URL.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput(value)) return;
    await onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="linkedin-input" className="text-sm font-medium text-gray-700">
          LinkedIn Profile
        </Label>
        <div className="relative">
          <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
          <Input
            id="linkedin-input"
            type="text"
            placeholder="https://linkedin.com/in/username or just username"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
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
          Enter a LinkedIn profile URL or just the username (e.g., "johndoe" or "@johndoe")
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="w-full py-6 bg-purple-600 hover:bg-purple-700 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl text-white font-bold text-lg transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Looking up profile...
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

LinkedInEnrichmentForm.displayName = 'LinkedInEnrichmentForm';

export default LinkedInEnrichmentForm;
