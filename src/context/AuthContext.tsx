
import { createContext, useContext, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent, trackRecruiterSignup, trackFormSubmit } from "@/lib/analytics";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string, options?: { redirectTo?: string }) => Promise<{ error: Error | null }>;
  updateUser: (attributes: { password?: string; email?: string; data?: object }) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => ({ error: new Error("AuthContext not initialized") }),
  signUp: async () => ({ error: new Error("AuthContext not initialized") }),
  signOut: async () => ({ error: new Error("AuthContext not initialized") }),
  resetPasswordForEmail: async () => ({ error: new Error("AuthContext not initialized") }),
  updateUser: async () => ({ error: new Error("AuthContext not initialized") }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('AuthProvider initializing...');
  const auth = useAuthSession();

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        trackEvent('Sign In', { method: 'email' });
        trackFormSubmit('Sign In', true);
      } else {
        trackFormSubmit('Sign In', false);
      }
      return { error };
    } catch (error) {
      trackFormSubmit('Sign In', false);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (!error) {
        trackRecruiterSignup(true);
        trackEvent('Sign Up', { method: 'email' });
      } else {
        trackRecruiterSignup(false);
      }
      return { error };
    } catch (error) {
      trackRecruiterSignup(false);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        trackEvent('Sign Out', {});
      }
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPasswordForEmail = async (email: string, options?: { redirectTo?: string }) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, options);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateUser = async (attributes: { password?: string; email?: string; data?: object }) => {
    try {
      const { error } = await supabase.auth.updateUser(attributes);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = useMemo(() => ({
    session: auth.session,
    user: auth.session?.user ?? null,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updateUser,
  }), [auth.session, auth.isAuthenticated, auth.isLoading]);

  console.log('AuthProvider render:', { isAuthenticated: value.isAuthenticated, isLoading: value.isLoading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
