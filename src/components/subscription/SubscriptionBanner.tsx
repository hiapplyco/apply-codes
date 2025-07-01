import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles,
  TrendingUp
} from 'lucide-react';

export const SubscriptionBanner = () => {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!loading && subscription) {
      const shouldShow = 
        subscription.status === 'trialing' || 
        subscription.status === 'past_due' ||
        (subscription.status === 'canceled' && !subscription.cancelAtPeriodEnd);
      
      setShowBanner(shouldShow);
    }
  }, [subscription, loading]);

  if (loading || !showBanner || !subscription) {
    return null;
  }

  const getUsagePercentage = () => {
    const limits = subscription.limits;
    const usage = subscription.usage;
    
    // Calculate percentage for the most used resource
    const percentages = [
      limits.searches ? (usage.searches / limits.searches) * 100 : 0,
      limits.candidatesEnriched ? (usage.candidatesEnriched / limits.candidatesEnriched) * 100 : 0,
      limits.aiCalls ? (usage.aiCalls / limits.aiCalls) * 100 : 0,
    ];
    
    return Math.max(...percentages);
  };

  const renderTrialBanner = () => {
    const { days, hours } = subscription.timeRemaining;
    const totalDays = days + (hours > 0 ? 1 : 0); // Round up
    const isExpiringSoon = totalDays <= 3;
    const usagePercentage = getUsagePercentage();
    const isHighUsage = usagePercentage > 80;

    return (
      <Alert className={`border-2 ${isExpiringSoon ? 'border-orange-500 bg-orange-50' : 'border-purple-500 bg-purple-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpiringSoon ? (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            ) : (
              <Clock className="h-5 w-5 text-purple-600" />
            )}
            <AlertDescription className="text-base font-medium">
              {isExpiringSoon ? (
                <span className="text-orange-800">
                  Your free trial expires in {totalDays} {totalDays === 1 ? 'day' : 'days'}!
                </span>
              ) : (
                <span className="text-purple-800">
                  {totalDays} {totalDays === 1 ? 'day' : 'days'} left in your free trial
                </span>
              )}
              {isHighUsage && (
                <span className="ml-2 text-sm text-gray-600">
                  • {Math.round(usagePercentage)}% of monthly limits used
                </span>
              )}
            </AlertDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isExpiringSoon ? "default" : "outline"}
              onClick={() => navigate('/pricing')}
              className={isExpiringSoon ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Upgrade Now
            </Button>
          </div>
        </div>
        {usagePercentage > 50 && (
          <div className="mt-3">
            <Progress value={usagePercentage} className="h-2" />
            <p className="text-xs text-gray-600 mt-1">
              Usage: {Math.round(usagePercentage)}% of monthly limits
            </p>
          </div>
        )}
      </Alert>
    );
  };

  const renderPastDueBanner = () => {
    return (
      <Alert className="border-2 border-red-500 bg-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-base font-medium text-red-800">
              Your payment failed. Please update your payment method to continue using Apply.
            </AlertDescription>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => navigate('/account')}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Update Payment
          </Button>
        </div>
      </Alert>
    );
  };

  const renderCanceledBanner = () => {
    const { days } = subscription.timeRemaining;
    
    return (
      <Alert className="border-2 border-gray-500 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-gray-600" />
            <AlertDescription className="text-base font-medium text-gray-800">
              Your subscription will end in {days} {days === 1 ? 'day' : 'days'}. 
              Reactivate to keep access to all features.
            </AlertDescription>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/account')}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Reactivate
          </Button>
        </div>
      </Alert>
    );
  };

  switch (subscription.status) {
    case 'trialing':
      return renderTrialBanner();
    case 'past_due':
      return renderPastDueBanner();
    case 'canceled':
      return subscription.cancelAtPeriodEnd ? null : renderCanceledBanner();
    default:
      return null;
  }
};