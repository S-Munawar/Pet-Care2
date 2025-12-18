"use client";

import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "@/lib/firebase";
import type { Role, RoleStatus } from "@repo/shared";
import { getUser } from "@/api/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  role: Role | null;
  roleStatus: RoleStatus | null;
  requestedRole: Role | null;
  isRegistered: boolean;
  hasPendingRequest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshUserData: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [roleStatus, setRoleStatus] = useState<RoleStatus | null>(null);
  const [requestedRole, setRequestedRole] = useState<Role | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const googleProvider = new GoogleAuthProvider();

  /**
   * Fetch user data from backend (source of truth for role state).
   * This reads from MongoDB, not Firebase claims.
   */
  const fetchUserData = useCallback(async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const userData = await getUser(token);

      if (userData.registered) {
        setRole(userData.role as Role);
        setRoleStatus(userData.roleStatus as RoleStatus);
        setRequestedRole((userData.requestedRole as Role) || null);
        setIsRegistered(true);
        setHasPendingRequest(userData.hasPendingRequest);
      } else {
        // User authenticated but not registered in our system
        setRole(null);
        setRoleStatus(null);
        setRequestedRole(null);
        setIsRegistered(false);
        setHasPendingRequest(false);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // Reset state on error
      setRole(null);
      setRoleStatus(null);
      setRequestedRole(null);
      setIsRegistered(false);
      setHasPendingRequest(false);
    }
  }, []);

  /**
   * Public method to refresh user data.
   * Call this after role changes to get updated state.
   */
  const refreshUserData = useCallback(async () => {
    if (user) {
      // Force token refresh to get updated claims
      await user.getIdToken(true);
      await fetchUserData(user);
    }
  }, [user, fetchUserData]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        // User logged out - clear all state
        setRole(null);
        setRoleStatus(null);
        setRequestedRole(null);
        setIsRegistered(false);
        setHasPendingRequest(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [fetchUserData]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    // State will be cleared by onAuthStateChanged listener
  };

  const getToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        roleStatus,
        requestedRole,
        isRegistered,
        hasPendingRequest,
        login,
        register,
        logout,
        getToken,
        loginWithGoogle,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
