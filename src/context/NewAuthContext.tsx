
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthChange, signOut as authSignOut, AuthUser, updateUserEmail, updateUserPassword, sendPasswordReset, signInWithEmail, signUpWithEmail } from '@/lib/authService';

interface NewAuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  updateUser: (attributes: { password?: string; email?: string }) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const NewAuthContext = createContext<NewAuthContextType | undefined>(undefined);

interface NewAuthProviderProps {
  children: ReactNode;
}

export function NewAuthProvider({ children }: NewAuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to authentication state changes
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await authSignOut();
    setUser(null); // Immediately clear user state
  };

  const updateUser = async (attributes: { password?: string; email?: string }) => {
    if (attributes.email) {
      await updateUserEmail(attributes.email);
    }
    if (attributes.password) {
      await updateUserPassword(attributes.password);
    }
    // Re-fetch user data to reflect changes, if necessary (Firebase automatically updates the user object)
  };

  const resetPasswordForEmail = async (email: string) => {
    await sendPasswordReset(email);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmail(email, password);
  };

  const signUp = async (email: string, password: string) => {
    await signUpWithEmail(email, password);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user && !isLoading,
    signOut,
    updateUser,
    resetPasswordForEmail,
    signIn,
    signUp,
  };

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
