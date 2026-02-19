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
} from 'firebase/auth';
import { app } from '@/lib/firebase';

export type AuthUser = FirebaseUser;

if (!app) {
  throw new Error('Firebase app not initialized. Check environment variables (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID).');
}
const auth = getAuth(app);

/**
 * Listens for changes to the user's authentication state.
 * @param callback - A function to call with the user object when the state changes.
 * @returns An unsubscribe function.
 */
export function onAuthChange(callback: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Signs in the user with a Google credential.
 * @param idToken - The ID token from the Google Sign-In response.
 * @returns The signed-in user.
 */
export async function signInWithGoogle(idToken: string): Promise<AuthUser> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  if (!result.user) {
    throw new Error('Sign-in failed: No user returned from Firebase.');
  }
  return result.user;
}

/**
 * Signs in the user with Google using Firebase popup.
 * This is the recommended method as it's simpler and more reliable.
 * @returns The signed-in user.
 */
export async function signInWithGooglePopup(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  // Optional: Add custom parameters or scopes
  provider.addScope('profile');
  provider.addScope('email');

  const result = await signInWithPopup(auth, provider);
  if (!result.user) {
    throw new Error('Sign-in failed: No user returned from Firebase.');
  }
  return result.user;
}

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Updates the current user's email address.
 * @param newEmail - The new email address.
 */
export async function updateUserEmail(newEmail: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Authentication error: No user is currently signed in.');
  }
  await updateEmail(auth.currentUser, newEmail);
}

/**
 * Updates the current user's password.
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Authentication error: No user is currently signed in.');
  }
  await updatePassword(auth.currentUser, newPassword);
}

/**
 * Sends a password reset email to the given email address.
 */
export async function sendPasswordReset(email: string, redirectUrl?: string): Promise<void> {
  const actionCodeSettings = redirectUrl ? { url: redirectUrl } : undefined;
  await sendPasswordResetEmail(auth, email, actionCodeSettings);
}

/**
 * Signs in a user with email and password.
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  if (!result.user) {
    throw new Error('Sign-in failed: No user returned from Firebase.');
  }
  return result.user;
}

/**
 * Signs up a new user with email and password.
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthUser> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (!result.user) {
    throw new Error('Sign-up failed: No user returned from Firebase.');
  }
  return result.user;
}
