import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileScan,
  Video,
  Workflow,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Users,
  TrendingUp,
  MessageSquare,
  Briefcase,
  Globe,
  Database,
  Link,
  ChevronRight,
  Quote,
  Check,
  X,
  Sparkles
} from "lucide-react";
import { useEffect, useState } from "react";
import { PlatformCarousel } from "@/components/landing/PlatformCarousel";
import { MetaTags } from "@/components/landing/MetaTags";
import { StructuredData } from "@/components/landing/StructuredData";
import { useNewAuth } from "@/context/NewAuthContext";

// SEO-friendly testimonials data
const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Director of Talent Operations",
    company: "Series B SaaS Startup",
    emoji: "👩🏻‍💼",
    content: "Apply's AI platform completely transformed our hiring efficiency. The integrated tools helped us scale from 10 to 50 engineers in 6 months while reducing our operational costs by 25%. The structured video interviews and candidate matching saved us countless hours.",
    rating: 5
  },
  {
    id: 2,
    name: "Marcus Williams",
    role: "VP of People Operations",
    company: "Fortune 500 Tech Company",
    emoji: "👨🏾‍💼",
    content: "I was skeptical about AI recruitment until Apply. Their platform helps us analyze candidate patterns and improve our diversity hiring by 35%. The website analysis tools reveal insights we'd never notice manually. It's like having a senior recruiter available 24/7.",
    rating: 5
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Head of Talent Strategy",
    company: "High-Growth Fintech",
    emoji: "👩🏽‍💼",
    content: "Apply solved our biggest challenge: finding niche technical talent. Their AI understands context beyond keywords - it knows that a 'Rust developer who contributed to blockchain projects' needs different sourcing than generic searches. We filled 3 impossible roles in 2 weeks.",
    rating: 5
  },
  {
    id: 4,
    name: "James Park",
    role: "People Operations Manager",
    company: "Healthcare Tech Startup",
    emoji: "👨🏻‍💼",
    content: "As a lean startup, Apply gave us enterprise-level recruiting capabilities without the cost. The AI helps optimize job descriptions, coordinate multi-platform sourcing, and manage interviews. It's like having a dedicated recruiting team available 24/7.",
    rating: 5
  },
  {
    id: 5,
    name: "Aisha Patel",
    role: "Chief People Officer",
    company: "Global Consulting Firm",
    emoji: "👩🏾‍💼",
    content: "Apply's integration with our ATS was a game-changer. We're now making data-driven hiring decisions at scale. The platform identified that our best performers came from non-traditional backgrounds, completely changing our sourcing strategy.",
    rating: 5
  }
];

// Featured integrations for showcase
const featuredIntegrations = [
  { name: "Greenhouse", logo: "🌿", category: "ATS" },
  { name: "Lever", logo: "📊", category: "ATS" },
  { name: "Workday", logo: "☁️", category: "HRIS" },
  { name: "BambooHR", logo: "🎋", category: "HRIS" },
  { name: "Rippling", logo: "💧", category: "HRIS" },
  { name: "Nymeria", logo: "🔍", category: "Data" },
  { name: "GitHub", logo: "🐙", category: "Sourcing" },
  { name: "Hunter.io", logo: "📧", category: "Email" }
];

