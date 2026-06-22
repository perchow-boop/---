"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { registerAdmin } from "@/lib/admin-api";
import type { Admin } from "@/lib/admin-api";
import { useAdminAuth } from "@/context/AdminAuthContext";

const ROLES: Admin["role"][] = ["superadmin", "manager", "staff"];

export function AdminRegisterForm() {
  const router = useRouter();
  const { admin, token } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Admin["role"]>("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isBootstrap, setIsBootstrap] = useState(false);

  useEffect(() => {
    setIsBootstrap(!token);
  }, [token]);

  const availableRoles: Admin["role"][] =
    admin?.role === "superadmin"
      ? ROLES
      : admin?.role === "manager"
        ? ["staff"]
        : isBootstrap
          ? ["superadmin"]
          : [];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const data = await registerAdmin(
        {
          username,
          password,
          email: email.trim() || undefined,
          role: isBootstrap ? undefined : role,
        },
        token ?? undefined,
      );
      setMessage(data.message);
      setUsername("");
      setEmail("");
      setPassword("");

      if (isBootstrap) {
        setTimeout(() => router.push("/admin/login"), 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "註冊失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-xl bg-surface p-6 shadow-sm"
      >
        {isBootstrap && (
          <p className="rounded-lg bg-bg px-4 py-3 text-sm text-muted">
            系統尚無管理員，請建立第一個 superadmin 帳號。
          </p>
        )}

        <div>
          <label
            htmlFor="register-username"
            className="mb-1 block text-sm font-medium text-text"
          >
            帳號
          </label>
          <input
            id="register-username"
            type="text"
            required
            minLength={3}
            maxLength={50}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="admin"
          />
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="mb-1 block text-sm font-medium text-text"
          >
            電郵（選填）
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="admin@lukibou.com"
          />
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="mb-1 block text-sm font-medium text-text"
          >
            密碼
          </label>
          <input
            id="register-password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="至少 8 個字元"
          />
        </div>

        {!isBootstrap && availableRoles.length > 0 && (
          <div>
            <label
              htmlFor="register-role"
              className="mb-1 block text-sm font-medium text-text"
            >
              角色
            </label>
            <select
              id="register-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Admin["role"])}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              {availableRoles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-green-700" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-accent-contrast disabled:opacity-50"
        >
          {loading ? "註冊中…" : "註冊管理員"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        已有帳號？{" "}
        <Link href="/admin/login" className="font-semibold text-text hover:underline">
          管理員登入
        </Link>
      </p>
    </>
  );
}
