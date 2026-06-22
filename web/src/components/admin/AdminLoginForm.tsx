"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginAdmin } from "@/lib/admin-api";
import { useAdminAuth } from "@/context/AdminAuthContext";

export function AdminLoginForm() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginAdmin({ username, password });
      login(data.token, data.admin);
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗");
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
        <div>
          <label
            htmlFor="admin-username"
            className="mb-1 block text-sm font-medium text-text"
          >
            管理員帳號
          </label>
          <input
            id="admin-username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="admin"
          />
        </div>
        <div>
          <label
            htmlFor="admin-password"
            className="mb-1 block text-sm font-medium text-text"
          >
            密碼
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="管理員密碼"
          />
        </div>
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-accent-contrast disabled:opacity-50"
        >
          {loading ? "登入中…" : "管理員登入"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        還沒有帳號？{" "}
        <Link href="/admin/register" className="font-semibold text-text hover:underline">
          管理員註冊
        </Link>
        <span className="mx-2">·</span>
        <Link href="/" className="font-semibold text-text hover:underline">
          返回首頁
        </Link>
      </p>
    </>
  );
}