// Pricing tiers for landing page
const pricingTiers = [
  {
    name: 'Standard',
    price: '$149',
    period: 'month',
    description: 'Perfect for individual recruiters and small businesses',
    features: [
      { text: '1 user included', included: true },
      { text: 'AI candidate sourcing & matching', included: true },
      { text: 'Basic analytics & reports', included: true },
      { text: 'Guided setup & onboarding', included: true },
      { text: 'Email + chat support', included: true },
      { text: '7-day free trial', included: true },
      { text: 'Additional users $10/month', included: true },
      { text: 'Video conferencing tools', included: false },
      { text: 'Third-party integrations', included: false },
      { text: 'Advanced branding', included: false },
    ],
    popular: false,
    cta: 'Start 7-Day Trial',
  },
  {
    name: 'Professional',
    price: '$379',
    period: 'month',
    description: 'Ideal for growing teams and recruitment agencies',
    features: [
      { text: '3 users included', included: true },
      { text: 'Everything in Standard', included: true },
      { text: 'Structured video conferencing', included: true },
      { text: 'Website analysis & synopsis tools', included: true },
      { text: 'Initial ATS integration', included: true },
      { text: 'Advanced branding options', included: true },
      { text: 'Standard analytics & reporting', included: true },
      { text: '3 hours/month support', included: true },
      { text: '14-day free trial', included: true },
      { text: 'Additional users $7/month', included: true },
      { text: 'White-labeling', included: false },
      { text: 'Full integrations (Rippling+)', included: false },
    ],
    popular: true,
    cta: 'Start 14-Day Trial',
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: 'user/month',
    description: 'For enterprise teams (5 user minimum)',
    features: [
      { text: '5 users minimum ($495/month)', included: true },
      { text: 'Everything in Professional', included: true },
      { text: 'Full white-labeling options', included: true },
      { text: 'Full integrations (Rippling+)', included: true },
      { text: 'Advanced tailored analytics', included: true },
      { text: 'Dedicated support manager', included: true },
      { text: 'Custom billing cycles', included: true },
      { text: '21-day trial + strategic call', included: true },
      { text: 'Additional users $99/month', included: true },
      { text: 'Custom integrations available', included: true },
      { text: 'SLA guarantees', included: true },
      { text: 'API access', included: true },
    ],
    popular: false,
    cta: 'Contact Sales',
  },
];

// Removed fake stats - will show trust differently

