import { createContext, useContext, useMemo, ReactNode } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { authBridge } from "@/lib/auth-bridge";
import { trackEvent, trackRecruiterSignup, trackFormSubmit } from "@/lib/analytics";

interface UnifiedUser {
  id: string;
  email: string;
  provider: 'firebase';
  firebaseUser?: FirebaseUser;
}

interface UnifiedAuthContextType {
  user: UnifiedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  provider: 'firebase';
  isFirebaseConfigured: boolean;
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string, options?: { redirectTo?: string }) => Promise<{ error: Error | null }>;
  updateUser: (attributes: { password?: string; email?: string; data?: object }) => Promise<{ error: Error | null }>;
  // Provider management
  enableFirebase: () => void;
  disableFirebase: () => void;
  isUsingFirebase: () => boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  provider: 'firebase',
  isFirebaseConfigured: false,
  signIn: async () => ({ error: new Error("UnifiedAuthContext not initialized") }),
  signUp: async () => ({ error: new Error("UnifiedAuthContext not initialized") }),
  signOut: async () => ({ error: new Error("UnifiedAuthContext not initialized") }),
  resetPasswordForEmail: async () => ({ error: new Error("UnifiedAuthContext not initialized") }),
  updateUser: async () => ({ error: new Error("UnifiedAuthContext not initialized") }),
  enableFirebase: () => { },
  disableFirebase: () => { },
  isUsingFirebase: () => false,
});

export const UnifiedAuthProvider = ({ children }: { children: ReactNode }) => {
  console.log('UnifiedAuthProvider initializing...');

  const firebaseAuth = useFirebaseAuth();

  const activeProvider = 'firebase' as const;

  // Create unified user object
  const unifiedUser = useMemo((): UnifiedUser | null => {
    if (firebaseAuth.user) {
      return {
        id: firebaseAuth.user.uid,
        email: firebaseAuth.user.email || '',
        provider: 'firebase',
        firebaseUser: firebaseAuth.user,
      };
    }

    return null;
  }, [firebaseAuth.user]);

  // Auth methods using the bridge
  const signIn = async (email: string, password: string) => {
    try {
      const result = await authBridge.signIn(email, password);
      if (!result.error) {
        trackEvent('Sign In', { method: 'email', provider: activeProvider });
        trackFormSubmit('Sign In', true);
      } else {
        trackFormSubmit('Sign In', false);
      }
      return result;
    } catch (error) {
      trackFormSubmit('Sign In', false);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await authBridge.signUp(email, password);
      if (!result.error) {
        trackRecruiterSignup(true);
        trackEvent('Sign Up', { method: 'email', provider: activeProvider });
      } else {
        trackRecruiterSignup(false);
      }
      return result;
    } catch (error) {
      trackRecruiterSignup(false);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const result = await authBridge.signOut();
      if (!result.error) {
        trackEvent('Sign Out', { provider: activeProvider });
      }
      return result;
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPasswordForEmail = async (email: string, options?: { redirectTo?: string }) => {
    try {
      return await authBridge.resetPassword(email, options?.redirectTo);
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateUser = async (attributes: { password?: string; email?: string; data?: object }) => {
    try {
      return await authBridge.updateUser(attributes);
    } catch (error) {
      return { error: error as Error };
    }
  };

  const enableFirebase = () => {
    authBridge.enableFirebase();
  };

  const disableFirebase = () => {
    authBridge.disableFirebase();
  };

  const isUsingFirebase = () => {
    return authBridge.isUsingFirebase();
  };

  const value = useMemo(() => ({
    user: unifiedUser,
    isAuthenticated: !!unifiedUser,
    isLoading: firebaseAuth.isLoading,
    error: firebaseAuth.error,
    provider: activeProvider,
    isFirebaseConfigured: isFirebaseConfigured(),
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updateUser,
    enableFirebase,
    disableFirebase,
    isUsingFirebase,
  }), [
    unifiedUser,
    firebaseAuth.isLoading,
    firebaseAuth.error
  ]);

  console.log('UnifiedAuthProvider render:', {
    isAuthenticated: value.isAuthenticated,
    isLoading: value.isLoading,
    provider: value.provider,
    isFirebaseConfigured: value.isFirebaseConfigured,
    error: value.error
  });

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error("useUnifiedAuth must be used within a UnifiedAuthProvider");
  }
  return context;
};
