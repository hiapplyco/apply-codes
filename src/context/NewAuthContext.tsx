
import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import {
  onAuthChange,
  signOut as authSignOut,
  signInWithGooglePopup,
  AuthUser,
  updateUserEmail,
  updateUserPassword,
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from '@/lib/authService';
import { trackEvent, trackRecruiterSignup, trackFormSubmit } from '@/lib/analytics';

interface NewAuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  updateUser: (attributes: { password?: string; email?: string }) => Promise<void>;
  resetPasswordForEmail: (email: string, redirectUrl?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const NewAuthContext = createContext<NewAuthContextType | undefined>(undefined);

export function NewAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    trackEvent('Sign Out', { provider: 'firebase' });
    await authSignOut();
    // onAuthChange listener sets user to null — no manual setUser needed
  }, []);

  const updateUser = useCallback(async (attributes: { password?: string; email?: string }) => {
    if (attributes.email) {
      await updateUserEmail(attributes.email);
    }
    if (attributes.password) {
      await updateUserPassword(attributes.password);
    }
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string, redirectUrl?: string) => {
    await sendPasswordReset(email, redirectUrl);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password);
    trackEvent('Sign In', { method: 'email', provider: 'firebase' });
    trackFormSubmit('Sign In', true);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    await signUpWithEmail(email, password);
    trackRecruiterSignup(true);
    trackEvent('Sign Up', { method: 'email', provider: 'firebase' });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithGooglePopup();
    trackEvent('Sign In', { method: 'google', provider: 'firebase' });
    trackFormSubmit('Sign In', true);
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user && !isLoading,
    signOut,
    updateUser,
    resetPasswordForEmail,
    signIn,
    signUp,
    signInWithGoogle,
  }), [user, isLoading, signOut, updateUser, resetPasswordForEmail, signIn, signUp, signInWithGoogle]);

  return (
    <NewAuthContext.Provider value={value}>
      {children}
    </NewAuthContext.Provider>
  );
}

export function useNewAuth() {
  const context = useContext(NewAuthContext);
  if (context === undefined) {
    throw new Error('useNewAuth must be used within a NewAuthProvider');
  }
  return context;
}

export type AuthState = ReturnType<typeof useNewAuth>;
