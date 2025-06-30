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
          <h3 className="text-sm sm:text-xl font-bold truncate">Welcome back, Sarah!</h3>
        </div>
        <div className="hidden sm:flex gap-2">
          <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">New Search</button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">Settings</button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-6">
        <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-2 sm:p-4 border border-purple-200">
          <div className="text-[10px] sm:text-xs text-purple-600 mb-1">Active Searches</div>
          <div className="text-sm sm:text-2xl font-bold text-purple-800">12</div>
        </div>
        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-2 sm:p-4 border border-green-200">
          <div className="text-[10px] sm:text-xs text-green-600 mb-1">Candidates</div>
          <div className="text-sm sm:text-2xl font-bold text-green-800">247</div>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-2 sm:p-4 border border-blue-200">
          <div className="text-[10px] sm:text-xs text-blue-600 mb-1">Response Rate</div>
          <div className="text-sm sm:text-2xl font-bold text-blue-800">73%</div>
        </div>
        <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg p-2 sm:p-4 border border-amber-200">
          <div className="text-[10px] sm:text-xs text-amber-600 mb-1">Time to Fill</div>
          <div className="text-sm sm:text-2xl font-bold text-amber-800">4.2d</div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-gray-50 rounded-lg p-2 sm:p-4 border border-gray-200">
        <h4 className="text-xs sm:text-base font-semibold mb-2 sm:mb-3">Recent Activity</h4>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex-shrink-0" />
            <span className="text-[10px] sm:text-sm text-gray-700">15 new React developers matched</span>
            <span className="text-[9px] sm:text-xs text-gray-400 ml-auto">2m ago</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full flex-shrink-0" />
            <span className="text-[10px] sm:text-sm text-gray-700">John Doe accepted interview</span>
            <span className="text-[9px] sm:text-xs text-gray-400 ml-auto">15m ago</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0" />
            <span className="text-[10px] sm:text-sm text-gray-700">AI found 8 senior engineers</span>
            <span className="text-[9px] sm:text-xs text-gray-400 ml-auto">1h ago</span>
          </div>
        </div>
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
        <div className="bg-purple-100 rounded-lg p-2 sm:p-4 border sm:border-2 border-purple-300">
          <textarea 
            className="w-full bg-transparent text-[10px] sm:text-sm text-purple-900 placeholder-purple-400 resize-none"
            placeholder="Find me senior React developers in San Francisco with TypeScript experience and startup background..."
            rows={2}
            disabled
          />
        </div>
      </div>
      
      {/* Generated Boolean */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 sm:p-4 border sm:border-2 border-purple-200 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-600 rounded-full animate-pulse" />
          <span className="text-xs sm:text-sm text-purple-600 font-semibold">AI Generated Boolean:</span>
        </div>
        <code className="text-[9px] sm:text-xs text-gray-700 font-mono block break-all">
          ("Senior React Developer" OR "Sr React Engineer" OR "Lead React Developer") AND ("San Francisco" OR "SF Bay Area" OR "Silicon Valley") AND (TypeScript OR "Type Script") AND (startup OR "start-up" OR scale-up)
        </code>
      </div>
      
      {/* Platform Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button className="bg-blue-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded text-[10px] sm:text-sm font-medium">LinkedIn</button>
        <button className="bg-indigo-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded text-[10px] sm:text-sm font-medium">Indeed</button>
        <button className="bg-gray-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded text-[10px] sm:text-sm font-medium">More</button>
      </div>
      
      {/* Search Results Preview */}
      <div className="space-y-2">
        <div className="bg-green-50 rounded p-2 sm:p-3 border border-green-200">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-300 rounded-full flex-shrink-0 flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-bold text-green-800">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] sm:text-sm font-semibold text-gray-800">Jane Doe</div>
              <div className="text-[10px] sm:text-xs text-gray-600">Senior React Engineer at TechCo • SF</div>
              <div className="flex gap-2 mt-1">
                <span className="text-[9px] sm:text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">TypeScript</span>
                <span className="text-[9px] sm:text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">5 yrs exp</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ChatPreview = () => (
  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-amber-50 p-2 sm:p-8">
    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg h-full flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="p-2 sm:p-4 border-b border-gray-200 flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xs">AI</span>
        </div>
        <div>
          <h3 className="text-sm sm:text-lg font-bold">Apply AI Assistant</h3>
          <p className="text-[10px] sm:text-xs text-green-600">● Online</p>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 p-2 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-purple-600 text-white rounded-lg p-2 sm:p-3 max-w-[80%] sm:max-w-xs">
            <p className="text-[11px] sm:text-sm">How can I improve my React developer searches?</p>
          </div>
        </div>
        
        {/* AI Response */}
        <div className="flex justify-start gap-2">
          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">AI</span>
          </div>
          <div className="bg-gray-100 rounded-lg p-2 sm:p-3 max-w-[80%] sm:max-w-sm">
            <p className="text-[11px] sm:text-sm text-gray-700 mb-2">I analyzed your recent searches. Here are 3 tips to expand your talent pool:</p>
            <ul className="space-y-1 text-[10px] sm:text-xs text-gray-600">
              <li className="flex gap-1">• Include "Frontend Engineer" and "UI Developer"</li>
              <li className="flex gap-1">• Add remote locations for 40% more candidates</li>
              <li className="flex gap-1">• Try skill-based searches vs. title-based</li>
            </ul>
          </div>
        </div>
        
        {/* User Follow-up */}
        <div className="flex justify-end">
          <div className="bg-purple-600 text-white rounded-lg p-2 sm:p-3 max-w-[80%] sm:max-w-xs">
            <p className="text-[11px] sm:text-sm">Can you create a boolean search with these tips?</p>
          </div>
        </div>
        
        {/* AI Creating Response */}
        <div className="flex justify-start gap-2">
          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">AI</span>
          </div>
          <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
            <p className="text-[11px] sm:text-sm text-gray-700 flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
              Creating optimized boolean search...
            </p>
          </div>
        </div>
      </div>
      
      {/* Input Area */}
      <div className="p-2 sm:p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-[11px] sm:text-sm placeholder-gray-400"
            placeholder="Ask me anything about recruiting..."
            disabled
          />
          <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium">
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
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex-shrink-0 flex items-center justify-center">
          <span className="text-white font-bold text-lg sm:text-2xl">SK</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-lg font-bold text-gray-800">Sarah Kim</h3>
          <p className="text-[10px] sm:text-sm text-gray-600">Senior Talent Acquisition • TechCorp</p>
          <div className="flex gap-2 mt-1">
            <span className="text-[9px] sm:text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Pro Plan</span>
            <span className="text-[9px] sm:text-xs text-gray-500">Member since 2023</span>
          </div>
        </div>
      </div>
      
      {/* Analytics Chart */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 sm:p-4 border border-purple-200 mb-3 sm:mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs sm:text-base font-semibold">Weekly Search Activity</h4>
          <span className="text-[10px] sm:text-xs text-green-600 font-medium">↑ 23%</span>
        </div>
        <div className="flex items-end gap-1 sm:gap-2 h-16 sm:h-24">
          {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
            <div key={i} className="flex-1 relative group">
              <div
                className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all hover:from-purple-700 hover:to-purple-500"
                style={{ height: `${height}%` }}
              />
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-gray-800 text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {height}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[9px] sm:text-[10px] text-gray-500">Mon</span>
          <span className="text-[9px] sm:text-[10px] text-gray-500">Sun</span>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 sm:p-3 border border-green-200">
          <div className="text-[10px] sm:text-xs text-green-700">Total Searches</div>
          <div className="text-lg sm:text-2xl font-bold text-green-800">1,847</div>
          <div className="text-[9px] sm:text-[10px] text-green-600">+156 this month</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-2 sm:p-3 border border-blue-200">
          <div className="text-[10px] sm:text-xs text-blue-700">Candidates Found</div>
          <div className="text-lg sm:text-2xl font-bold text-blue-800">12.3k</div>
          <div className="text-[9px] sm:text-[10px] text-blue-600">89% match rate</div>
        </div>
      </div>
    </div>
  </div>
);