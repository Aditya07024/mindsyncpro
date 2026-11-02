import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface MobileMappedUser {
  id: string;
  uid: string;
  fullName: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  photoURL: string;
  email: string;
  primaryEmailAddress?: { emailAddress: string };
  emailAddresses: Array<{ emailAddress: string }>;
  reload: () => Promise<void>;
}

export interface MobileAuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user: MobileMappedUser | null;
  firebaseUser: FirebaseUser | null;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<FirebaseUser>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const MobileAuthContext = createContext<MobileAuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const mappedUser: MobileMappedUser | null = useMemo(() => {
    if (!firebaseUser) return null;

    const email = firebaseUser.email || '';
    const displayName = firebaseUser.displayName || email.split('@')[0] || 'User';
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ');

    return {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      fullName: displayName,
      firstName,
      lastName,
      imageUrl: firebaseUser.photoURL || '',
      photoURL: firebaseUser.photoURL || '',
      email,
      primaryEmailAddress: email ? { emailAddress: email } : undefined,
      emailAddresses: email ? [{ emailAddress: email }] : [],
      reload: async () => {
        await firebaseUser.reload();
        setFirebaseUser({ ...auth.currentUser! });
      },
    };
  }, [firebaseUser]);

  const getToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken();
    } catch (err) {
      console.warn('Failed to get Firebase ID token:', err);
      return null;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Failed to sign out:', err);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return res.user;
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name) {
      await updateProfile(res.user, { displayName: name.trim() });
    }
    return res.user;
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const value: MobileAuthContextType = {
    isLoaded,
    isSignedIn: !!firebaseUser,
    userId: firebaseUser ? firebaseUser.uid : null,
    user: mappedUser,
    firebaseUser,
    getToken,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
  };

  return <MobileAuthContext.Provider value={value}>{children}</MobileAuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(MobileAuthContext);
  if (!ctx) {
    return {
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      getToken: async () => null,
      signOut: async () => {},
      signInWithEmail: async () => { throw new Error('AuthContext not mounted'); },
      signUpWithEmail: async () => { throw new Error('AuthContext not mounted'); },
      sendPasswordReset: async () => {},
    };
  }
  return ctx;
}

export function useUser() {
  const ctx = useContext(MobileAuthContext);
  return {
    isLoaded: ctx?.isLoaded ?? true,
    isSignedIn: ctx?.isSignedIn ?? false,
    user: ctx?.user ?? null,
  };
}

export function useClerk() {
  const ctx = useContext(MobileAuthContext);
  return {
    signOut: ctx?.signOut || (async () => {}),
  };
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return null;
  return <>{children}</>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded || isSignedIn) return null;
  return <>{children}</>;
}
