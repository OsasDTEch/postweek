import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, profileApi, tokenStorage } from "../lib/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True once the user has filled in at least their role/name in onboarding. */
  profileComplete: boolean;
  setProfileComplete: (v: boolean) => void;
  register: (email: string, password: string) => Promise<string>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function checkProfileComplete(): Promise<boolean> {
  try {
    const { data: profile } = await profileApi.get();
    return !!(profile.name || profile.role);
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(async ({ data }) => {
        setUser(data);
        const complete = await checkProfileComplete();
        setProfileComplete(complete);
      })
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<string> => {
    const { data } = await authApi.register(email, password);
    return data.message;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    tokenStorage.set(data.access_token, data.refresh_token);
    const { data: me } = await authApi.me();
    setUser(me);
    const complete = await checkProfileComplete();
    setProfileComplete(complete);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setProfileComplete(true);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profileComplete, setProfileComplete, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
