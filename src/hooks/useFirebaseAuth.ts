import { useState, useCallback, useEffect, useRef } from "react";
import { User as FirebaseUser } from "firebase/auth";
import {
  auth,
  isFirebaseConfigured,
  firebaseOnAuthStateChanged,
  getCurrentUser,
  handleFirebaseError
} from "@/lib/firebase";

export interface FirebaseAuthState {
  user: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useFirebaseAuth = () => {
  const [state, setState] = useState<FirebaseAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Fast timeout - ensure loading is quick for better UX
  useEffect(() => {
    const fastTimeout = setTimeout(() => {
      setState(prev => {
        if (prev.isLoading) {
          console.log('Firebase auth fast timeout - proceeding without user');
          return { ...prev, isLoading: false };
        }
        return prev;
      });
    }, 1000); // 1 second max for immediate UX

    return () => clearTimeout(fastTimeout);
  }, []);

  const prevUser = useRef<FirebaseUser | null>(null);
  const initialized = useRef(false);

  const handleAuthStateChange = useCallback((newUser: FirebaseUser | null) => {
    if (
      newUser?.uid === prevUser.current?.uid &&
      newUser?.email === prevUser.current?.email
    ) {
      return;
    }

    console.log('Firebase auth state update:', !!newUser, 'initialized:', initialized.current);
    prevUser.current = newUser;

    setState({
      user: newUser,
      isAuthenticated: !!newUser,
      isLoading: false,
      error: null,
    });
  }, []);

  const setError = useCallback((error: any) => {
    const errorMessage = handleFirebaseError(error);
    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  useEffect(() => {
    console.log('useFirebaseAuth effect running, initialized:', initialized.current);
    if (initialized.current || !isFirebaseConfigured()) {
      return;
    }

    const initializeAuth = async () => {
      // Set a fast timeout for immediate UX
      const timeoutId = setTimeout(() => {
        console.log('Firebase auth check timeout - proceeding');
        setState(prev => ({
          ...prev,
          isLoading: false,
          user: null,
          isAuthenticated: false
        }));
      }, 800); // 800ms timeout for fast UX

      try {
        console.log('Initializing Firebase auth session...');
        console.log('Firebase auth ready:', !!auth);

        // Get current user
        const currentUser = getCurrentUser();

        clearTimeout(timeoutId);

        console.log('Initial Firebase user:', !!currentUser);
        initialized.current = true;
        handleAuthStateChange(currentUser);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error initializing Firebase auth:', error);
        setError(error);
      }
    };

    initializeAuth();

    // Set up auth state listener
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = firebaseOnAuthStateChanged((user) => {
        console.log('Firebase auth state change event:', !!user);
        if (initialized.current) {
          handleAuthStateChange(user);
        }
      });
    } catch (error) {
      console.error('Error setting up Firebase auth listener:', error);
      setError(error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleAuthStateChange, setError]);

  return {
    ...state,
    clearError,
    isConfigured: isFirebaseConfigured(),
  };
};