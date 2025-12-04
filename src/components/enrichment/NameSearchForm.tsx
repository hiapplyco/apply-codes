/**
 * Form for searching contacts by name and optional fields
 */

import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, User, Building2, Briefcase, MapPin } from 'lucide-react';
import { NameSearchFormProps, NameSearchParams } from './types';

const NameSearchForm = memo(({ onSubmit, isLoading }: NameSearchFormProps) => {
  const [params, setParams] = useState<NameSearchParams>({
    firstName: '',
    lastName: '',
    company: '',
    title: '',
    location: '',
    industry: ''
  });
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { firstName?: string; lastName?: string } = {};

    if (!params.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!params.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(params);
  };

  const updateParam = (key: keyof NameSearchParams, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
    if (errors[key as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Required Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
            First Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={params.firstName}
              onChange={(e) => updateParam('firstName', e.target.value)}
              disabled={isLoading}
              className={`pl-11 py-5 border-2 ${
                errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
              } rounded-xl`}
            />
          </div>
          {errors.firstName && (
            <p className="text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={params.lastName}
              onChange={(e) => updateParam('lastName', e.target.value)}
              disabled={isLoading}
              className={`pl-11 py-5 border-2 ${
                errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
              } rounded-xl`}
            />
          </div>
          {errors.lastName && (
            <p className="text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Optional Fields */}
      <div className="pt-2">
        <p className="text-sm text-gray-500 mb-3">Optional filters (improve accuracy)</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium text-gray-700">
              Company
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="company"
                type="text"
                placeholder="Acme Corp"
                value={params.company}
                onChange={(e) => updateParam('company', e.target.value)}
                disabled={isLoading}
                className="pl-11 py-5 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Job Title
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="title"
                type="text"
                placeholder="Software Engineer"
                value={params.title}
                onChange={(e) => updateParam('title', e.target.value)}
                disabled={isLoading}
                className="pl-11 py-5 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-gray-700">
              Location
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="location"
                type="text"
                placeholder="San Francisco, CA"
                value={params.location}
                onChange={(e) => updateParam('location', e.target.value)}
                disabled={isLoading}
                className="pl-11 py-5 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
              Industry
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="industry"
                type="text"
                placeholder="Technology"
                value={params.industry}
                onChange={(e) => updateParam('industry', e.target.value)}
                disabled={isLoading}
                className="pl-11 py-5 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !params.firstName.trim() || !params.lastName.trim()}
        className="w-full py-6 bg-purple-600 hover:bg-purple-700 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] rounded-xl text-white font-bold text-lg transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-5 h-5 mr-2" />
            Search Contacts
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Each result uses 1 credit. Results are returned with available contact information.
      </p>
    </form>
  );
});

NameSearchForm.displayName = 'NameSearchForm';

export default NameSearchForm;
