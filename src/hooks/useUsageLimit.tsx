import { useState, useCallback } from 'react';
import { useSubscription } from './useSubscription';
import { UsageLimitModal } from '@/components/subscription/UsageLimitModal';

type UsageType = 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews';

interface UseUsageLimitReturn {
  checkAndExecute: <T>(
    usageType: UsageType,
    action: () => Promise<T>
  ) => Promise<T | null>;
  UsageLimitModalComponent: React.FC;
  isLimitReached: (usageType: UsageType) => boolean;
  getRemainingUsage: (usageType: UsageType) => number | null;
}

export const useUsageLimit = (): UseUsageLimitReturn => {
  const { subscription, canUseFeature, incrementUsage } = useSubscription();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    limitType: UsageType;
    currentUsage: number;
    limit: number;
  } | null>(null);

  const getUsageInfo = useCallback((usageType: UsageType) => {
    if (!subscription) return { usage: 0, limit: null };

    const mapping: Record<UsageType, { usageKey: keyof typeof subscription.usage; limitKey: keyof typeof subscription.limits }> = {
      searches: { usageKey: 'searches', limitKey: 'searches' },
      candidates_enriched: { usageKey: 'candidatesEnriched', limitKey: 'candidatesEnriched' },
      ai_calls: { usageKey: 'aiCalls', limitKey: 'aiCalls' },
      video_interviews: { usageKey: 'videoInterviews', limitKey: 'videoInterviews' },
    };

    const { usageKey, limitKey } = mapping[usageType];
    return {
      usage: subscription.usage[usageKey],
      limit: subscription.limits[limitKey],
    };
  }, [subscription]);

  const isLimitReached = useCallback((usageType: UsageType): boolean => {
    return !canUseFeature(usageType);
  }, [canUseFeature]);

  const getRemainingUsage = useCallback((usageType: UsageType): number | null => {
    const { usage, limit } = getUsageInfo(usageType);
    if (limit === null) return null; // Unlimited
    return Math.max(0, limit - usage);
  }, [getUsageInfo]);

  const checkAndExecute = useCallback(async <T,>(
    usageType: UsageType,
    action: () => Promise<T>
  ): Promise<T | null> => {
    // Check if user can use this feature
    if (!canUseFeature(usageType)) {
      const { usage, limit } = getUsageInfo(usageType);
      setModalState({
        isOpen: true,
        limitType: usageType,
        currentUsage: usage,
        limit: limit ?? 0,
      });
      return null;
    }

    // Execute the action
    const result = await action();

    // Increment usage after successful action
    try {
      await incrementUsage(usageType);
    } catch (error) {
      console.error('Failed to increment usage:', error);
      // Don't fail the action if usage increment fails
    }

    return result;
  }, [canUseFeature, getUsageInfo, incrementUsage]);

  const handleCloseModal = useCallback(() => {
    setModalState(null);
  }, []);

  const UsageLimitModalComponent: React.FC = useCallback(() => {
    if (!modalState) return null;

    return (
      <UsageLimitModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        limitType={modalState.limitType}
        currentUsage={modalState.currentUsage}
        limit={modalState.limit}
      />
    );
  }, [modalState, handleCloseModal]);

  return {
    checkAndExecute,
    UsageLimitModalComponent,
    isLimitReached,
    getRemainingUsage,
  };
};
