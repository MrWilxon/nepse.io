"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "premium" | "enterprise";
  joinedAt: string;
  watchlists: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfile: () => {},
});

const AUTH_STORAGE_KEY = "nepse_auth";

function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(loadUser());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: email.split("@")[0],
      email,
      plan: "free",
      joinedAt: new Date().toISOString(),
      watchlists: [],
    };
    setUser(newUser);
    saveUser(newUser);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: "Google User",
      email: "user@gmail.com",
      plan: "free",
      joinedAt: new Date().toISOString(),
      watchlists: [],
    };
    setUser(newUser);
    saveUser(newUser);
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      plan: "free",
      joinedAt: new Date().toISOString(),
      watchlists: [],
    };
    setUser(newUser);
    saveUser(newUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      saveUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