const LandingPageEnhanced = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { isAuthenticated } = useNewAuth();

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Get Started click with fast auth check
  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    navigate('/login');
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <MetaTags />

      {/* Structured Data for Search Engines */}
      <StructuredData type="Organization" />
      <StructuredData type="SoftwareApplication" />
      <StructuredData type="FAQPage" />

      <div className="min-h-screen bg-gradient-to-br from-[#FFFBF4] to-[#F5F0ED]">
        {/* SEO-optimized Header with Schema.org markup opportunity */}
        <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b-2 border-black z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <img
                  src="/assets/apply-logo.svg"
                  alt="Apply - AI-Powered Recruitment Platform"
                  className="h-10 w-auto"
                />
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-gray-700 hover:text-[#8B5CF6] font-medium transition-colors">
                  Features
                </a>
                <a href="#integrations" className="text-gray-700 hover:text-[#8B5CF6] font-medium transition-colors">
                  Integrations
                </a>
                <a href="#testimonials" className="text-gray-700 hover:text-[#8B5CF6] font-medium transition-colors">
                  Testimonials
                </a>
                <a
                  href="#pricing"
                  className="text-gray-700 hover:text-[#8B5CF6] font-medium transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Pricing
                </a>
                <Button
                  onClick={handleGetStarted}
                  className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Get Started
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section - Condensed for viewport */}
        <section className="container mx-auto px-4 pt-20 pb-8 min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-3xl mx-auto mb-8">
            {/* H1 - Smaller for viewport */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#8B6E5B] via-[#9B87F5] to-[#A18472] bg-clip-text text-transparent">
              AI-Powered SMB Hiring Platform
            </h1>

            {/* Condensed value proposition */}
            <p className="text-gray-600 text-base sm:text-lg mb-6 max-w-2xl mx-auto">
              Transform hiring with AI-driven sourcing and intelligent matching.
              Cut costs by 20-30% with our integrated recruitment platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button
                onClick={handleGetStarted}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 text-base font-semibold rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <Shield className="w-3 h-3 text-green-600" />
              <span>SOC 2 Compliant</span>
              <span className="mx-2">•</span>
              <span>No credit card required</span>
              <span className="mx-2">•</span>
              <span>5-minute setup</span>
            </div>
          </div>

          {/* Platform Preview - Smaller */}
          <div className="w-full max-w-5xl mx-auto">
            <PlatformCarousel />
          </div>
        </section>

        {/* Features Section - Condensed */}
        <section id="features" className="py-12 bg-white border-y-2 border-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Everything SMBs Need for Modern Hiring
              </h2>
              <p className="text-base text-gray-600 max-w-2xl mx-auto">
                AI-driven platform with all essential recruitment tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="text-[#8B5CF6] mb-2">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base mb-1">AI Sourcing</h3>
                <p className="text-gray-600 text-xs">Find the best local talent with advanced AI matching.</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="text-green-600 mb-2">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base mb-1">Video Interviews</h3>
                <p className="text-gray-600 text-xs">Structured evaluations with built-in conferencing.</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="text-blue-600 mb-2">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base mb-1">Web Analysis</h3>
                <p className="text-gray-600 text-xs">Automated insights from online presence.</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="text-orange-600 mb-2">
                  <Workflow className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base mb-1">ATS Integration</h3>
                <p className="text-gray-600 text-xs">Seamlessly enhance your existing systems.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations - Compact */}
        <section id="integrations" className="py-12 bg-gradient-to-br from-purple-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-purple-100 border-2 border-purple-300 rounded-full px-3 py-1 mb-4 text-xs">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span className="font-semibold text-purple-800">MCP-ENABLED PLATFORM</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                20+ Integrations
              </h2>
              <p className="text-base text-gray-600 max-w-xl mx-auto">
                Connect with Greenhouse, Lever, Workday, and more.
              </p>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {featuredIntegrations.slice(0, 6).map((integration, index) => (
                <div
                  key={index}
                  className="bg-white p-2 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  title={integration.name}
                >
                  <span className="text-xl">{integration.logo}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={() => navigate('/documentation')}
                className="bg-white hover:bg-gray-50 text-[#8B5CF6] px-4 py-2 text-sm font-semibold rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                View All
                <ChevronRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Section - Compact */}
        <section id="pricing" className="py-12 bg-gradient-to-b from-purple-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Simple, Transparent Pricing
              </h2>
              <p className="text-base text-gray-600">
                14-day free trial. No credit card required.
              </p>
            </div>

            {/* Pricing Cards - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative bg-white rounded-lg border-2 border-black p-4 ${tier.popular
                      ? 'shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] scale-105'
                      : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    } hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-purple-600 text-white px-3 py-0.5 rounded-full text-xs font-bold border border-black">
                        POPULAR
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-bold">{tier.price}</span>
                      {tier.period && (
                        <span className="text-sm text-gray-600">/{tier.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-1 mb-4 text-xs">
                    {tier.features.slice(0, 5).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => navigate(tier.name === 'Enterprise' ? '/contact' : '/login')}
                    className={`w-full py-2 text-sm font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all ${tier.popular
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-white hover:bg-gray-50 text-black'
                      }`}
                  >
                    {tier.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Testimonials Section - Removed for viewport fit */}

        {/* Final CTA Section - Compact */}
        <section className="py-12 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Ready to Transform Your Recruitment?
            </h2>
            <p className="text-base mb-6 max-w-xl mx-auto opacity-90">
              Join SMBs transforming their hiring with AI-driven recruitment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleGetStarted}
                className="bg-white hover:bg-gray-100 text-purple-600 px-6 py-3 text-base font-semibold rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <p className="mt-4 text-xs opacity-75">
              No credit card required • 14-day free trial
            </p>
          </div>
        </section>

        {/* Footer - Compact */}
        <footer className="bg-black text-white py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <img
                  src="/assets/apply-logo.svg"
                  alt="Apply"
                  className="h-6 w-auto brightness-0 invert"
                />
                <span className="text-xs text-gray-400">© 2025 Apply. All rights reserved.</span>
              </div>
              <div className="flex gap-4 text-xs">
                <a href="/privacy" className="text-gray-400 hover:text-white">Privacy</a>
                <a href="/terms" className="text-gray-400 hover:text-white">Terms</a>
                <a href="/contact" className="text-gray-400 hover:text-white">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPageEnhanced;
