import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface SubscriptionDetails {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  tier: 'free_trial' | 'starter' | 'professional' | 'enterprise';
  trialStartDate: string;
  trialEndDate: string;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  cancelAtPeriodEnd: boolean;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
  };
  limits: {
    searches: number | null;
    candidatesEnriched: number | null;
    aiCalls: number | null;
    videoInterviews: number | null;
    projects: number | null;
    teamMembers: number | null;
  };
  usage: {
    searches: number;
    candidatesEnriched: number;
    aiCalls: number;
    videoInterviews: number;
  };
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    fetchSubscription();

    // Subscribe to subscription changes
    const subscription = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscription_details',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_subscription_details')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;

      if (data) {
        // Calculate time remaining
        const endDate = data.status === 'trialing' ? data.trial_end_date : data.current_period_end;
        const timeRemaining = calculateTimeRemaining(endDate);

        setSubscription({
          status: data.status,
          tier: data.tier,
          trialStartDate: data.trial_start_date,
          trialEndDate: data.trial_end_date,
          currentPeriodEnd: data.current_period_end,
          canceledAt: data.canceled_at,
          cancelAtPeriodEnd: data.cancel_at_period_end,
          timeRemaining,
          limits: {
            searches: data.searches_limit,
            candidatesEnriched: data.candidates_enriched_limit,
            aiCalls: data.ai_calls_limit,
            videoInterviews: data.video_interviews_limit,
            projects: data.projects_limit,
            teamMembers: data.team_members_limit,
          },
          usage: {
            searches: data.searches_count || 0,
            candidatesEnriched: data.candidates_enriched_count || 0,
            aiCalls: data.ai_calls_count || 0,
            videoInterviews: data.video_interviews_count || 0,
          },
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  };

  const createCheckoutSession = async (priceId: string) => {
    try {
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        },
      });

      if (response.error) throw response.error;

      return response.data;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      throw err;
    }
  };

  const createPortalSession = async () => {
    try {
      const response = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: `${window.location.origin}/account`,
        },
      });

      if (response.error) throw response.error;

      return response.data;
    } catch (err) {
      console.error('Error creating portal session:', err);
      throw err;
    }
  };

  const checkUsageLimit = async (usageType: 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews') => {
    try {
      const { data, error } = await supabase.rpc('check_usage_limit', {
        user_uuid: user!.id,
        usage_type: usageType,
      });

      if (error) throw error;

      return data as boolean;
    } catch (err) {
      console.error('Error checking usage limit:', err);
      return false;
    }
  };

  const incrementUsage = async (usageType: 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews') => {
    try {
      const { error } = await supabase.rpc('increment_usage', {
        user_uuid: user!.id,
        usage_type: usageType,
      });

      if (error) throw error;

      // Refresh subscription data
      await fetchSubscription();
    } catch (err) {
      console.error('Error incrementing usage:', err);
      throw err;
    }
  };

  const isFeatureEnabled = (feature: string): boolean => {
    if (!subscription) return false;

    const featureMap: Record<string, boolean> = {
      boolean_search: true, // Always enabled
      candidate_enrichment: true, // Always enabled
      ai_chat: true, // Always enabled
      video_interviews: true, // Always enabled
      bulk_operations: subscription.tier !== 'free_trial',
      api_access: subscription.tier === 'professional' || subscription.tier === 'enterprise',
      custom_integrations: subscription.tier === 'enterprise',
    };

    return featureMap[feature] || false;
  };

  const canUseFeature = (usageType: 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews'): boolean => {
    if (!subscription) return false;

    const limitKey = usageType.replace('_', '') + 'Limit' as keyof typeof subscription.limits;
    const usageKey = usageType.replace('_', '') as keyof typeof subscription.usage;

    const limit = subscription.limits[limitKey];
    const usage = subscription.usage[usageKey];

    // Null limit means unlimited
    if (limit === null) return true;

    return usage < limit;
  };

  return {
    subscription,
    loading,
    error,
    createCheckoutSession,
    createPortalSession,
    checkUsageLimit,
    incrementUsage,
    isFeatureEnabled,
    canUseFeature,
    refetch: fetchSubscription,
  };
};