
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClarvidaAuthContextType {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const ClarvidaAuthContext = createContext<ClarvidaAuthContextType>({
  session: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export const ClarvidaAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Clarvida Auth Error:", error);
          setSession(null);
        } else {
          setSession(data.session);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error checking Clarvida session:", err);
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email, 
        password
      });
      
      if (error) {
        console.error("Clarvida signIn error:", error);
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during Clarvida signIn:", err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Get the full origin including protocol for redirects
      const origin = window.location.origin;
      const redirectTo = `${origin}/clarvida`;
      
      const { data, error } = await supabase.auth.signUp({
        email, 
        password,
        options: {
          emailRedirectTo: redirectTo
        }
      });
      
      if (error) {
        console.error("Clarvida signUp error:", error);
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      console.error("Unexpected error during Clarvida signUp:", err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Successfully signed out from Clarvida!");
    } catch (err) {
      console.error("Error during Clarvida signOut:", err);
      toast.error("Failed to sign out from Clarvida");
    }
  };

  const value = useMemo(() => ({
    session,
    isAuthenticated: !!session,
    isLoading,
    signIn,
    signUp,
    signOut
  }), [session, isLoading]);

  return (
    <ClarvidaAuthContext.Provider value={value}>
      {children}
    </ClarvidaAuthContext.Provider>
  );
};

export const useClarvidaAuth = () => {
  const context = useContext(ClarvidaAuthContext);
  if (!context) {
    throw new Error("useClarvidaAuth must be used within a ClarvidaAuthProvider");
  }
  return context;
};
