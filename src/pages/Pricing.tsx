import { useState } from 'react';
import { Check, X, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSubscription } from '@/hooks/useSubscription';
import { useNewAuth } from '@/context/NewAuthContext';

// Stripe Price IDs
const PRICE_IDS = {
  pro_monthly: 'price_1SZkXQC3HTLX6YIcgrBDgC3m',
  pro_yearly: 'price_1SZkYCC3HTLX6YIcjIPoUdMi',
};

const Pricing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useNewAuth();
  const { createCheckoutSession, subscription } = useSubscription();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (tier: string) => {
    if (tier === 'enterprise') {
      window.location.href = 'mailto:sales@apply.codes?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    if (tier === 'free_trial') {
      navigate('/login');
      return;
    }

    // For Pro plan, need to be authenticated
    if (!isAuthenticated) {
      navigate(`/login?plan=${tier}&billing=${isYearly ? 'yearly' : 'monthly'}`);
      return;
    }

    // Create checkout session
    setLoadingPlan(tier);
    try {
      const priceId = isYearly ? PRICE_IDS.pro_yearly : PRICE_IDS.pro_monthly;
      const result = await createCheckoutSession(priceId);
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const tiers = [
    {
      name: 'Free Trial',
      price: 'Free',
      yearlyPrice: 'Free',
      period: '7 days',
      description: 'Try all features with no commitment',
      features: [
        { text: '10 AI-powered searches', included: true },
        { text: 'Boolean search generation', included: true },
        { text: 'LinkedIn & platform integrations', included: true },
        { text: '50 contact enrichments', included: true },
        { text: '100 AI chat interactions', included: true },
        { text: '5 video interviews', included: true },
        { text: '3 active projects', included: true },
        { text: 'Email support', included: true },
        { text: 'No credit card required', included: true },
      ],
      popular: false,
      cta: isAuthenticated ? 'Current Plan' : 'Start Free Trial',
      tier: 'free_trial',
      disabled: isAuthenticated && subscription?.status !== 'expired',
    },
    {
      name: 'Pro',
      price: '$149',
      yearlyPrice: '$1,490',
      period: 'month',
      yearlyPeriod: 'year',
      yearlySavings: 'Save $298/year',
      description: 'Everything you need to hire faster',
      features: [
        { text: 'Unlimited AI searches', included: true },
        { text: 'Advanced boolean optimization', included: true },
        { text: 'All platform integrations', included: true },
        { text: 'Unlimited contact enrichments', included: true },
        { text: 'Unlimited AI chat interactions', included: true },
        { text: 'Unlimited video interviews', included: true },
        { text: '25 active projects', included: true },
        { text: '5 team members', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Advanced analytics & reporting', included: true },
        { text: 'Bulk operations', included: true },
        { text: 'API access', included: true },
      ],
      popular: true,
      cta: subscription?.tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      tier: 'pro',
      disabled: subscription?.tier === 'pro',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      yearlyPrice: 'Custom',
      period: '',
      description: 'For large teams with advanced needs',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited projects', included: true },
        { text: 'Unlimited team members', included: true },
        { text: 'SSO & advanced security', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Dedicated success manager', included: true },
        { text: 'SLA guarantees', included: true },
        { text: 'Training & onboarding', included: true },
        { text: 'White-label options', included: true },
        { text: '24/7 priority support', included: true },
      ],
      popular: false,
      cta: 'Contact Sales',
      tier: 'enterprise',
      disabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-12 h-12 bg-purple-600 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <span className="text-white font-black text-xl">A</span>
              </div>
              <h1 className="text-2xl font-black">Apply</h1>
            </div>
            <Button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="bg-purple-600 hover:bg-purple-700 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              {isAuthenticated ? 'Dashboard' : 'Sign In'}
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 border-2 border-purple-300 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-800">AI-POWERED RECRUITING</span>
          </div>
          <h1 className="text-5xl font-black mb-6">
            Simple, transparent
            <span className="block text-purple-600">pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Start with a 7-day free trial. No credit card required.
            Upgrade when you're ready.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg font-semibold ${!isYearly ? 'text-purple-600' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-purple-600"
            />
            <span className={`text-lg font-semibold ${isYearly ? 'text-purple-600' : 'text-gray-500'}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold border-2 border-green-300">
                Save 17%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-2xl border-4 border-black p-8 ${
                tier.popular
                  ? 'shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] scale-105 z-10'
                  : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              } hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold border-2 border-black">
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-black mb-2">{tier.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black">
                    {isYearly && tier.yearlyPrice !== 'Custom' && tier.yearlyPrice !== 'Free'
                      ? tier.yearlyPrice
                      : tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-gray-600 font-medium">
                      /{isYearly && tier.yearlyPeriod ? tier.yearlyPeriod : tier.period}
                    </span>
                  )}
                </div>
                {isYearly && tier.yearlySavings && (
                  <span className="inline-block mt-2 bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                    {tier.yearlySavings}
                  </span>
                )}
                <p className="text-gray-600 mt-2">{tier.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`${feature.included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(tier.tier)}
                disabled={tier.disabled || loadingPlan === tier.tier}
                className={`w-full py-6 text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  tier.popular
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-white hover:bg-gray-50 text-black'
                }`}
              >
                {loadingPlan === tier.tier ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  tier.cta
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-lg mb-2">What's included in the free trial?</h3>
              <p className="text-gray-600">
                You get 7 days to try all features: 10 searches, 50 contact enrichments, 100 AI interactions, 5 video interviews, and 3 projects. No credit card required.
              </p>
            </div>
            <div className="bg-white rounded-xl border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-lg mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or cancel your subscription at any time from your account settings. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-white rounded-xl border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-lg mb-2">How does contact enrichment work?</h3>
              <p className="text-gray-600">
                Our AI agents automatically find and verify email addresses and phone numbers for candidates you're interested in using multiple data sources.
              </p>
            </div>
            <div className="bg-white rounded-xl border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to transform your recruiting?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of recruiters using AI to find perfect candidates faster
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold px-8 py-6 text-lg"
            >
              Start Free Trial
            </Button>
            <Button
              onClick={() => navigate('/')}
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-2 border-white hover:bg-white/10 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] transform hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold px-8 py-6 text-lg"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
