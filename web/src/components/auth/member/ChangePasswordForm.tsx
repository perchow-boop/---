"use client";

import { useState } from "react";
import { changePassword } from "@/lib/auth-api";

type ChangePasswordFormProps = {
  token: string;
};

export function ChangePasswordForm({ token }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 8) {
      setError("新密碼至少需要 8 個字元");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("兩次輸入的新密碼不一致");
      return;
    }

    setSaving(true);

    try {
      const data = await changePassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新密碼失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-4 rounded-xl border border-black/10 bg-surface p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="current-password"
          className="mb-1 block text-sm font-medium text-text"
        >
          目前密碼
        </label>
        <input
          id="current-password"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label
          htmlFor="new-password"
          className="mb-1 block text-sm font-medium text-text"
        >
          新密碼
        </label>
        <input
          id="new-password"
          type="password"
          required
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="mb-1 block text-sm font-medium text-text"
        >
          確認新密碼
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
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
        disabled={saving}
        className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-contrast disabled:opacity-50"
      >
        {saving ? "更新中…" : "更新密碼"}
      </button>
    </form>
  );
}
