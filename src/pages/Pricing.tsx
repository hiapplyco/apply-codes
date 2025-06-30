import { Check, Zap, Users, Building2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Pricing = () => {
  const navigate = useNavigate();

  const tiers = [
    {
      name: 'Starter',
      price: '$99',
      period: 'month',
      description: 'Perfect for individual recruiters and small teams',
      features: [
        '100 AI searches per month',
        'Basic boolean search generation',
        'LinkedIn & Indeed integration',
        'Save up to 500 candidates',
        'Basic contact enrichment',
        'Email support',
      ],
      popular: false,
      cta: 'Start Free Trial',
    },
    {
      name: 'Professional',
      price: '$299',
      period: 'month',
      description: 'Ideal for growing recruiting teams',
      features: [
        'Unlimited AI searches',
        'Advanced boolean optimization',
        'All platform integrations',
        'Unlimited candidate storage',
        'Full contact enrichment',
        'AI chat assistant',
        'Projects & collaboration',
        'Priority support',
        'Custom AI agents',
      ],
      popular: true,
      cta: 'Start Free Trial',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large teams with advanced needs',
      features: [
        'Everything in Professional',
        'Dedicated AI agent customization',
        'API access',
        'SSO & advanced security',
        'Custom integrations',
        'Dedicated success manager',
        'SLA guarantees',
        'Training & onboarding',
        'White-label options',
      ],
      popular: false,
      cta: 'Contact Sales',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <span className="text-white font-black text-xl">A</span>
              </div>
              <h1 className="text-2xl font-black">Apply</h1>
            </div>
            <Button 
              onClick={() => navigate('/login')}
              className="bg-purple-600 hover:bg-purple-700 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Sign In
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
            Pricing that scales with your
            <span className="block text-purple-600">recruiting success</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required. 
            Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-2xl border-4 border-black p-8 ${
                tier.popular
                  ? 'shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] scale-105'
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
                  <span className="text-4xl font-black">{tier.price}</span>
                  {tier.period && (
                    <span className="text-gray-600 font-medium">/{tier.period}</span>
                  )}
                </div>
                <p className="text-gray-600 mt-2">{tier.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate(tier.name === 'Enterprise' ? '/contact' : '/login')}
                className={`w-full py-6 text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${
                  tier.popular
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-white hover:bg-gray-50 text-black'
                }`}
              >
                {tier.cta}
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
                You get full access to all Professional features for 14 days. No credit card required.
              </p>
            </div>
            <div className="bg-white rounded-xl border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-lg mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time from your account settings.
              </p>
            </div>
            <div className="bg-white rounded-xl border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-lg mb-2">How does contact enrichment work?</h3>
              <p className="text-gray-600">
                Our AI agents automatically find and verify email addresses and phone numbers for candidates you're interested in.
              </p>
            </div>
            <div className="bg-white rounded-xl border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-lg mb-2">What platforms do you integrate with?</h3>
              <p className="text-gray-600">
                We support LinkedIn, Indeed, Monster, Dice, and many other major job platforms. Enterprise plans can add custom integrations.
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
          <div className="flex gap-4 justify-center">
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