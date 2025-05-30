import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Función para asegurar que el perfil existe en Firestore
async function ensureUserProfile(user: User) {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName || "",
      email: user.email,
      photoURL: user.photoURL || "",
      followers: [],
      following: [],
      // Otros campos por defecto si quieres
    });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function register(
    email: string,
    password: string,
    displayName: string,
  ) {
    try {
      if (!auth) {
        throw new Error(
          "Firebase authentication is not initialized. Check your Firebase configuration.",
        );
      }
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      // Update the user's profile with the display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        await ensureUserProfile(userCredential.user);
      }
      return userCredential.user;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      if (!auth) {
        throw new Error(
          "Firebase authentication is not initialized. Check your Firebase configuration.",
        );
      }
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (userCredential.user) {
        await ensureUserProfile(userCredential.user);
      }
      return userCredential.user;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  async function logout() {
    try {
      if (!auth) {
        throw new Error(
          "Firebase authentication is not initialized. Check your Firebase configuration.",
        );
      }
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      if (!auth) {
        throw new Error(
          "Firebase authentication is not initialized. Check your Firebase configuration.",
        );
      }
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  }

  useEffect(() => {
    let unsubscribe = () => {};

    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          await ensureUserProfile(user);
        }
        setLoading(false);
      });
    } else {
      // If auth is not initialized, just set loading to false
      setLoading(false);
    }

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
