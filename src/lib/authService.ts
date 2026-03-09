import {
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import { app } from '@/lib/firebase';

export type AuthUser = FirebaseUser;

let auth: Auth | null = null;
if (app) {
  auth = getAuth(app);
}

function getAuthOrThrow(): Auth {
  if (!auth) {
    throw new Error('Firebase app not initialized. Check environment variables (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID).');
  }
  return auth;
}

export function onAuthChange(callback: (user: AuthUser | null) => void) {
  return onAuthStateChanged(getAuthOrThrow(), callback);
}

export async function signInWithGoogle(idToken: string): Promise<AuthUser> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(getAuthOrThrow(), credential);
  if (!result.user) {
    throw new Error('Sign-in failed: No user returned from Firebase.');
  }
  return result.user;
}

export async function signInWithGooglePopup(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');

  const result = await signInWithPopup(getAuthOrThrow(), provider);
  if (!result.user) {
    throw new Error('Sign-in failed: No user returned from Firebase.');
  }
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getAuthOrThrow());
}

export async function updateUserEmail(newEmail: string): Promise<void> {
  const a = getAuthOrThrow();
  if (!a.currentUser) {
    throw new Error('Authentication error: No user is currently signed in.');
  }
  await updateEmail(a.currentUser, newEmail);
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  const a = getAuthOrThrow();
  if (!a.currentUser) {
    throw new Error('Authentication error: No user is currently signed in.');
  }
  await updatePassword(a.currentUser, newPassword);
}

export async function sendPasswordReset(email: string, redirectUrl?: string): Promise<void> {
  const actionCodeSettings = redirectUrl ? { url: redirectUrl } : undefined;
  await sendPasswordResetEmail(getAuthOrThrow(), email, actionCodeSettings);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const result = await signInWithEmailAndPassword(getAuthOrThrow(), email, password);
  if (!result.user) {
    throw new Error('Sign-in failed: No user returned from Firebase.');
  }
  return result.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthUser> {
  const result = await createUserWithEmailAndPassword(getAuthOrThrow(), email, password);
  if (!result.user) {
    throw new Error('Sign-up failed: No user returned from Firebase.');
  }
  return result.user;
}
