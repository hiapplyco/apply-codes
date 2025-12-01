import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface BooleanGenerationAnimationProps {
  isOpen: boolean;
  onComplete?: () => void;
  estimatedTimeMs?: number;
}

// Quirky tips and tricks about recruiting and the platform
const TIPS = [
  "💡 Tip: Use quotes for exact phrases like \"project manager\"",
  "🎯 Pro move: Combine titles with OR to cast a wider net",
  "⚡ Speed hack: Save your best searches to your project",
  "🔍 Did you know? LinkedIn X-ray searches find hidden profiles",
  "💼 Recruiter tip: Location + title combos reduce noise by 60%",
  "🚀 Power user: Use the Analyze feature to enrich profiles instantly",
  "📊 Fun fact: Boolean searches outperform basic searches 3x",
  "🎪 Trick: Add company names to find alumni in new roles",
  "💡 Insider tip: Exclude recruiters with -recruiter -staffing",
  "🌟 Best practice: Start broad, then narrow with filters",
  "⏱️ Time saver: Upload job descriptions to auto-generate searches",
  "🎯 Precision tip: Use parentheses to group related terms",
];

const TOTAL_DURATION = 120000; // 2 minutes in ms

export const BooleanGenerationAnimation: React.FC<BooleanGenerationAnimationProps> = ({
  isOpen,
  onComplete,
  estimatedTimeMs = TOTAL_DURATION
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentTipIndex(0);
      return;
    }

    // Rotate tips every 4 seconds
    const tipTimer = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % TIPS.length);
    }, 4000);

    return () => {
      clearInterval(tipTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Creating Your Boolean Search
        </h2>

        {/* Rotating Tip */}
        <p className="text-sm text-gray-600 min-h-[48px] transition-opacity duration-300">
          {TIPS[currentTipIndex]}
        </p>
      </div>
    </div>
  );
};