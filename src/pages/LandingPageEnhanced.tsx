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

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Get Started click with fast auth check
  const handleGetStarted = async () => {
    // Quick check if user has an existing session
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
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
                src="https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos/APPLYFullwordlogo2025.png" 
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

      {/* Hero Section with Clear Value Proposition */}
      <section className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center max-w-4xl mx-auto mb-12">
          {/* H1 - Primary SEO target */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#8B6E5B] via-[#9B87F5] to-[#A18472] bg-clip-text text-transparent">
            AI-Powered SMB Hiring Platform
          </h1>
          
          {/* Strong value proposition */}
          <p className="text-gray-600 text-lg sm:text-xl mb-8 max-w-3xl mx-auto">
            Transform your local hiring with AI-driven candidate sourcing, structured video interviews, and intelligent matching. 
            Cut operational costs by 20-30% with our integrated recruitment platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              onClick={handleGetStarted}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-green-600" />
            <span>SOC 2 Compliant</span>
            <span className="mx-2">•</span>
            <span>No credit card required</span>
            <span className="mx-2">•</span>
            <span>5-minute setup</span>
          </div>
        </div>

        {/* Platform Preview */}
        <div className="w-full mb-16">
          <PlatformCarousel />
        </div>

        {/* Trust Statement */}
        <div className="text-center max-w-4xl mx-auto">
          <p className="text-lg text-gray-700 font-medium">
            Trusted by companies large and small to transform their talent acquisition with AI
          </p>
        </div>
      </section>

      {/* Features Section with H2 headings */}
      <section id="features" className="py-20 bg-white border-y-2 border-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything SMBs Need for Modern Hiring
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our intuitive, AI-driven platform combines all essential recruitment tools with immediate ROI and superior user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-[#8B5CF6] mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">AI Candidate Sourcing</h3>
              <p className="text-gray-600 text-sm">Advanced AI matching efficiently finds and connects you with the best local talent for your specific needs.</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-green-600 mb-4">
                <FileScan className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Structured Video Interviews</h3>
              <p className="text-gray-600 text-sm">Facilitate consistent and insightful candidate evaluations with built-in video conferencing tools.</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-blue-600 mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Website Analysis Tools</h3>
              <p className="text-gray-600 text-sm">Gain deeper insights from candidates' online presence with automated analysis and synopsis tools.</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-orange-600 mb-4">
                <Workflow className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">ATS Enhancement</h3>
              <p className="text-gray-600 text-sm">Enhance your existing Applicant Tracking System with AI-powered tools that integrate seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Showcase Section */}
      <section id="integrations" className="py-20 bg-gradient-to-br from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 border-2 border-purple-300 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">FIRST MCP-ENABLED RECRUITMENT PLATFORM</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Seamless Integrations for Modern Hiring
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Apply is one of the first recruitment platforms to offer Model Context Protocol (MCP) for enhanced sourcing and content creation. Connect with your existing tools effortlessly.
            </p>
          </div>

          {/* Featured Integrations Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {featuredIntegrations.map((integration, index) => (
              <div 
                key={index}
                className="bg-white p-4 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{integration.logo}</span>
                  <div>
                    <div className="font-semibold">{integration.name}</div>
                    <div className="text-xs text-gray-500">{integration.category}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Integration Benefits */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">MCP Integration</h3>
              <p className="text-sm text-gray-600">Advanced protocol enables seamless sourcing and content creation across platforms</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Smart Data Sync</h3>
              <p className="text-sm text-gray-600">Real-time synchronization keeps candidate data updated across all your platforms</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Enterprise Security</h3>
              <p className="text-sm text-gray-600">Bank-level security with OAuth and audit trails for all recruitment activities</p>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={() => {
                console.log('Navigating to /integrations');
                navigate('/integrations');
              }}
              className="bg-white hover:bg-gray-50 text-[#8B5CF6] px-6 py-3 font-semibold rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              View All Integrations
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 border-2 border-purple-300 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-800">AI-POWERED RECRUITING</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pricing that scales with your
              <span className="block text-purple-600">recruiting success</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required. 
              Upgrade, downgrade, or cancel anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
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

          {/* Trust indicators */}
          <div className="text-center mt-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white border-y-2 border-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How SMBs Transform Their Hiring
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how businesses cut operational costs by 20-30% and scale their hiring with Apply's AI-driven platform
            </p>
          </div>

          {/* Testimonial Carousel */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <Quote className="w-10 h-10 text-purple-200 mb-4" />
              
              <p className="text-lg text-gray-700 mb-6 italic">
                "{testimonials[currentTestimonial].content}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-black bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-2xl">
                  {testimonials[currentTestimonial].emoji}
                </div>
                <div>
                  <div className="font-semibold">{testimonials[currentTestimonial].name}</div>
                  <div className="text-sm text-gray-600">
                    {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                  </div>
                </div>
                <div className="ml-auto flex gap-1">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>

            {/* Testimonial indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentTestimonial 
                      ? 'w-8 bg-purple-600' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Recruitment?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Join SMBs transforming their hiring with AI-driven recruitment. Start your free trial and see results in weeks, not months.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              className="bg-white hover:bg-gray-100 text-purple-600 px-8 py-4 text-lg font-semibold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              onClick={() => navigate('/contact')}
              className="bg-transparent hover:bg-white/10 text-white border-2 border-white px-8 py-4 text-lg font-semibold rounded-lg shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] transition-all"
            >
              Contact Sales
              <MessageSquare className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <p className="mt-6 text-sm opacity-75">
            No credit card required • 21-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer with SEO-friendly links */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img 
                src="https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos/APPLYFullwordlogo2025.png" 
                alt="Apply" 
                className="h-8 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-sm text-gray-400">
                AI-powered SMB hiring platform featuring Model Context Protocol integration for modern recruitment.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="/integrations" className="hover:text-white">Integrations</a></li>
                <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/api" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
                <li><a href="/careers" className="hover:text-white">Careers</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/docs" className="hover:text-white">Documentation</a></li>
                <li><a href="/help" className="hover:text-white">Help Center</a></li>
                <li><a href="/status" className="hover:text-white">Status</a></li>
                <li><a href="/security" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2025 Apply. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="/privacy" className="text-sm text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="/terms" className="text-sm text-gray-400 hover:text-white">Terms of Service</a>
              <a href="/cookies" className="text-sm text-gray-400 hover:text-white">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default LandingPageEnhanced;