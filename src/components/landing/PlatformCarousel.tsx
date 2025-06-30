import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformPreview {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

const platformPreviews: PlatformPreview[] = [
  {
    id: "dashboard",
    title: "AI-Powered Dashboard",
    description: "Your command center for intelligent talent sourcing",
    imageUrl: "/screenshots/dashboard-preview.png"
  },
  {
    id: "search",
    title: "Boolean Search Generator",
    description: "Transform job requirements into powerful search strings",
    imageUrl: "/screenshots/search-preview.png"
  },
  {
    id: "chat",
    title: "AI Recruitment Assistant",
    description: "Get insights and recommendations from your AI copilot",
    imageUrl: "/screenshots/chat-preview.png"
  },
  {
    id: "profile",
    title: "Analytics & Insights",
    description: "Track your sourcing performance and patterns",
    imageUrl: "/screenshots/profile-preview.png"
  }
];

export function PlatformCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % platformPreviews.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => 
      prev === 0 ? platformPreviews.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % platformPreviews.length);
  };

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
      <div className="relative bg-white rounded-lg border-2 sm:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Carousel Container */}
        <div className="relative aspect-[16/10] sm:aspect-[16/10] bg-gray-50">
          {/* Images */}
          <div className="relative w-full h-full">
            {platformPreviews.map((preview, index) => (
              <div
                key={preview.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-500",
                  index === currentIndex ? "opacity-100" : "opacity-0"
                )}
              >
                {/* Mock Screenshots */}
                {preview.id === "dashboard" && <DashboardPreview />}
                {preview.id === "search" && <SearchPreview />}
                {preview.id === "chat" && <ChatPreview />}
                {preview.id === "profile" && <ProfilePreview />}
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {platformPreviews.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "w-8 bg-purple-600"
                  : "bg-gray-400 hover:bg-gray-600"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Carousel Title */}
      <div className="mt-4 sm:mt-6 text-center px-4">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">See Apply in Action</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Explore our AI-powered recruitment platform designed to revolutionize talent sourcing
        </p>
      </div>
    </div>
  );
}

// Mock Preview Components
const DashboardPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-amber-50 p-2 sm:p-8">
    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg h-full p-3 sm:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs sm:text-base">A</span>
          </div>
          <h3 className="text-sm sm:text-xl font-bold truncate">Apply Dashboard</h3>
        </div>
        <div className="hidden sm:flex gap-2">
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-2 sm:p-4 border border-gray-200">
            <div className="w-full h-3 sm:h-4 bg-gray-300 rounded mb-1 sm:mb-2 animate-pulse" />
            <div className="text-sm sm:text-2xl font-bold text-purple-600">{i * 23}</div>
          </div>
        ))}
      </div>
      
      {/* Recent Activity */}
      <div className="bg-gray-50 rounded-lg p-2 sm:p-4 border border-gray-200">
        <h4 className="text-xs sm:text-base font-semibold mb-2 sm:mb-3">Recent Searches</h4>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-600 rounded-full flex-shrink-0" />
            <div className="w-full h-2 sm:h-3 bg-gray-300 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SearchPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-amber-50 p-2 sm:p-8">
    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg h-full p-3 sm:p-6 overflow-hidden">
      {/* Search Header */}
      <div className="mb-3 sm:mb-6">
        <h3 className="text-sm sm:text-2xl font-bold mb-2 sm:mb-4">AI-Powered Boolean Search</h3>
        <div className="bg-gray-50 rounded-lg p-2 sm:p-4 border sm:border-2 border-gray-200">
          <div className="w-full h-2 sm:h-3 bg-gray-300 rounded mb-1 sm:mb-2 animate-pulse" />
          <div className="w-3/4 h-2 sm:h-3 bg-gray-300 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Generated Boolean */}
      <div className="bg-purple-50 rounded-lg p-2 sm:p-4 border sm:border-2 border-purple-200 mb-3 sm:mb-4">
        <div className="text-xs sm:text-sm text-purple-600 font-semibold mb-1 sm:mb-2">Generated Boolean String:</div>
        <code className="text-[10px] sm:text-xs text-gray-700 font-mono block truncate">
          ("Senior Software Engineer" OR "Sr. Software Developer") AND (React OR Vue) AND...
        </code>
      </div>
      
      {/* Search Results */}
      <div className="space-y-2 sm:space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-50 rounded p-2 sm:p-3 border border-gray-200">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-200 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="w-24 sm:w-32 h-3 sm:h-4 bg-gray-300 rounded mb-1 animate-pulse" />
                <div className="w-32 sm:w-48 h-2 sm:h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ChatPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-amber-50 p-2 sm:p-8">
    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg h-full flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="p-2 sm:p-4 border-b border-gray-200">
        <h3 className="text-sm sm:text-xl font-bold">AI Recruitment Assistant</h3>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 p-2 sm:p-4 space-y-2 sm:space-y-4 overflow-y-auto">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-purple-600 text-white rounded-lg p-2 sm:p-3 max-w-[80%] sm:max-w-xs">
            <p className="text-xs sm:text-sm">What are the best boolean searches for React developers?</p>
          </div>
        </div>
        
        {/* AI Response */}
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-lg p-2 sm:p-3 max-w-[80%] sm:max-w-xs">
            <p className="text-xs sm:text-sm text-gray-700">Here are some effective boolean searches for React developers...</p>
            <div className="mt-1 sm:mt-2 space-y-1">
              <div className="w-full h-1.5 sm:h-2 bg-gray-300 rounded animate-pulse" />
              <div className="w-4/5 h-1.5 sm:h-2 bg-gray-300 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Input Area */}
      <div className="p-2 sm:p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-100 rounded-lg p-2 sm:p-3">
            <div className="w-24 sm:w-32 h-2 sm:h-3 bg-gray-300 rounded animate-pulse" />
          </div>
          <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-base">
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
);

const ProfilePreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-amber-50 p-2 sm:p-8">
    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg h-full p-3 sm:p-6 overflow-hidden">
      {/* Profile Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-6">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-200 rounded-full flex-shrink-0" />
        <div className="min-w-0">
          <div className="w-24 sm:w-32 h-4 sm:h-5 bg-gray-300 rounded mb-1 sm:mb-2 animate-pulse" />
          <div className="w-32 sm:w-48 h-2 sm:h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Analytics Chart */}
      <div className="bg-gray-50 rounded-lg p-2 sm:p-4 border border-gray-200 mb-3 sm:mb-4">
        <h4 className="text-xs sm:text-base font-semibold mb-2 sm:mb-3">Search Activity</h4>
        <div className="flex items-end gap-1 sm:gap-2 h-20 sm:h-32">
          {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-purple-600 rounded-t"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {['Total Searches', 'Candidates Found', 'Projects', 'Success Rate'].map((label, i) => (
          <div key={i} className="bg-gray-50 rounded p-2 sm:p-3 border border-gray-200">
            <div className="text-[10px] sm:text-sm text-gray-600 truncate">{label}</div>
            <div className="text-sm sm:text-xl font-bold text-purple-600">{(i + 1) * 42}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);