import { createContext, useContext, useMemo } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import {
  firebaseSignIn,
  firebaseSignUp,
  firebaseSignOut,
  firebaseSendPasswordReset,
  firebaseUpdatePassword,
  firebaseUpdateEmail,
  handleFirebaseError,
  isFirebaseConfigured
} from "@/lib/firebase";
import { trackEvent, trackRecruiterSignup, trackFormSubmit } from "@/lib/analytics";

interface FirebaseAuthContextType {
  user: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string, options?: { redirectTo?: string }) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: Error | null }>;
  clearError: () => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isConfigured: false,
  signIn: async () => ({ error: new Error("FirebaseAuthContext not initialized") }),
  signUp: async () => ({ error: new Error("FirebaseAuthContext not initialized") }),
  signOut: async () => ({ error: new Error("FirebaseAuthContext not initialized") }),
  resetPasswordForEmail: async () => ({ error: new Error("FirebaseAuthContext not initialized") }),
  updatePassword: async () => ({ error: new Error("FirebaseAuthContext not initialized") }),
  updateEmail: async () => ({ error: new Error("FirebaseAuthContext not initialized") }),
  clearError: () => {},
});

export const FirebaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('FirebaseAuthProvider initializing...');
  const auth = useFirebaseAuth();

  // Auth methods
  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      return { error: new Error("Firebase not configured") };
    }

    try {
      await firebaseSignIn(email, password);
      trackEvent('Sign In', { method: 'email', provider: 'firebase' });
      trackFormSubmit('Sign In', true);
      return { error: null };
    } catch (error: any) {
      console.error('Firebase sign in error:', error);
      trackFormSubmit('Sign In', false);
      return { error: new Error(handleFirebaseError(error)) };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      return { error: new Error("Firebase not configured") };
    }

    try {
      await firebaseSignUp(email, password);
      trackRecruiterSignup(true);
      trackEvent('Sign Up', { method: 'email', provider: 'firebase' });
      return { error: null };
    } catch (error: any) {
      console.error('Firebase sign up error:', error);
      trackRecruiterSignup(false);
      return { error: new Error(handleFirebaseError(error)) };
    }
  };

  const signOut = async () => {
    if (!isFirebaseConfigured()) {
      return { error: new Error("Firebase not configured") };
    }

    try {
      await firebaseSignOut();
      trackEvent('Sign Out', { provider: 'firebase' });
      return { error: null };
    } catch (error: any) {
      console.error('Firebase sign out error:', error);
      return { error: new Error(handleFirebaseError(error)) };
    }
  };

  const resetPasswordForEmail = async (email: string, options?: { redirectTo?: string }) => {
    if (!isFirebaseConfigured()) {
      return { error: new Error("Firebase not configured") };
    }

    try {
      await firebaseSendPasswordReset(email, options?.redirectTo);
      return { error: null };
    } catch (error: any) {
      console.error('Firebase password reset error:', error);
      return { error: new Error(handleFirebaseError(error)) };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!isFirebaseConfigured()) {
      return { error: new Error("Firebase not configured") };
    }

    try {
      await firebaseUpdatePassword(newPassword);
      return { error: null };
    } catch (error: any) {
      console.error('Firebase password update error:', error);
      return { error: new Error(handleFirebaseError(error)) };
    }
  };

  const updateEmail = async (newEmail: string) => {
    if (!isFirebaseConfigured()) {
      return { error: new Error("Firebase not configured") };
    }

    try {
      await firebaseUpdateEmail(newEmail);
      return { error: null };
    } catch (error: any) {
      console.error('Firebase email update error:', error);
      return { error: new Error(handleFirebaseError(error)) };
    }
  };

  const value = useMemo(() => ({
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    isConfigured: auth.isConfigured,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    updateEmail,
    clearError: auth.clearError,
  }), [
    auth.user,
    auth.isAuthenticated,
    auth.isLoading,
    auth.error,
    auth.isConfigured,
    auth.clearError
  ]);

  console.log('FirebaseAuthProvider render:', {
    isAuthenticated: value.isAuthenticated,
    isLoading: value.isLoading,
    isConfigured: value.isConfigured,
    error: value.error
  });

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuthContext = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error("useFirebaseAuthContext must be used within a FirebaseAuthProvider");
  }
  return context;
};