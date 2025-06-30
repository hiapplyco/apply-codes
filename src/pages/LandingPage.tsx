
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
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-8 bg-[#8B5CF6] rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black flex items-center justify-center">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#8B6E5B] via-[#9B87F5] to-[#A18472] bg-clip-text text-transparent">
            Hi, welcome to Apply...
          </h1>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Revolutionize your recruiting with AI-powered sourcing, screening, and candidate qualification
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 mb-16">
          <Button
            onClick={() => navigate('/login')}
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            className="bg-white hover:bg-gray-50 text-[#8B5CF6] px-8 py-6 text-lg font-semibold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-0.5"
          >
            Sign In
          </Button>
        </div>

        {/* Platform Preview Carousel */}
        <div className="w-full mb-16">
          <PlatformCarousel />
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl w-full">
          <div className="bg-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[#8B5CF6] mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">Smart Sourcing</h3>
            <p className="text-gray-600">AI-powered candidate search and LinkedIn post generation to attract top talent</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[#8B5CF6] mb-4">
              <FileScan className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">Intelligent Screening</h3>
            <p className="text-gray-600">Automated resume analysis and candidate qualification with AI assistance</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[#8B5CF6] mb-4">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">Video Interviews</h3>
            <p className="text-gray-600">Seamless video interviews with real-time AI analysis and insights</p>
          </div>

          <div className="bg-white p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[#8B5CF6] mb-4">
              <Workflow className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2">Agentic Workflows</h3>
            <p className="text-gray-600">Automate and streamline your recruiting process with AI-powered workflows that adapt to your needs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
