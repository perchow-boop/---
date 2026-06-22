"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { loginUser } from "@/lib/auth-api";
import { useAuth } from "@/context/AuthContext";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginUser({ email, password });
      login(data.token, data.user);
      router.replace(redirectTo.startsWith("/") ? redirectTo : "/");
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
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-text">
            電郵
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-text">
            密碼
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="你的密碼"
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
          {loading ? "登入中…" : "登入"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        還沒有帳戶？{" "}
        <Link href="/register" className="font-semibold text-text hover:underline">
          會員註冊
        </Link>
      </p>
    </>
  );
}
