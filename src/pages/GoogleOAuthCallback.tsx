import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircle, AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface OAuthResult {
  success: boolean;
  error?: string;
}

export default function GoogleOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<OAuthResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      setIsProcessing(true);

      try {
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (error) {
          const errorMessage = errorDescription || 'Google authorization failed';
          notifyParent({ type: 'GOOGLE_AUTH_ERROR', error: errorMessage });
          setResult({ success: false, error: errorMessage });
          return;
        }

        if (!code || !state) {
          const errorMessage = 'Missing authorization parameters';
          notifyParent({ type: 'GOOGLE_AUTH_ERROR', error: errorMessage });
          setResult({ success: false, error: errorMessage });
          return;
        }

        notifyParent({ type: 'GOOGLE_AUTH_SUCCESS', code, state });
        setResult({ success: true });
        toast.success('Google authorization successful');
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
        notifyParent({ type: 'GOOGLE_AUTH_ERROR', error: errorMessage });
        setResult({ success: false, error: errorMessage });
      } finally {
        setIsProcessing(false);
        if (window.opener) {
          window.close();
        }
      }
    };

    processCallback();
  }, [searchParams]);

  const notifyParent = (message: Record<string, any>) => {
    if (window.opener) {
      window.opener.postMessage(message, window.location.origin);
    }
  };

  const handleGoToSettings = () => {
    navigate('/settings/integrations');
  };

  const handleGoToHome = () => {
    navigate('/dashboard');
  };

  const handleTryAgain = () => {
    navigate('/settings/integrations');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <LoadingSpinner className="w-8 h-8" />
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Processing Google Authorization</h2>
                <p className="text-gray-600">Please wait while we finish connecting your Google account...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {result?.success ? (
              <CheckCircle className="w-16 h-16 text-green-600" />
            ) : (
              <AlertCircle className="w-16 h-16 text-red-600" />
            )}
          </div>
          <CardTitle className={result?.success ? 'text-green-900' : 'text-red-900'}>
            {result?.success ? 'Connection Successful!' : 'Connection Failed'}
          </CardTitle>
          <CardDescription>
            {result?.success
              ? 'You can return to the application to continue setup.'
              : 'There was an issue connecting your Google account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result?.success ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  You may now close this tab or return to the application.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
                <Button onClick={handleGoToSettings} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Go to Settings
                </Button>
                <Button variant="outline" onClick={handleGoToHome}>
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {result?.error || 'An unknown error occurred. Please try again later.'}
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Please try reconnecting your Google account from the Integrations page.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleTryAgain} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
