"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginUser, registerUser } from "@/lib/auth-api";
import { useAuth } from "@/context/AuthContext";

export function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await registerUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email,
        password,
        phone,
      });

      if (data.token && data.user) {
        login(data.token, data.user);
      } else {
        const loginData = await loginUser({ email, password });
        login(loginData.token, loginData.user);
      }

      setSuccess(data.message);
      router.replace("/profile");
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
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-text">
            名字
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="名字"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-text">
            姓氏
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="姓氏（選填）"
          />
        </div>
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
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-text">
            電話（選填）
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="91234567"
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            placeholder="至少 8 個字元"
          />
        </div>
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-700" role="status">
            {success}，已自動登入，正在前往會員中心…
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-accent-contrast disabled:opacity-50"
        >
          {loading ? "註冊中…" : "註冊"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        已有帳戶？{" "}
        <Link href="/login" className="font-semibold text-text hover:underline">
          會員登入
        </Link>
      </p>
    </>
  );
}
