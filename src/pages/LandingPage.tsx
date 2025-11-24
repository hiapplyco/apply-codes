
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Search, FileScan, Video, Workflow, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useNewAuth } from "@/context/NewAuthContext";
import { PlatformCarousel } from "@/components/landing/PlatformCarousel";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useNewAuth();

  useEffect(() => {
    // Redirect to dashboard if user is already authenticated
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF4] to-[#F5F0ED]">
      {/* Header Navigation */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b-2 border-black z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="/assets/apply-logo.svg"
                alt="Apply"
                className="h-10 w-auto"
              />
            </div>
            <nav className="flex items-center gap-6">
              <button
                onClick={() => navigate('/pricing')}
                className="text-gray-700 hover:text-[#8B5CF6] font-medium transition-colors"
              >
                Pricing
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-20 pb-4 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <div className="text-center mb-4 sm:mb-6">
          <img
            src="/assets/apply-logo.svg"
            alt="Apply"
            className="h-24 sm:h-32 w-auto mx-auto mb-2 sm:mb-4"
          />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-[#8B6E5B] via-[#9B87F5] to-[#A18472] bg-clip-text text-transparent">
            Hi, welcome to Apply...
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-4 sm:mb-6 max-w-2xl mx-auto px-4">
            Revolutionize your recruiting with AI-powered sourcing, screening, and candidate qualification
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mb-6 sm:mb-8 w-full sm:w-auto px-4 sm:px-0">
          <Button
            onClick={() => navigate('/login')}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-0.5 w-full sm:w-auto"
          >
            Get Started
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Platform Preview Carousel */}
        <div className="w-full mb-6 sm:mb-10">
          <PlatformCarousel />
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-6xl w-full">
          <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[#8B5CF6] mb-3 sm:mb-4">
              <Search className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="font-bold text-base sm:text-lg mb-2">Smart Sourcing</h3>
            <p className="text-gray-600 text-sm sm:text-base">AI-powered candidate search and LinkedIn post generation to attract top talent</p>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[#8B5CF6] mb-3 sm:mb-4">
              <FileScan className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="font-bold text-base sm:text-lg mb-2">Intelligent Screening</h3>
            <p className="text-gray-600 text-sm sm:text-base">Automated resume analysis and candidate qualification with AI assistance</p>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[#8B5CF6] mb-3 sm:mb-4">
              <Video className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="font-bold text-base sm:text-lg mb-2">Video Interviews</h3>
            <p className="text-gray-600 text-sm sm:text-base">Seamless video interviews with real-time AI analysis and insights</p>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[#8B5CF6] mb-3 sm:mb-4">
              <Workflow className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="font-bold text-base sm:text-lg mb-2">Agentic Workflows</h3>
            <p className="text-gray-600 text-sm sm:text-base">Automate and streamline your recruiting process with AI-powered workflows that adapt to your needs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
