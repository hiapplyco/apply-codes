import { useEffect, useState } from 'react';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNewAuth } from '@/context/NewAuthContext';

export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  cursor?: {
    x: number;
    y: number;
  };
  lastSeen: Date;
}

export interface UseCollaborationOptions {
  documentId: string;
  enabled?: boolean;
  presenceChannel?: string;
}

export function useCollaboration({
  documentId,
  enabled = true,
  presenceChannel = 'document-presence'
}: UseCollaborationOptions) {
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useNewAuth();

  useEffect(() => {
    if (!enabled || !user || !documentId || !db) return;

    let unsubscribePresence: (() => void) | undefined;
    let heartbeatInterval: NodeJS.Timeout | undefined;
    let cleanupTimeout: NodeJS.Timeout | undefined;

    const presenceId = `${user.uid}_${documentId}`;
    const presenceDocRef = doc(db, 'presence', presenceId);
    const presenceCollectionRef = collection(db, 'presence');

    const startPresenceTracking = async () => {
      try {
        // Set initial presence
        await setDoc(presenceDocRef, {
          userId: user.uid,
          documentId,
          name: user.email || 'Anonymous',
          avatar: user.photoURL || undefined,
          lastSeen: serverTimestamp(),
          isOnline: true,
          cursor: null
        });

        setIsConnected(true);

        // Set up heartbeat to update presence every 30 seconds
        heartbeatInterval = setInterval(async () => {
          try {
            await setDoc(presenceDocRef, {
              lastSeen: serverTimestamp(),
              isOnline: true
            }, { merge: true });
          } catch (error) {
            console.error('Error updating presence heartbeat:', error);
          }
        }, 30000);

        // Listen to all presence documents for this document
        const presenceQuery = query(
          presenceCollectionRef,
          where('documentId', '==', documentId),
          where('isOnline', '==', true),
          orderBy('lastSeen', 'desc')
        );

        unsubscribePresence = onSnapshot(
          presenceQuery,
          (snapshot) => {
            const collaborators: CollaborationUser[] = [];

            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.userId !== user.uid) {
                // Check if user is still online (within last 2 minutes)
                const lastSeen = data.lastSeen?.toDate() || new Date(0);
                const isRecentlyActive = Date.now() - lastSeen.getTime() < 120000; // 2 minutes

                if (isRecentlyActive) {
                  collaborators.push({
                    id: data.userId,
                    name: data.name || 'Anonymous',
                    avatar: data.avatar,
                    cursor: data.cursor,
                    lastSeen
                  });
                }
              }
            });

            setUsers(collaborators);
          },
          (error) => {
            console.error('Error listening to presence:', error);
            setIsConnected(false);
          }
        );

      } catch (error) {
        console.error('Error setting up presence tracking:', error);
        setIsConnected(false);
      }
    };

    // Cleanup function to remove presence when component unmounts
    const cleanup = async () => {
      try {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        if (cleanupTimeout) {
          clearTimeout(cleanupTimeout);
        }
        if (unsubscribePresence) {
          unsubscribePresence();
        }

        // Mark as offline
        await setDoc(presenceDocRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        }, { merge: true });

        // Schedule deletion after 5 minutes
        cleanupTimeout = setTimeout(async () => {
          try {
            await deleteDoc(presenceDocRef);
          } catch (error) {
            console.error('Error deleting presence document:', error);
          }
        }, 300000); // 5 minutes

        setIsConnected(false);
      } catch (error) {
        console.error('Error during presence cleanup:', error);
      }
    };

    startPresenceTracking();

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanup();
      } else if (enabled && user && documentId) {
        startPresenceTracking();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', cleanup);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [enabled, documentId, user, presenceChannel]);

  const updateCursor = async (cursor: { x: number; y: number }) => {
    if (!isConnected || !user || !db) return;

    try {
      const presenceId = `${user.uid}_${documentId}`;
      const presenceDocRef = doc(db, 'presence', presenceId);

      await setDoc(presenceDocRef, {
        cursor,
        lastSeen: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  };

  const updatePresence = async (data: Record<string, unknown>) => {
    if (!isConnected || !user || !db) return;

    try {
      const presenceId = `${user.uid}_${documentId}`;
      const presenceDocRef = doc(db, 'presence', presenceId);

      await setDoc(presenceDocRef, {
        ...data,
        lastSeen: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  return {
    users,
    isConnected,
    updateCursor,
    updatePresence,
    userCount: users.length
  };
}