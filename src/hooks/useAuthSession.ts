
import { useState, useCallback, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuthSession = () => {
  const [state, setState] = useState<AuthState>({
    session: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  const prevSession = useRef<Session | null>(null);
  const initialized = useRef(false);

  const handleSessionChange = useCallback((newSession: Session | null) => {
    if (
      newSession?.user?.id === prevSession.current?.user?.id &&
      newSession?.expires_at === prevSession.current?.expires_at
    ) {
      return;
    }

    console.log('Session update:', !!newSession, 'initialized:', initialized.current);
    prevSession.current = newSession;
    
    setState({
      session: newSession,
      isAuthenticated: !!newSession,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    
    const initializeAuth = async () => {
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Auth initialization timeout - proceeding without session');
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          session: null,
          isAuthenticated: false
        }));
      }, 10000); // 10 second timeout for slower connections

      try {
        console.log('Initializing auth session...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Error getting initial session:', error);
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            session: null,
            isAuthenticated: false
          }));
          return;
        }
        
        console.log('Initial session:', !!initialSession);
        initialized.current = true;
        handleSessionChange(initialSession);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error initializing auth:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          session: null,
          isAuthenticated: false
        }));
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state change event:', _event, !!session);
      if (initialized.current) {
        handleSessionChange(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSessionChange]);

  return state;
};
