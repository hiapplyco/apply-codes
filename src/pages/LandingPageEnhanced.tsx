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
  Quote
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PlatformCarousel } from "@/components/landing/PlatformCarousel";
import { MetaTags } from "@/components/landing/MetaTags";
import { StructuredData } from "@/components/landing/StructuredData";

// SEO-friendly testimonials data
const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Head of Talent Acquisition",
    company: "TechCorp",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    content: "Apply has transformed our recruitment process. We've reduced time-to-hire by 40% and found better quality candidates through AI-powered boolean searches.",
    rating: 5
  },
  {
    id: 2,
    name: "Marcus Williams",
    role: "Recruiting Manager",
    company: "FinanceHub",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    content: "The AI chat assistant is like having a senior recruiter on the team 24/7. It helps us qualify candidates faster and maintain consistent communication.",
    rating: 5
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "People Operations Director",
    company: "HealthTech Solutions",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    content: "Integrating with our ATS was seamless. Now we have all our recruitment data in one place with powerful AI insights that drive better hiring decisions.",
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

// Stats for social proof
const stats = [
  { value: "10,000+", label: "Recruiters Trust Apply" },
  { value: "2M+", label: "Candidates Sourced" },
  { value: "40%", label: "Faster Time-to-Hire" },
  { value: "95%", label: "Customer Satisfaction" }
];

const LandingPageEnhanced = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
              <button
                onClick={() => navigate('/pricing')}
                className="text-gray-700 hover:text-[#8B5CF6] font-medium transition-colors"
              >
                Pricing
              </button>
              <Button
                onClick={() => navigate('/login')}
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
            AI-Powered Recruitment Platform for Modern Hiring Teams
          </h1>
          
          {/* Strong value proposition */}
          <p className="text-gray-600 text-lg sm:text-xl mb-8 max-w-3xl mx-auto">
            Transform your recruiting with intelligent candidate sourcing, automated screening, and 20+ integrations. 
            Find better candidates 40% faster with Apply's AI-driven recruitment tools.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              onClick={() => navigate('/login')}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              onClick={() => navigate('/demo')}
              className="bg-white hover:bg-gray-50 text-[#8B5CF6] px-8 py-6 text-lg font-semibold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Watch Demo
              <Video className="ml-2 w-5 h-5" />
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

        {/* Social Proof Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-[#8B5CF6] mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section with H2 headings */}
      <section id="features" className="py-20 bg-white border-y-2 border-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Modern Recruitment
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From AI-powered sourcing to automated workflows, Apply provides all the tools you need to hire smarter and faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-[#8B5CF6] mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">AI-Powered Sourcing</h3>
              <p className="text-gray-600 text-sm">Generate complex boolean searches instantly and find hidden talent across multiple platforms.</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-green-600 mb-4">
                <FileScan className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Smart Screening</h3>
              <p className="text-gray-600 text-sm">AI analyzes resumes and qualifies candidates based on your specific requirements.</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-blue-600 mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">AI Chat Assistant</h3>
              <p className="text-gray-600 text-sm">24/7 AI copilot that helps with candidate evaluation and recruitment strategies.</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="text-orange-600 mb-4">
                <Workflow className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Automated Workflows</h3>
              <p className="text-gray-600 text-sm">Streamline your process with AI-powered workflows that adapt to your needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Showcase Section */}
      <section id="integrations" className="py-20 bg-gradient-to-br from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              20+ Integrations to Power Your Recruitment Stack
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Connect Apply with your existing tools for a seamless recruitment experience. From ATS to HRIS, we integrate with the platforms you already use.
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
              <h3 className="font-semibold mb-2">5-Minute Setup</h3>
              <p className="text-sm text-gray-600">Connect your tools quickly with our guided setup process</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Two-Way Sync</h3>
              <p className="text-sm text-gray-600">Keep data synchronized across all your platforms automatically</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">API Access</h3>
              <p className="text-sm text-gray-600">Build custom integrations with our comprehensive API</p>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={() => navigate('/integrations')}
              className="bg-white hover:bg-gray-50 text-[#8B5CF6] px-6 py-3 font-semibold rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              View All Integrations
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white border-y-2 border-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by 10,000+ Recruiters Worldwide
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how leading companies are transforming their recruitment with Apply
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
                <img 
                  src={testimonials[currentTestimonial].image}
                  alt={testimonials[currentTestimonial].name}
                  className="w-12 h-12 rounded-full border-2 border-black"
                />
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

          {/* Customer Logos */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500 mb-6">Trusted by teams at</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <span className="text-2xl font-bold text-gray-400">TechCorp</span>
              <span className="text-2xl font-bold text-gray-400">FinanceHub</span>
              <span className="text-2xl font-bold text-gray-400">HealthTech</span>
              <span className="text-2xl font-bold text-gray-400">StartupInc</span>
              <span className="text-2xl font-bold text-gray-400">GlobalCo</span>
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
            Join thousands of recruiters who are hiring smarter with Apply. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/login')}
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
            No credit card required • 14-day free trial • Cancel anytime
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
                AI-powered recruitment platform for modern hiring teams.
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