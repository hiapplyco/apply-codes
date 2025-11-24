
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import {
  firebaseSignIn,
  firebaseSignUp,
  firebaseSignOut,
  firebaseOnAuthStateChanged,
  handleFirebaseError
} from "@/lib/firebase";
import { toast } from "sonner";

interface ClarvidaAuthContextType {
  session: FirebaseUser | null;
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
  const [session, setSession] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth changes
    const unsubscribe = firebaseOnAuthStateChanged((user) => {
      setSession(user);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await firebaseSignIn(email, password);
      return { error: null };
    } catch (err) {
      const errorMessage = handleFirebaseError(err);
      console.error("Clarvida signIn error:", err);
      return { error: new Error(errorMessage) };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await firebaseSignUp(email, password);
      return { error: null };
    } catch (err) {
      const errorMessage = handleFirebaseError(err);
      console.error("Clarvida signUp error:", err);
      return { error: new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut();
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
