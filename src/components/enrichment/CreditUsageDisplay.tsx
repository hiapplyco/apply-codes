/**
 * Component to display enrichment credit usage
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const CreditUsageDisplay = memo(() => {
  const { subscription, isLoading } = useSubscription();

  if (isLoading || !subscription) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Coins className="h-4 w-4" />
        <span>Loading credits...</span>
      </div>
    );
  }

  const used = subscription.usage.candidatesEnriched;
  const limit = subscription.limits.candidatesEnriched;
  const remaining = limit ? limit - used : null;
  const percentUsed = limit ? (used / limit) * 100 : 0;
  const isLow = remaining !== null && remaining <= 10;
  const isExhausted = remaining !== null && remaining <= 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Coins className={`h-4 w-4 ${isExhausted ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-gray-500'}`} />
        <span className="text-sm font-medium text-gray-700">
          Enrichment Credits:
        </span>
      </div>

      {limit ? (
        <div className="flex items-center gap-2">
          <Badge
            variant={isExhausted ? 'destructive' : isLow ? 'secondary' : 'outline'}
            className={`font-mono ${
              isExhausted
                ? 'bg-red-100 text-red-800 border-red-300'
                : isLow
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-green-50 text-green-800 border-green-300'
            }`}
          >
            {remaining} / {limit} remaining
          </Badge>

          {isLow && !isExhausted && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">Low credits</span>
            </div>
          )}

          {isExhausted && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">Credits exhausted</span>
            </div>
          )}
        </div>
      ) : (
        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300">
          Unlimited
        </Badge>
      )}
    </div>
  );
});

CreditUsageDisplay.displayName = 'CreditUsageDisplay';

export default CreditUsageDisplay;
