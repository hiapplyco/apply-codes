/**
 * Clarvida subscription hook — enterprise users have unlimited usage.
 * Mirrors useSubscription interface but with no-op operations.
 */

export const useClarvidaSubscription = () => ({
  subscription: null,
  loading: false,
  canUseFeature: (_feature: string) => true,
  incrementUsage: async (_usageType: string) => {},
  isProUser: true,
  isTrialing: false,
});
