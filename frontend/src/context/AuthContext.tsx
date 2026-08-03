import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, tokenStorage } from "../lib/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Returns the success message from the server (user must verify before login). */
  register: (email: string, password: string) => Promise<string>;
  /** Issues tokens and sets user in context. Throws on bad credentials or unverified email. */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from stored token on mount
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ data }) => setUser(data))
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
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
