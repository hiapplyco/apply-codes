import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Firebase services interface
interface FirebaseServices {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  functions: Functions | null;
  storage: FirebaseStorage | null;
  analytics: Analytics | null;
}

// Firebase configuration from environment variables
const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Initialize Firebase services
const services: FirebaseServices = {
  app: null,
  auth: null,
  db: null,
  functions: null,
  storage: null,
  analytics: null
};

// Initialize Firebase only if config is provided
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    services.app = initializeApp(firebaseConfig);
    services.auth = getAuth(services.app);
    services.db = getFirestore(services.app);
    services.functions = getFunctions(services.app);
    services.storage = getStorage(services.app);

    const useEmulators =
      (import.meta.env.VITE_USE_FIREBASE_EMULATORS || '').toLowerCase() === 'true' ||
      (!import.meta.env.PROD && typeof window !== 'undefined' && window.location.hostname === 'localhost');

    if (services.functions && useEmulators) {
      const emulatorHost = import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST || '127.0.0.1';
      const emulatorPort = Number(import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001);
      connectFunctionsEmulator(services.functions, emulatorHost, emulatorPort);
    }

    // Initialize Analytics conditionally - only in production
    const isProduction = import.meta.env.PROD;
    if (isProduction) {
      isSupported().then(supported => {
        if (supported && firebaseConfig.measurementId && services.app) {
          services.analytics = getAnalytics(services.app);
        }
      }).catch(error => {
        console.warn('Firebase Analytics initialization failed:', error);
      });
    } else {
      console.log('Firebase Analytics disabled in development mode');
    }

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.log('Firebase not configured - missing required environment variables');
}

// Export services
export const { app, auth, db, functions, storage, analytics } = services;

// Helper function to check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && services.app);
};

// Helper function to get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return services.auth?.currentUser || null;
};

// Auth helper functions
export const firebaseSignIn = async (email: string, password: string): Promise<UserCredential> => {
  if (!services.auth) {
    throw new Error('Firebase Auth not initialized');
  }
  return signInWithEmailAndPassword(services.auth, email, password);
};

export const firebaseSignUp = async (email: string, password: string): Promise<UserCredential> => {
  if (!services.auth) {
    throw new Error('Firebase Auth not initialized');
  }
  return createUserWithEmailAndPassword(services.auth, email, password);
};

export const firebaseSignOut = async (): Promise<void> => {
  if (!services.auth) {
    throw new Error('Firebase Auth not initialized');
  }
  return signOut(services.auth);
};

export const firebaseSendPasswordReset = async (email: string, redirectUrl?: string): Promise<void> => {
  if (!services.auth) {
    throw new Error('Firebase Auth not initialized');
  }
  const actionCodeSettings = redirectUrl ? { url: redirectUrl } : undefined;
  return sendPasswordResetEmail(services.auth, email, actionCodeSettings);
};

export const firebaseUpdatePassword = async (newPassword: string): Promise<void> => {
  if (!services.auth?.currentUser) {
    throw new Error('No authenticated user');
  }
  return updatePassword(services.auth.currentUser, newPassword);
};

export const firebaseUpdateEmail = async (newEmail: string): Promise<void> => {
  if (!services.auth?.currentUser) {
    throw new Error('No authenticated user');
  }
  return updateEmail(services.auth.currentUser, newEmail);
};

export const firebaseOnAuthStateChanged = (callback: (user: FirebaseUser | null) => void) => {
  if (!services.auth) {
    throw new Error('Firebase Auth not initialized');
  }
  return onAuthStateChanged(services.auth, callback);
};

// Error handling utilities
export const handleFirebaseError = (error: any): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No user found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

// Migration helper preserved for compatibility - now always Firebase
export const useFirebaseOrSupabase = (): 'firebase' => {
  return 'firebase';
};

// Configuration validation
export const validateFirebaseConfig = (): { isValid: boolean; missingKeys: string[] } => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingKeys: string[] = [];

  requiredKeys.forEach(key => {
    if (!firebaseConfig[key as keyof FirebaseConfig]) {
      missingKeys.push(`VITE_FIREBASE_${key.toUpperCase()}`);
    }
  });

  return {
    isValid: missingKeys.length === 0,
    missingKeys
  };
};
