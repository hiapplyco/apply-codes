/**
 * Clarvida usage limit hook — enterprise users have unlimited usage.
 * Mirrors useUsageLimit interface but always allows actions.
 */

type UsageType = 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews';

const NoopModal = () => null;

export const useClarvidaUsageLimit = () => ({
  checkAndExecute: async <T>(_usageType: UsageType, action: () => Promise<T>): Promise<T | null> => {
    return action();
  },
  UsageLimitModalComponent: NoopModal,
  isLimitReached: (_usageType: UsageType) => false,
  getRemainingUsage: (_usageType: UsageType): number | null => null,
});
