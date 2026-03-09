'use client';

import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CheckoutCancel = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl border p-8 shadow-sm text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-gray-500" />
          </div>

          <h1 className="text-3xl font-black mb-4">Checkout Cancelled</h1>
          <p className="text-muted-foreground mb-6">
            No worries! Your checkout was cancelled and you haven't been charged.
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-primary mb-2">Still on Free Trial?</h3>
            <p className="text-primary/80 text-sm">
              Your free trial continues with all its features. Upgrade anytime
              when you're ready for unlimited access.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/pricing')}
              className="w-full py-6 text-lg font-bold"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Pricing
            </Button>

            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full py-6 text-lg font-bold"
            >
              Continue to Dashboard
            </Button>
          </div>
        </div>

        {/* Help text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm mb-2">
            Have questions about our plans?
          </p>
          <Button
            variant="link"
            onClick={() => window.location.href = 'mailto:support@apply.codes'}
            className="text-primary hover:text-primary/80"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;
