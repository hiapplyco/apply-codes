
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Search, FileScan, Video, Workflow, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { PlatformCarousel } from "@/components/landing/PlatformCarousel";

const LandingPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8B5CF6] rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black flex items-center justify-center">
                <span className="text-lg font-bold text-white">A</span>
              </div>
              <span className="text-xl font-bold">Apply</span>
            </div>
            <nav className="hidden sm:flex items-center gap-6">
              <button
                onClick={() => navigate('/pricing')}
                className="text-gray-700 hover:text-[#8B5CF6] font-medium transition-colors"
              >
                Pricing
              </button>
              <Button
                onClick={() => navigate('/login')}
                size="sm"
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Sign In
              </Button>
            </nav>
            <Button
              onClick={() => navigate('/login')}
              size="sm"
              className="sm:hidden bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-24 pb-8 sm:py-24 flex flex-col items-center justify-center min-h-screen">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-8 bg-[#8B5CF6] rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-[#8B6E5B] via-[#9B87F5] to-[#A18472] bg-clip-text text-transparent">
            Hi, welcome to Apply...
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Revolutionize your recruiting with AI-powered sourcing, screening, and candidate qualification
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-16 w-full sm:w-auto px-4 sm:px-0">
          <Button
            onClick={() => navigate('/login')}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-0.5 w-full sm:w-auto"
          >
            Get Started
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            className="bg-white hover:bg-gray-50 text-[#8B5CF6] px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-0.5 w-full sm:w-auto"
          >
            Sign In
          </Button>
        </div>

        {/* Platform Preview Carousel */}
        <div className="w-full mb-8 sm:mb-16">
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
