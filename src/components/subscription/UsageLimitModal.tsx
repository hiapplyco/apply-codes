import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown, Zap } from 'lucide-react';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews';
  currentUsage: number;
  limit: number;
}

const limitTypeLabels: Record<string, { title: string; description: string }> = {
  searches: {
    title: 'Search Limit Reached',
    description: 'You\'ve used all your monthly AI-powered searches.',
  },
  candidates_enriched: {
    title: 'Enrichment Limit Reached',
    description: 'You\'ve reached your monthly candidate enrichment limit.',
  },
  ai_calls: {
    title: 'AI Calls Limit Reached',
    description: 'You\'ve used all your monthly AI assistant calls.',
  },
  video_interviews: {
    title: 'Video Interview Limit Reached',
    description: 'You\'ve reached your monthly video interview limit.',
  },
};

export const UsageLimitModal = ({
  isOpen,
  onClose,
  limitType,
  currentUsage,
  limit,
}: UsageLimitModalProps) => {
  const navigate = useNavigate();
  const { title, description } = limitTypeLabels[limitType] || {
    title: 'Limit Reached',
    description: 'You\'ve reached your usage limit.',
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-black text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Usage display */}
          <div className="bg-gray-100 rounded-xl p-4 text-center mb-4">
            <p className="text-sm text-gray-600 mb-1">Current Usage</p>
            <p className="text-3xl font-black">
              {currentUsage} <span className="text-lg text-gray-500">/ {limit}</span>
            </p>
          </div>

          {/* Pro benefits */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Upgrade to Pro for Unlimited Access
            </h4>
            <ul className="space-y-1 text-sm text-purple-700">
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Unlimited searches
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Unlimited candidate enrichment
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Unlimited AI calls
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleUpgrade}
            className="w-full py-6 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Pro - $149/month
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-gray-500 hover:text-gray-700"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
