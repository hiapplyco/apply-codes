'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

const CheckoutSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, refetch } = useSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Poll for subscription update (webhook may take a moment)
    const checkSubscription = async () => {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        await refetch();

        // Check if subscription is now active
        if (subscription?.status === 'active' && subscription?.tier === 'pro') {
          setIsVerifying(false);
          return;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }

      // Even if webhook hasn't processed yet, show success
      // (Stripe checkout was successful, webhook will update eventually)
      setIsVerifying(false);
    };

    if (sessionId) {
      checkSubscription();
    } else {
      setIsVerifying(false);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl border p-8 shadow-sm text-center">
          {isVerifying ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
              </div>
              <h1 className="text-3xl font-black mb-4">Verifying Payment...</h1>
              <p className="text-muted-foreground mb-6">
                Please wait while we confirm your subscription.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <PartyPopper className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-black mb-4">Welcome to Pro!</h1>
              <p className="text-muted-foreground mb-6">
                Your subscription is now active. You have access to all Pro features!
              </p>

              <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-green-800 mb-2">What's Unlocked:</h3>
                <ul className="text-left text-green-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Unlimited AI searches
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Unlimited contact enrichments
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Advanced analytics
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-6 text-lg font-bold"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => router.push('/sourcing')}
                  variant="outline"
                  className="w-full py-6 text-lg font-bold"
                >
                  Start Sourcing
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Receipt info */}
        <p className="text-center text-gray-500 text-sm mt-6">
          A receipt has been sent to your email address.
          <br />
          You can manage your subscription in Settings.
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
