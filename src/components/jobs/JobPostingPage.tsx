
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { JobPostingForm } from './JobPostingForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useJobPostingForm } from './hooks/useJobPostingForm';

export const JobPostingPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // Pre-fetch job data to handle loading state at the page level
  const { isLoading, error } = useJobPostingForm({ 
    jobId: id,
    onSuccess: () => {} 
  });
  
  const handleSuccess = () => {
    console.log('Job posted successfully');
    // Navigation is now handled in useJobPostingForm
  };
  
  const handleCancel = () => {
    navigate(-1);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">
          {id ? 'Edit Job Posting' : 'Create New Job Posting'}
        </h1>
      </div>
      
      {submissionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {submissionError}
          </AlertDescription>
        </Alert>
      )}
      
      <JobPostingForm 
        jobId={id} 
        onSuccess={handleSuccess} 
        onCancel={handleCancel}
        onError={(errorMessage) => setSubmissionError(errorMessage)} 
      />
    </div>
  );
}
