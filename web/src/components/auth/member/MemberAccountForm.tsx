"use client";

import { useEffect, useState } from "react";
import { updateProfile } from "@/lib/auth-api";
import { formatPhoneForInput, getDialCode, toE164Phone } from "@/lib/phone";
import type { User } from "@/lib/auth-api";

type MemberAccountFormProps = {
  user: User;
  token: string;
  onUpdated: () => Promise<void>;
};

export function MemberAccountForm({
  user,
  token,
  onUpdated,
}: MemberAccountFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(user.first_name);
    setLastName(user.last_name || "");
    setPhone(formatPhoneForInput(user.phone, "HK"));
  }, [user]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const data = await updateProfile(token, {
        first_name: firstName,
        last_name: lastName,
        phone: toE164Phone(phone, "HK") || undefined,
      });
      setMessage(data.message);
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 rounded-xl border border-black/10 bg-surface p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-text">
          會員編號
        </label>
        <input
          type="text"
          value={user.member_id || "—"}
          disabled
          className="w-full rounded-lg border border-black/10 bg-bg px-3 py-2.5 font-mono text-sm text-muted"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text">電郵</label>
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full rounded-lg border border-black/10 bg-bg px-3 py-2.5 text-sm text-muted"
        />
      </div>
      <div>
        <label
          htmlFor="member-first-name"
          className="mb-1 block text-sm font-medium text-text"
        >
          名字
        </label>
        <input
          id="member-first-name"
          type="text"
          required
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label
          htmlFor="member-last-name"
          className="mb-1 block text-sm font-medium text-text"
        >
          姓氏
        </label>
        <input
          id="member-last-name"
          type="text"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label
          htmlFor="member-phone"
          className="mb-1 block text-sm font-medium text-text"
        >
          電話
        </label>
        <div className="flex overflow-hidden rounded-lg border border-black/10 focus-within:border-accent">
          <span className="flex items-center border-r border-black/10 bg-bg px-3 text-sm text-muted">
            +{getDialCode("HK")}
          </span>
          <input
            id="member-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value.replace(/[^\d]/g, ""))
            }
            className="w-full px-3 py-2.5 text-sm outline-none"
            placeholder="91234567"
          />
        </div>
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
        {saving ? "儲存中…" : "儲存變更"}
      </button>
    </form>
  );
}
