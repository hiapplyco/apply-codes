import { useEffect, useState, useCallback } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  getDoc,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNewAuth } from '@/context/NewAuthContext';

export interface SubscriptionDetails {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  tier: 'free_trial' | 'pro' | 'enterprise';  // Simplified 3-tier system
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

  const processSubscriptionData = useCallback((data: DocumentData) => {
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
  }, []);

  const createDefaultSubscription = useCallback(async () => {
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
  }, [user, db]);

  const fetchSubscription = useCallback(async () => {
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
  }, [user, createDefaultSubscription, processSubscriptionData]);

  useEffect(() => {
    if (!user || !db) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    let unsubscribeSubscription: (() => void) | undefined;

    const setupSubscriptionListener = async () => {
      try {
        const subscriptionDocRef = doc(db!, 'user_subscription_details', user.uid);

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
  }, [user, createDefaultSubscription, processSubscriptionData]);

  const createCheckoutSession = async (priceId: string) => {
    try {
      const { functions } = await import('@/lib/firebase');
      if (!functions) throw new Error('Firebase Functions not initialized');

      const { httpsCallable } = await import('firebase/functions');
      const createSession = httpsCallable(functions, 'createCheckoutSession');

      const result = await createSession({
        priceId,
        successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/checkout/cancel`,
      });

      const data = result.data as { url: string };
      return data;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      throw err;
    }
  };

  const createPortalSession = async () => {
    try {
      const { functions } = await import('@/lib/firebase');
      if (!functions) throw new Error('Firebase Functions not initialized');

      const { httpsCallable } = await import('firebase/functions');
      const createSession = httpsCallable(functions, 'createPortalSession');

      const result = await createSession({
        returnUrl: `${window.location.origin}/profile`,
      });

      const data = result.data as { url: string };
      return data;
    } catch (err) {
      console.error('Error creating portal session:', err);
      throw err;
    }
  };

  const canUseFeature = (usageType: 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews'): boolean => {
    if (!subscription) return false;

    const limitKey = (usageType.replace('_', '') + 'Limit') as keyof typeof subscription.limits;
    const usageKey = (usageType.replace('_', '') + 'Count') as keyof typeof subscription.usage; // Fixed usage key mapping

    // Handle legacy usage keys if needed, but for now assuming strict mapping
    // Actually, let's look at the interface:
    // limits: searches, candidatesEnriched, aiCalls, videoInterviews
    // usage: searches, candidatesEnriched, aiCalls, videoInterviews
    // The usageType is 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews'

    // Map usageType to interface keys
    let limitProp: keyof typeof subscription.limits;
    let usageProp: keyof typeof subscription.usage;

    switch (usageType) {
      case 'searches':
        limitProp = 'searches';
        usageProp = 'searches';
        break;
      case 'candidates_enriched':
        limitProp = 'candidatesEnriched';
        usageProp = 'candidatesEnriched';
        break;
      case 'ai_calls':
        limitProp = 'aiCalls';
        usageProp = 'aiCalls';
        break;
      case 'video_interviews':
        limitProp = 'videoInterviews';
        usageProp = 'videoInterviews';
        break;
    }

    const limit = subscription.limits[limitProp];
    const usage = subscription.usage[usageProp];

    // Null limit means unlimited
    if (limit === null) return true;

    return usage < limit;
  };

  const checkUsageLimit = async (usageType: 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews') => {
    return canUseFeature(usageType);
  };

  const incrementUsage = async (usageType: 'searches' | 'candidates_enriched' | 'ai_calls' | 'video_interviews') => {
    if (!user || !db) return;

    try {
      const { increment, updateDoc, doc } = await import('firebase/firestore');
      const subscriptionDocRef = doc(db, 'user_subscription_details', user.uid);

      const fieldName = usageType === 'searches' ? 'searchesCount' :
        usageType === 'candidates_enriched' ? 'candidatesEnrichedCount' :
          usageType === 'ai_calls' ? 'aiCallsCount' :
            'videoInterviewsCount';

      await updateDoc(subscriptionDocRef, {
        [fieldName]: increment(1),
        updatedAt: serverTimestamp()
      });

      // No need to manually refetch, onSnapshot will handle it
    } catch (err) {
      console.error('Error incrementing usage:', err);
      throw err;
    }
  };

  const isFeatureEnabled = (feature: string): boolean => {
    if (!subscription) return false;

    // Simplified 3-tier feature access
    const featureMap: Record<string, boolean> = {
      boolean_search: true,           // All tiers
      candidate_enrichment: true,     // All tiers
      ai_chat: true,                  // All tiers
      video_interviews: true,         // All tiers
      bulk_operations: subscription.tier !== 'free_trial',  // Pro & Enterprise
      api_access: subscription.tier === 'pro' || subscription.tier === 'enterprise',  // Pro & Enterprise
      advanced_analytics: subscription.tier === 'pro' || subscription.tier === 'enterprise',  // Pro & Enterprise
      custom_integrations: subscription.tier === 'enterprise',  // Enterprise only
      sso: subscription.tier === 'enterprise',  // Enterprise only
      unlimited_team: subscription.tier === 'enterprise',  // Enterprise only
    };

    return featureMap[feature] || false;
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