import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CheckoutCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-gray-500" />
          </div>

          <h1 className="text-3xl font-black mb-4">Checkout Cancelled</h1>
          <p className="text-gray-600 mb-6">
            No worries! Your checkout was cancelled and you haven't been charged.
          </p>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-purple-800 mb-2">Still on Free Trial?</h3>
            <p className="text-purple-700 text-sm">
              Your free trial continues with all its features. Upgrade anytime
              when you're ready for unlimited access.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/pricing')}
              className="w-full py-6 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Pricing
            </Button>

            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full py-6 text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
            className="text-purple-600 hover:text-purple-700"
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
