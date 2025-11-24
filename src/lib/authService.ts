
import {
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { app } from '@/lib/firebase'; // Assuming firebase.ts exports the initialized app

export type AuthUser = FirebaseUser;

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
  const { updateEmail } = await import('firebase/auth');
  await updateEmail(auth.currentUser, newEmail);
}

/**
 * Updates the current user's password.
 * @param newPassword - The new password.
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Authentication error: No user is currently signed in.');
  }
  const { updatePassword } = await import('firebase/auth');
  await updatePassword(auth.currentUser, newPassword);
}

/**
 * Sends a password reset email to the given email address.
 * @param email - The user's email address.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const { sendPasswordResetEmail } = await import('firebase/auth');
  await sendPasswordResetEmail(auth, email);
}

/**
 * Signs in a user with email and password.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns The signed-in user.
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const result = await signInWithEmailAndPassword(auth, email, password);
  if (!result.user) {
    throw new Error('Sign-in failed: No user returned from Firebase.');
  }
  return result.user;
}

/**
 * Signs up a new user with email and password.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns The newly created user.
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthUser> {
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (!result.user) {
    throw new Error('Sign-up failed: No user returned from Firebase.');
  }
  return result.user;
}
