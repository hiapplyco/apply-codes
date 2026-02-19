
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  firebaseSignIn,
  firebaseSignUp,
  firebaseSignOut,
  firebaseOnAuthStateChanged,
  handleFirebaseError,
  db
} from "@/lib/firebase";
import { toast } from "sonner";
import { Organization, OrgRole, hasPermission, OrgPermission } from "@/types/organization";

interface ClarvidaAuthContextType {
  session: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  // Organization context
  organization: Organization | null;
  userRole: OrgRole | null;
  isOrgLoading: boolean;
  hasPermission: (permission: OrgPermission) => boolean;
  refreshOrganization: () => Promise<void>;
}

const ClarvidaAuthContext = createContext<ClarvidaAuthContextType>({
  session: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  // Organization defaults
  organization: null,
  userRole: null,
  isOrgLoading: true,
  hasPermission: () => false,
  refreshOrganization: async () => {},
});

const CLARVIDA_ORG_ID = 'clarvida';

export const ClarvidaAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Organization state
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<OrgRole | null>(null);
  const [isOrgLoading, setIsOrgLoading] = useState(true);

  // Load Clarvida organization
  const loadOrganization = useCallback(async (userId: string) => {
    try {
      setIsOrgLoading(true);

      if (!db) return;
      const orgRef = doc(db, 'organizations', CLARVIDA_ORG_ID);
      const orgSnap = await getDoc(orgRef);

      if (!orgSnap.exists()) {
        // Organization not found - user may need to be added
        setOrganization(null);
        setUserRole(null);
        return;
      }

      const orgData = { id: orgSnap.id, ...orgSnap.data() } as Organization;

      // Check if user is a member
      const memberRole = orgData.members?.[userId];
      if (memberRole) {
        setOrganization(orgData);
        setUserRole(memberRole);
      } else {
        // User is authenticated but not a Clarvida member
        // User is not a Clarvida member — still show org for display
        setOrganization(orgData); // Still set org for display purposes
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error loading Clarvida organization:', error);
    } finally {
      setIsOrgLoading(false);
    }
  }, []);

  useEffect(() => {
    // Listen for Firebase auth changes
    const unsubscribe = firebaseOnAuthStateChanged((user) => {
      setSession(user);
      setIsLoading(false);

      // Load organization when user is authenticated
      if (user) {
        loadOrganization(user.uid);
      } else {
        setOrganization(null);
        setUserRole(null);
        setIsOrgLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadOrganization]);

  const signIn = async (email: string, password: string) => {
    try {
      await firebaseSignIn(email, password);
      return { error: null };
    } catch (err) {
      const errorMessage = handleFirebaseError(err);
      return { error: new Error(errorMessage) };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await firebaseSignUp(email, password);
      return { error: null };
    } catch (err) {
      const errorMessage = handleFirebaseError(err);
      return { error: new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut();
      setOrganization(null);
      setUserRole(null);
      toast.success("Successfully signed out from Clarvida!");
    } catch (err) {
      toast.error("Failed to sign out from Clarvida");
    }
  };

  // Permission check helper
  const checkPermission = useCallback((permission: OrgPermission) => {
    return hasPermission(userRole, permission);
  }, [userRole]);

  // Refresh organization data
  const refreshOrganization = useCallback(async () => {
    if (session?.uid) {
      await loadOrganization(session.uid);
    }
  }, [session?.uid, loadOrganization]);

  const value = useMemo(() => ({
    session,
    isAuthenticated: !!session,
    isLoading,
    signIn,
    signUp,
    signOut,
    // Organization context
    organization,
    userRole,
    isOrgLoading,
    hasPermission: checkPermission,
    refreshOrganization
  }), [session, isLoading, organization, userRole, isOrgLoading, checkPermission, refreshOrganization]);

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
