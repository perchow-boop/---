"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Admin } from "@/lib/admin-api";
import { fetchAdminProfile, logoutAdmin } from "@/lib/admin-api";
import {
  ADMIN_KEY,
  ADMIN_TOKEN_KEY,
  clearAdminSession,
} from "@/lib/session";

type AdminAuthContextValue = {
  admin: Admin | null;
  token: string | null;
  loading: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      const storedAdmin = localStorage.getItem(ADMIN_KEY);
      if (storedToken && storedAdmin) {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin) as Admin);
      }
    } catch {
      clearAdminSession();
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken: string, newAdmin: Admin) => {
    setToken(newToken);
    setAdmin(newAdmin);
    localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(newAdmin));
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await logoutAdmin(token);
      } catch {
        // 即使 API 失敗也清除本地狀態
      }
    }
    setToken(null);
    setAdmin(null);
    clearAdminSession();
  }, [token]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const data = await fetchAdminProfile(token);
    setAdmin(data.admin);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
  }, [token]);

  const value = useMemo(
    () => ({ admin, token, loading, login, logout, refreshProfile }),
    [admin, token, loading, login, logout, refreshProfile],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
