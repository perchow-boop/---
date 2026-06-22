"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@/lib/auth-api";
import { fetchProfile, logoutUser } from "@/lib/auth-api";
import {
  clearMemberSession,
  MEMBER_TOKEN_KEY,
  MEMBER_USER_KEY,
  readMemberToken,
} from "@/lib/session";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = readMemberToken();
      const storedUser = localStorage.getItem(MEMBER_USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as User);
      } else {
        clearMemberSession();
      }
    } catch {
      clearMemberSession();
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    if (!newToken?.trim()) {
      return;
    }

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(MEMBER_TOKEN_KEY, newToken);
    localStorage.setItem(MEMBER_USER_KEY, JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    const activeToken = token ?? readMemberToken();

    setToken(null);
    setUser(null);
    clearMemberSession();

    if (activeToken) {
      try {
        await logoutUser(activeToken);
      } catch {
        // 即使 API 失敗，本地 session 已清除
      }
    }
  }, [token]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const data = await fetchProfile(token);
    setUser(data.user);
    localStorage.setItem(MEMBER_USER_KEY, JSON.stringify(data.user));
  }, [token]);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, refreshProfile }),
    [user, token, loading, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
