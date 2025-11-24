import { useEffect, useState } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNewAuth } from '@/context/NewAuthContext';

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
  const { user } = useNewAuth();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    let unsubscribeSubscription: (() => void) | undefined;

    const setupSubscriptionListener = async () => {
      try {
        const subscriptionDocRef = doc(db, 'user_subscription_details', user.uid);

        // Set up real-time listener for subscription changes
        unsubscribeSubscription = onSnapshot(
          subscriptionDocRef,
          (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              processSubscriptionData(data);
            } else {
              // No subscription record found, create default trial subscription
              createDefaultSubscription();
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to subscription:', error);
            setError(error.message);
            setLoading(false);
          }
        );

      } catch (error) {
        console.error('Error setting up subscription listener:', error);
        setError(error instanceof Error ? error.message : 'Failed to set up subscription listener');
        setLoading(false);
      }
    };

    setupSubscriptionListener();

    return () => {
      if (unsubscribeSubscription) {
        unsubscribeSubscription();
      }
    };
  }, [user]);

  const processSubscriptionData = (data: any) => {
    try {
      // Calculate time remaining
      const endDate = data.status === 'trialing' ? data.trialEndDate : data.currentPeriodEnd;
      const timeRemaining = calculateTimeRemaining(endDate);

      setSubscription({
        status: data.status,
        tier: data.tier,
        trialStartDate: data.trialStartDate,
        trialEndDate: data.trialEndDate,
        currentPeriodEnd: data.currentPeriodEnd,
        canceledAt: data.canceledAt,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        timeRemaining,
        limits: {
          searches: data.searchesLimit,
          candidatesEnriched: data.candidatesEnrichedLimit,
          aiCalls: data.aiCallsLimit,
          videoInterviews: data.videoInterviewsLimit,
          projects: data.projectsLimit,
          teamMembers: data.teamMembersLimit,
        },
        usage: {
          searches: data.searchesCount || 0,
          candidatesEnriched: data.candidatesEnrichedCount || 0,
          aiCalls: data.aiCallsCount || 0,
          videoInterviews: data.videoInterviewsCount || 0,
        },
      });

      setError(null);
    } catch (err) {
      console.error('Error processing subscription data:', err);
      setError(err instanceof Error ? err.message : 'Failed to process subscription data');
    }
  };

  const fetchSubscription = async () => {
    if (!user || !db) return;

    try {
      setLoading(true);

      const subscriptionDocRef = doc(db, 'user_subscription_details', user.uid);
      const docSnapshot = await getDoc(subscriptionDocRef);

      if (docSnapshot.exists()) {
        processSubscriptionData(docSnapshot.data());
      } else {
        // No subscription record found, create default trial subscription
        await createDefaultSubscription();
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSubscription = async () => {
    if (!user || !db) return;

    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

      const subscriptionDocRef = doc(db, 'user_subscription_details', user.uid);

      await setDoc(subscriptionDocRef, {
        userId: user.uid,
        status: 'trialing',
        tier: 'free_trial',
        trialStartDate: new Date().toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        currentPeriodEnd: null,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        searchesLimit: 10,
        candidatesEnrichedLimit: 50,
        aiCallsLimit: 100,
        videoInterviewsLimit: 5,
        projectsLimit: 3,
        teamMembersLimit: 1,
        searchesCount: 0,
        candidatesEnrichedCount: 0,
        aiCallsCount: 0,
        videoInterviewsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // The real-time listener will automatically update the subscription state
    } catch (err) {
      console.error('Error creating default subscription:', err);
      throw err;
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
      // Use Firebase Cloud Function instead of Supabase function
      const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-apply-codes.cloudfunctions.net';
      const response = await fetch(`${functionUrl}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      return await response.json();
    } catch (err) {
      console.error('Error creating checkout session:', err);
      throw err;
    }
  };

  const createPortalSession = async () => {
    try {
      // Use Firebase Cloud Function instead of Supabase function
      const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-apply-codes.cloudfunctions.net';
      const response = await fetch(`${functionUrl}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/account`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      return await response.json();
    } catch (err) {
      console.error('Error creating portal session:', err);
      throw err;
    }
  };

  const checkUsageLimit = async (usageType: 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews') => {
    try {
      // Use Firebase Cloud Function instead of Supabase RPC
      const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-apply-codes.cloudfunctions.net';
      const response = await fetch(`${functionUrl}/check-usage-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_uuid: user!.id,
          usage_type: usageType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check usage limit');
      }

      const data = await response.json();
      return data as boolean;
    } catch (err) {
      console.error('Error checking usage limit:', err);
      return false;
    }
  };

  const incrementUsage = async (usageType: 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews') => {
    try {
      // Use Firebase Cloud Function instead of Supabase RPC
      const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-apply-codes.cloudfunctions.net';
      const response = await fetch(`${functionUrl}/increment-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_uuid: user!.id,
          usage_type: usageType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to increment usage');
      }

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