import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useNewAuth } from '@/context/NewAuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Zap, AlertTriangle, Crown, Lock } from 'lucide-react';

export const TrialExpirationModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useNewAuth();
  const { subscription, loading, isExpired } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);

  // Check if trial is truly expired (not just ending soon)
  const trialFullyExpired = isExpired();

  useEffect(() => {
    if (!user || loading) return;

    // Don't show on pricing page - let them browse pricing
    if (location.pathname === '/pricing') return;

    // Check if trial is expired
    if (trialFullyExpired) {
      setIsOpen(true);
    }
  }, [user, subscription, loading, trialFullyExpired, location.pathname]);

  const handleUpgrade = () => {
    setIsOpen(false);
    navigate('/pricing');
  };

  // Only allow dismissal if trial is NOT fully expired (just a warning)
  const handleDismiss = () => {
    // Can only dismiss if trial hasn't fully expired yet
    if (!trialFullyExpired) {
      setIsOpen(false);
    }
  };

  // Handle dialog open change - prevent closing if expired
  const handleOpenChange = (open: boolean) => {
    // If trying to close and trial is expired, don't allow
    if (!open && trialFullyExpired) {
      return; // Block closing
    }
    setIsOpen(open);
  };

  // Don't show if already pro/enterprise
  if (subscription?.tier === 'pro' || subscription?.tier === 'enterprise') {
    return null;
  }

  // Don't show if subscription status is active
  if (subscription?.status === 'active') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        hideCloseButton={trialFullyExpired}
        onPointerDownOutside={(e) => trialFullyExpired && e.preventDefault()}
        onEscapeKeyDown={(e) => trialFullyExpired && e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-black text-center">
            Your Free Trial Has Ended
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Upgrade to Pro to continue using all features without interruption.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits reminder */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Unlock Pro Features
            </h4>
            <ul className="space-y-2 text-sm text-purple-700">
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Unlimited AI-powered searches
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Unlimited candidate enrichment
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Advanced analytics & reports
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Up to 25 active projects
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Team collaboration (5 members)
              </li>
            </ul>
          </div>

          {/* Pricing preview */}
          <div className="text-center py-2">
            <p className="text-gray-600 text-sm">Starting at</p>
            <p className="text-3xl font-black text-purple-600">$149<span className="text-lg font-normal text-gray-500">/month</span></p>
            <p className="text-xs text-gray-500">or $1,788/year (save 17%)</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleUpgrade}
            className="w-full py-6 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Pro
          </Button>
          {/* Only show "Maybe later" if trial hasn't fully expired yet */}
          {!trialFullyExpired && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              Maybe later
            </Button>
          )}
        </div>

        {trialFullyExpired ? (
          <div className="flex items-center justify-center gap-2 text-xs text-center text-red-500 mt-2">
            <Lock className="w-3 h-3" />
            <span>Upgrade required to continue using Apply</span>
          </div>
        ) : (
          <p className="text-xs text-center text-gray-400 mt-2">
            Your data is safe. Upgrade anytime to pick up where you left off.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Trial Warning Banner for when trial is ending soon
export const TrialWarningBanner = () => {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed) return null;
  if (!subscription || subscription.tier !== 'free_trial') return null;
  if (subscription.status !== 'trialing') return null;

  const { days, hours } = subscription.timeRemaining;

  // Only show if less than 3 days remaining
  if (days > 3) return null;

  const getUrgencyColor = () => {
    if (days === 0) return 'bg-red-500';
    if (days === 1) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const getTimeText = () => {
    if (days === 0) {
      if (hours === 0) return 'less than an hour';
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <div className={`${getUrgencyColor()} text-white py-2 px-4 flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">
          Your free trial ends in {getTimeText()}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/pricing')}
          className="text-xs font-bold"
        >
          Upgrade Now
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(true)}
          className="text-white hover:text-white/80 text-xs"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
};
