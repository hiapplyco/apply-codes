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
    content: "Apply's agentic AI orchestration completely transformed our hiring scale. Our autonomous agents coordinate across 5 different HR systems via MCP, managing end-to-end workflows. We scaled from 10 to 50 engineers in 6 months with minimal manual intervention.",
    rating: 5
  },
  {
    id: 2,
    name: "Marcus Williams",
    role: "VP of People Operations",
    company: "Fortune 500 Tech Company",
    emoji: "👨🏾‍💼",
    content: "I was skeptical about autonomous recruitment until Apply's MCP integration. The agents continuously analyze candidate patterns across our entire tech stack, identifying bias and optimizing for diversity. It's like having a team of data scientists working 24/7.",
    rating: 5
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Head of Talent Strategy",
    company: "High-Growth Fintech",
    emoji: "👩🏽‍💼",
    content: "Apply's contextual AI agents solved our niche talent challenge. The MCP-enabled context injection means agents understand that 'Rust developers with blockchain contributions' require different sourcing strategies than generic searches. Multi-step reasoning filled 3 impossible roles in 2 weeks.",
    rating: 5
  },
  {
    id: 4,
    name: "James Park",
    role: "People Operations Manager",
    company: "Healthcare Tech Startup",
    emoji: "👨🏻‍💼",
    content: "As a lean startup, Apply's agentic orchestration gave us enterprise-level capabilities. The autonomous agents handle job description optimization, multi-platform sourcing, and interview coordination—all coordinated through secure MCP protocols. It's like having a senior recruiting team available 24/7.",
    rating: 5
  },
  {
    id: 5,
    name: "Aisha Patel",
    role: "Chief People Officer",
    company: "Global Consulting Firm",
    emoji: "👩🏾‍💼",
    content: "Apply's MCP protocol integration was a game-changer for our ATS ecosystem. The agents coordinate real-time data across platforms, identifying patterns like 'best performers from non-traditional backgrounds' and autonomously adjusting sourcing strategies. True agentic decision-making at scale.",
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
    name: 'Starter',
    price: '$99',
    period: 'month',
    description: 'Perfect for individual recruiters and small teams',
    features: [
      { text: '100 AI searches per month', included: true },
      { text: 'Basic boolean search generation', included: true },
      { text: 'LinkedIn & Indeed integration', included: true },
      { text: 'Save up to 500 candidates', included: true },
      { text: 'Basic contact enrichment (50 credits)', included: true },
      { text: '5 projects', included: true },
      { text: 'Email support', included: true },
      { text: 'Search history & analytics', included: true },
      { text: 'Agentic recruitment copilot', included: false },
      { text: 'MCP protocol integrations', included: false },
      { text: 'Team collaboration', included: false },
      { text: 'Interview tools & transcription', included: false },
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
      { text: 'Unlimited AI searches', included: true },
      { text: 'Advanced boolean optimization', included: true },
      { text: 'MCP-enabled integrations (10+ ATS/HRIS)', included: true },
      { text: 'Unlimited candidate storage', included: true },
      { text: 'Full contact enrichment (500 credits)', included: true },
      { text: 'Autonomous agent orchestration', included: true },
      { text: 'Unlimited projects & collaboration', included: true },
      { text: 'Interview tools & transcription', included: true },
      { text: 'Advanced analytics & reporting', included: true },
      { text: 'Priority support', included: true },
      { text: 'Team features (up to 10 users)', included: true },
      { text: 'Multi-agent workflow coordination', included: false },
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
      { text: 'Everything in Professional', included: true },
      { text: 'Custom agentic workflow development', included: true },
      { text: 'Unlimited contact enrichment', included: true },
      { text: 'API access with custom rate limits', included: true },
      { text: 'SSO & advanced security', included: true },
      { text: 'Custom integrations & development', included: true },
      { text: 'Dedicated success manager', included: true },
      { text: 'SLA guarantees & uptime', included: true },
      { text: 'Training & onboarding', included: true },
      { text: 'White-label options', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'On-premise deployment options', included: true },
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
            Agentic AI Recruitment Platform with Model Context Protocol
          </h1>
          
          {/* Strong value proposition */}
          <p className="text-gray-600 text-lg sm:text-xl mb-8 max-w-3xl mx-auto">
            Autonomous AI agents orchestrate multi-step recruitment workflows through MCP-enabled integrations. 
            Deploy goal-directed agents that source, screen, and manage hiring end-to-end with human oversight.
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
              Agentic AI Orchestration for Autonomous Hiring
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              MCP-powered agents coordinate seamlessly across your entire recruitment stack, executing complex workflows with contextual intelligence and real-time adaptability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-[#8B5CF6] mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Autonomous Agent Sourcing</h3>
              <p className="text-gray-600 text-sm">Self-directed agents execute multi-step candidate discovery workflows, reasoning through complex requirements to surface hidden talent.</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-green-600 mb-4">
                <FileScan className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Contextual Candidate Evaluation</h3>
              <p className="text-gray-600 text-sm">MCP-enabled agents inject dynamic context from ATS/HRIS systems to perform nuanced candidate qualification and ranking.</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-blue-600 mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Agentic Recruitment Copilot</h3>
              <p className="text-gray-600 text-sm">Goal-directed AI agents provide strategic guidance, adapting recommendations based on real-time hiring data and context.</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-orange-600 mb-4">
                <Workflow className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">MCP Orchestration Engine</h3>
              <p className="text-gray-600 text-sm">Universal connector protocol enables autonomous agents to coordinate across any HR platform with secure, governance-ready integration.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Showcase Section */}
      <section id="integrations" className="py-20 bg-gradient-to-br from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              MCP Protocol: Universal AI Integration Standard
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Model Context Protocol eliminates brittle API bridges, enabling agentic AI to natively coordinate across any ATS, HRIS, or HR platform with real-time context injection and secure tool invocation.
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
              <h3 className="font-semibold mb-2">MCP Client/Server Model</h3>
              <p className="text-sm text-gray-600">Agents act as MCP clients, HR systems as servers - standardized protocol enables instant connectivity</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Contextual Data Injection</h3>
              <p className="text-sm text-gray-600">Real-time context window management pulls candidate data, feedback loops, and recruiting intelligence</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Function Invocation Security</h3>
              <p className="text-sm text-gray-600">ETDI, OAuth, and audit agents secure tool access while maintaining agentic workflow capabilities</p>
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

      {/* MCP Technical Advantages Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white border-y-2 border-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 border-2 border-blue-300 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">MODEL CONTEXT PROTOCOL</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enterprise-Grade Agentic AI Infrastructure
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Built on Anthropic's Model Context Protocol standard, Apply delivers secure, governance-ready autonomous recruitment with audit trails and policy-based access control.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-blue-600 mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-3">Security & Governance</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• ETDI and OAuth protocol hardening</li>
                <li>• MCPSafetyScanner audit agents</li>
                <li>• Policy-based tool access control</li>
                <li>• Prompt injection protection</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-purple-600 mb-4">
                <Workflow className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-3">Multi-Agent Coordination</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• A2A, ACP, ANP ecosystem support</li>
                <li>• Autonomous workflow orchestration</li>
                <li>• Goal-directed task delegation</li>
                <li>• Real-time context synchronization</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-green-600 mb-4">
                <Database className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-3">Universal Connectivity</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• JSON-RPC based standard protocol</li>
                <li>• Infrastructure-agnostic integration</li>
                <li>• Dynamic function invocation</li>
                <li>• Context window management</li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6 max-w-4xl mx-auto">
              <h3 className="font-bold text-lg mb-3">Enterprise Deployment Ready</h3>
              <p className="text-gray-600 mb-4">
                MCP's open standard ensures Apply integrates seamlessly with existing enterprise infrastructure while maintaining security compliance and audit requirements.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
                <span className="bg-white px-3 py-1 rounded border border-gray-300">SOC 2 Type II</span>
                <span className="bg-white px-3 py-1 rounded border border-gray-300">GDPR Compliant</span>
                <span className="bg-white px-3 py-1 rounded border border-gray-300">ISO 27001</span>
                <span className="bg-white px-3 py-1 rounded border border-gray-300">HIPAA Ready</span>
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
              How Leaders Deploy Agentic AI for Autonomous Hiring
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how recruitment teams use MCP-orchestrated agents to scale hiring operations with minimal human intervention
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
            Deploy autonomous AI agents that revolutionize hiring through MCP orchestration. Experience the future of recruitment today.
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
                Agentic AI recruitment platform powered by Model Context Protocol for autonomous hiring workflows.
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