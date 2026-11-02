import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export interface MappedUser {
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
  update: (data: { fullName?: string }) => Promise<void>;
}

export interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user: MappedUser | null;
  firebaseUser: FirebaseUser | null;
  getToken: (options?: { skipCache?: boolean }) => Promise<string | null>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<FirebaseUser>;
  signInWithEmail: (email: string, pass: string) => Promise<FirebaseUser>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<FirebaseUser>;
  sendPasswordReset: (email: string) => Promise<void>;
  openUserProfile?: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const mappedUser: MappedUser | null = useMemo(() => {
    if (!firebaseUser) return null;

    const email = firebaseUser.email || "";
    const displayName = firebaseUser.displayName || email.split("@")[0] || "User";
    const nameParts = displayName.trim().split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ");

    return {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      fullName: displayName,
      firstName,
      lastName,
      imageUrl: firebaseUser.photoURL || "",
      photoURL: firebaseUser.photoURL || "",
      email,
      primaryEmailAddress: email ? { emailAddress: email } : undefined,
      emailAddresses: email ? [{ emailAddress: email }] : [],
      reload: async () => {
        await firebaseUser.reload();
        setFirebaseUser({ ...auth.currentUser! });
      },
      update: async (data: { fullName?: string }) => {
        if (data.fullName && auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: data.fullName });
          setFirebaseUser({ ...auth.currentUser });
        }
      },
    };
  }, [firebaseUser]);

  const getToken = async (options?: { skipCache?: boolean }) => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken(options?.skipCache);
    } catch (err) {
      console.warn("Failed to get Firebase ID token:", err);
      return null;
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const signInWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(res.user, { displayName: name });
    }
    return res.user;
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value: AuthContextType = {
    isLoaded,
    isSignedIn: !!firebaseUser,
    userId: firebaseUser ? firebaseUser.uid : null,
    user: mappedUser,
    firebaseUser,
    getToken,
    signOut,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      getToken: async () => null,
      signOut: async () => {},
    };
  }
  return {
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
    userId: ctx.userId,
    getToken: ctx.getToken,
    signOut: ctx.signOut,
    signInWithGoogle: ctx.signInWithGoogle,
    signInWithEmail: ctx.signInWithEmail,
    signUpWithEmail: ctx.signUpWithEmail,
    sendPasswordReset: ctx.sendPasswordReset,
  };
}

export function useUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
    };
  }
  return {
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
    user: ctx.user,
  };
}

export function useClerk() {
  const ctx = useContext(AuthContext);
  return {
    signOut: ctx?.signOut || (async () => {}),
    openUserProfile: () => {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    },
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

export function SignInButton({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href="/sign-in"
      className={
        className ||
        "inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      }
    >
      {children || "Sign In"}
    </a>
  );
}

export function UserButton() {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) return null;

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        onClick={() => signOut()}
        title={`Sign out (${user.fullName})`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white shadow hover:opacity-90 overflow-hidden"
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt={user.fullName} className="h-full w-full object-cover" />
        ) : (
          user.firstName.charAt(0).toUpperCase()
        )}
      </button>
    </div>
  );
}
