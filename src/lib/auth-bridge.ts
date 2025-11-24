import { auth as firebaseAuth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail
} from "firebase/auth";

interface AuthBridgeResult {
  error: Error | null;
  data?: any;
}

interface BridgedUser {
  id: string;
  email: string;
  provider: 'firebase';
  originalUser: FirebaseUser;
}

class AuthBridge {
  private firebaseOnly = true;

  async signIn(email: string, password: string): Promise<AuthBridgeResult> {
    try {
      if (!firebaseAuth) {
        throw new Error('Firebase Auth not configured');
      }

      const firebaseResult = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('Firebase sign in successful:', firebaseResult.user.email);

      return { error: null, data: firebaseResult };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async signUp(email: string, password: string): Promise<AuthBridgeResult> {
    try {
      if (!firebaseAuth) {
        throw new Error('Firebase Auth not configured');
      }

      const firebaseResult = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      console.log('Firebase user created:', firebaseResult.user.email);

      return { error: null, data: firebaseResult };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async signOut(): Promise<AuthBridgeResult> {
    try {
      if (!firebaseAuth) {
        throw new Error('Firebase Auth not configured');
      }

      await firebaseSignOut(firebaseAuth);
      console.log('Firebase sign out successful');

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async resetPassword(email: string, redirectTo?: string): Promise<AuthBridgeResult> {
    try {
      if (!firebaseAuth) {
        throw new Error('Firebase Auth not configured');
      }

      await sendPasswordResetEmail(firebaseAuth, email, {
        url: redirectTo || window.location.origin
      });
      console.log('Firebase password reset email sent');

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updateUser(attributes: { password?: string; email?: string; data?: object }): Promise<AuthBridgeResult> {
    try {
      if (!firebaseAuth || !firebaseAuth.currentUser) {
        throw new Error('Firebase Auth not configured or no current user');
      }

      if (attributes.password) {
        await updatePassword(firebaseAuth.currentUser, attributes.password);
        console.log('Firebase password updated');
      }

      if (attributes.email) {
        await updateEmail(firebaseAuth.currentUser, attributes.email);
        console.log('Firebase email updated');
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  getCurrentUser(): BridgedUser | null {
    if (firebaseAuth?.currentUser) {
      return {
        id: firebaseAuth.currentUser.uid,
        email: firebaseAuth.currentUser.email || '',
        provider: 'firebase',
        originalUser: firebaseAuth.currentUser
      };
    }

    return null;
  }

  onAuthStateChange(callback: (user: BridgedUser | null) => void) {
    if (!firebaseAuth) {
      console.warn('Firebase Auth not configured');
      return () => {};
    }

    const firebaseUnsub = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        callback({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          provider: 'firebase',
          originalUser: firebaseUser
        });
      } else {
        callback(null);
      }
    });

    return firebaseUnsub;
  }

  enableFirebase(): boolean {
    this.firebaseOnly = true;
    console.info('[auth-bridge] Firebase auth is now active.');
    return this.firebaseOnly;
  }

  disableFirebase(): boolean {
    console.warn('[auth-bridge] Supabase auth has been removed. disableFirebase is a no-op.');
    this.firebaseOnly = true;
    return this.firebaseOnly;
  }

  isUsingFirebase(): boolean {
    return this.firebaseOnly && !!firebaseAuth;
  }
}

export const authBridge = new AuthBridge();

// Check if Firebase Auth is available
export const isFirebaseAuthAvailable = () => {
  return !!firebaseAuth;
};

export const enableFirebaseAuth = () => authBridge.enableFirebase();
export const disableFirebaseAuth = () => authBridge.disableFirebase();
export const isUsingFirebaseAuth = () => authBridge.isUsingFirebase();
