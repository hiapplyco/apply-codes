/**
 * Firebase Real-time Migration Test
 *
 * This test verifies that the migrated hooks are properly set up
 * for Firebase Firestore real-time listeners.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  onSnapshot,
  setDoc,
  deleteDoc,
  addDoc,
  getDoc,
  collection,
  doc
} from 'firebase/firestore';
import { useSubscription } from '@/hooks/useSubscription';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  collection: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'timestamp'),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  addDoc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
  }),
}));

describe('Firebase Real-time Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (collection as unknown as Mock).mockImplementation((...segments: any[]) => ({ path: segments.join('/') }));
    (doc as unknown as Mock).mockImplementation((...segments: any[]) => ({ path: segments.join('/') }));
    (setDoc as unknown as Mock).mockResolvedValue(undefined);
    (deleteDoc as unknown as Mock).mockResolvedValue(undefined);
    (addDoc as unknown as Mock).mockResolvedValue({ id: 'new-doc' });
    (getDoc as unknown as Mock).mockResolvedValue({ exists: () => true, data: () => ({}) });
    (onSnapshot as unknown as Mock).mockImplementation(() => vi.fn());
  });

  describe('useSubscription', () => {
    it('should set up Firebase Firestore listeners for subscription changes', () => {
      const { result } = renderHook(() => useSubscription());

      expect(result.current.subscription).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(typeof result.current.createCheckoutSession).toBe('function');
      expect(typeof result.current.incrementUsage).toBe('function');
    });

    it('should process subscription data correctly', async () => {
      const mockSubscriptionData = {
        status: 'trialing',
        tier: 'free_trial',
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      };

      (onSnapshot as unknown as Mock).mockImplementation((docRef, callback) => {
        const mockDocSnapshot = {
          exists: () => true,
          data: () => mockSubscriptionData
        };
        act(() => {
          callback(mockDocSnapshot);
        });
        return vi.fn();
      });

      const { result } = renderHook(() => useSubscription());

      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.subscription).toBeDefined();
        expect(result.current.subscription?.status).toBe('trialing');
        expect(result.current.subscription?.tier).toBe('free_trial');
      });
    });
  });

  describe('Real-time Listener Cleanup', () => {
    it('should properly unsubscribe all listeners on component unmount', () => {
      const unsubscribeMocks = [vi.fn()];
      let callIndex = 0;

      (onSnapshot as any).mockImplementation(() => {
        return unsubscribeMocks[callIndex++];
      });

      // Test subscription hook
      const { unmount: unmountSubscription } = renderHook(() =>
        useSubscription()
      );

      unmountSubscription();

      expect(unsubscribeMocks[0]).toHaveBeenCalled();
    });
  });
});
