import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircle, AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OAuthResult {
  success: boolean;
  email?: string;
  error?: string;
  accountId?: string;
}

export default function GoogleOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<OAuthResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        setIsProcessing(true);

        // Get parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors
        if (error) {
          let errorMessage = 'OAuth authorization failed';
          
          switch (error) {
            case 'access_denied':
              errorMessage = 'Access was denied. Please grant the necessary permissions to continue.';
              break;
            case 'invalid_request':
              errorMessage = 'Invalid OAuth request. Please try again.';
              break;
            case 'unsupported_response_type':
              errorMessage = 'Unsupported response type. Please contact support.';
              break;
            case 'invalid_scope':
              errorMessage = 'Invalid scope requested. Please contact support.';
              break;
            case 'server_error':
              errorMessage = 'Google server error. Please try again later.';
              break;
            case 'temporarily_unavailable':
              errorMessage = 'Google services temporarily unavailable. Please try again later.';
              break;
            default:
              errorMessage = errorDescription || 'Unknown OAuth error occurred';
          }

          setResult({
            success: false,
            error: errorMessage
          });
          return;
        }

        // Validate required parameters
        if (!code) {
          setResult({
            success: false,
            error: 'Authorization code not received from Google'
          });
          return;
        }

        if (!state) {
          setResult({
            success: false,
            error: 'State parameter missing - possible security issue'
          });
          return;
        }

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setResult({
            success: false,
            error: 'User not authenticated. Please sign in first.'
          });
          return;
        }

        // Exchange authorization code for tokens
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
          'exchange-google-token',
          {
            body: {
              code,
              redirectUri: window.location.origin + '/oauth/google/callback',
              state
            }
          }
        );

        if (tokenError) {
          console.error('Token exchange error:', tokenError);
          setResult({
            success: false,
            error: `Failed to exchange authorization code: ${tokenError.message}`
          });
          return;
        }

        // Get user info from Google
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`
            }
          }
        );

        if (!userInfoResponse.ok) {
          throw new Error('Failed to get user information from Google');
        }

        const userInfo = await userInfoResponse.json();

        // Save Google account to database
        const googleAccount = {
          user_id: user.id,
          google_id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
          token_expiry: tokenData.expires_at,
          status: 'active',
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString()
        };

        const { data: savedAccount, error: saveError } = await supabase
          .from('google_accounts')
          .upsert(googleAccount, {
            onConflict: 'user_id,google_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (saveError) {
          console.error('Save account error:', saveError);
          setResult({
            success: false,
            error: `Failed to save Google account: ${saveError.message}`
          });
          return;
        }

        // Success!
        setResult({
          success: true,
          email: userInfo.email,
          accountId: savedAccount.id
        });

        // Show success toast
        toast.success(`Successfully connected Google account: ${userInfo.email}`);

        // Send success message to parent window if opened in popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            account: savedAccount
          }, window.location.origin);
          window.close();
          return;
        }

        // Redirect after a short delay
        setTimeout(() => {
          navigate('/settings/integrations', { replace: true });
        }, 3000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        });

        // Send error message to parent window if opened in popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          }, window.location.origin);
          window.close();
          return;
        }
      } finally {
        setIsProcessing(false);
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate]);

  // Handle manual navigation
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
                <h2 className="text-lg font-semibold mb-2">
                  Processing Google Authorization
                </h2>
                <p className="text-gray-600">
                  Please wait while we connect your Google account...
                </p>
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
              ? 'Your Google account has been connected successfully'
              : 'There was an issue connecting your Google account'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {result?.success ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully connected: <strong>{result.email}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  You can now use Google Drive and Docs features within Apply. 
                  You'll be redirected to settings shortly.
                </p>
              </div>

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
                  {result?.error || 'An unknown error occurred'}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Please try connecting your Google account again. If the problem persists, 
                  contact support for assistance.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleTryAgain} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={handleGoToHome}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}