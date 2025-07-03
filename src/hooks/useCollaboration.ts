import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

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
  const supabase = useSupabaseClient();
  const user = useUser();

  useEffect(() => {
    if (!enabled || !user || !documentId) return;

    const channel = supabase
      .channel(`${presenceChannel}:${documentId}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const collaborators: CollaborationUser[] = [];

        Object.keys(presenceState).forEach((userId) => {
          const presence = presenceState[userId][0];
          if (presence && userId !== user.id) {
            collaborators.push({
              id: userId,
              name: presence.name || 'Anonymous',
              avatar: presence.avatar_url,
              cursor: presence.cursor,
              lastSeen: new Date(presence.last_seen)
            });
          }
        });

        setUsers(collaborators);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      });

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        
        // Track our own presence
        await channel.track({
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email || 'Anonymous',
          avatar_url: user.user_metadata?.avatar_url,
          last_seen: new Date().toISOString()
        });
      }
    });

    return () => {
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [enabled, documentId, user, supabase, presenceChannel]);

  const updateCursor = async (cursor: { x: number; y: number }) => {
    if (!isConnected || !user) return;

    const channel = supabase.channel(`${presenceChannel}:${documentId}`);
    await channel.track({
      user_id: user.id,
      name: user.user_metadata?.full_name || user.email || 'Anonymous',
      avatar_url: user.user_metadata?.avatar_url,
      cursor,
      last_seen: new Date().toISOString()
    });
  };

  const updatePresence = async (data: Record<string, unknown>) => {
    if (!isConnected || !user) return;

    const channel = supabase.channel(`${presenceChannel}:${documentId}`);
    await channel.track({
      user_id: user.id,
      name: user.user_metadata?.full_name || user.email || 'Anonymous',
      avatar_url: user.user_metadata?.avatar_url,
      ...data,
      last_seen: new Date().toISOString()
    });
  };

  return {
    users,
    isConnected,
    updateCursor,
    updatePresence,
    userCount: users.length
  };
}