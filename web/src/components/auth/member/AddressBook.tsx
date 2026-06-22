"use client";

import { useEffect, useState } from "react";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
  type User,
  type UserAddress,
} from "@/lib/auth-api";
import { formatPhoneForInput, getDialCode, toE164Phone } from "@/lib/phone";
import {
  getDistrictOptions,
  getShippingCountryLabel,
  STRIPE_SHIPPING_COUNTRIES,
} from "@/lib/shipping";

type AddressBookProps = {
  user: User;
  token: string;
  onUpdated: () => Promise<void>;
};

type AddressFormState = {
  recipient_name: string;
  phone: string;
  country: string;
  city: string;
  street_address: string;
  postal_code: string;
  is_default: boolean;
};

const EMPTY_FORM: AddressFormState = {
  recipient_name: "",
  phone: "",
  country: "HK",
  city: "",
  street_address: "",
  postal_code: "",
  is_default: false,
};

function toFormState(address: UserAddress): AddressFormState {
  return {
    recipient_name: address.recipient_name || "",
    phone: formatPhoneForInput(address.phone, address.country || "HK"),
    country: address.country || "HK",
    city: address.city || "",
    street_address: address.street_address || "",
    postal_code: address.postal_code || "",
    is_default: address.is_default,
  };
}

export function AddressBook({ user, token, onUpdated }: AddressBookProps) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingId === null) {
      setForm(EMPTY_FORM);
    }
  }, [editingId]);

  function startCreate() {
    setEditingId("new");
    setForm({
      ...EMPTY_FORM,
      is_default: user.addresses.length === 0,
    });
    setMessage(null);
    setError(null);
  }

  function startEdit(address: UserAddress) {
    setEditingId(address.address_id);
    setForm(toFormState(address));
    setMessage(null);
    setError(null);
  }

  function handleCountryChange(nextCountry: string) {
    const normalized = toE164Phone(form.phone, form.country);
    setForm((current) => ({
      ...current,
      country: nextCountry,
      city: "",
      phone: formatPhoneForInput(normalized, nextCountry),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      recipient_name: form.recipient_name.trim(),
      phone: toE164Phone(form.phone, form.country) || undefined,
      country: form.country,
      city: form.city.trim(),
      street_address: form.street_address.trim(),
      postal_code: form.postal_code.trim() || undefined,
      is_default: form.is_default,
    };

    try {
      const data =
        editingId === "new"
          ? await createAddress(token, payload)
          : await updateAddress(token, editingId, payload);

      setMessage(data.message);
      setEditingId(null);
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存地址失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(addressId: number) {
    if (!window.confirm("確定要刪除此地址嗎？")) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const data = await deleteAddress(token, addressId);
      setMessage(data.message);
      if (editingId === addressId) {
        setEditingId(null);
      }
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除地址失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(addressId: number) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const data = await setDefaultAddress(token, addressId);
      setMessage(data.message);
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "設定預設地址失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
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

      {user.addresses.length === 0 && editingId === null ? (
        <div className="rounded-xl border border-black/10 bg-surface p-8 text-center text-sm text-muted shadow-sm">
          尚未新增地址。請新增你的配送地址。
        </div>
      ) : (
        <ul className="space-y-3">
          {user.addresses.map((address) => (
            <li
              key={address.address_id}
              className="rounded-xl border border-black/10 bg-surface p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text">
                      {address.recipient_name || "未命名收件人"}
                    </p>
                    {address.is_default && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                        預設
                      </span>
                    )}
                  </div>
                  {address.phone && (
                    <p className="text-muted">{address.phone}</p>
                  )}
                  <p className="whitespace-normal break-words text-text">
                    {address.street_address}
                  </p>
                  <p className="text-muted">
                    {[
                      address.city,
                      getShippingCountryLabel(address.country),
                      address.postal_code,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!address.is_default && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSetDefault(address.address_id)}
                      className="cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-bg disabled:opacity-50"
                    >
                      設為預設
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => startEdit(address)}
                    className="cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-bg disabled:opacity-50"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleDelete(address.address_id)}
                    className="cursor-pointer rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingId !== null ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-black/10 bg-surface p-6 shadow-sm"
        >
          <h2 className="text-base font-semibold text-text">
            {editingId === "new" ? "新增地址" : "編輯地址"}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              收件人
            </label>
            <input
              type="text"
              required
              value={form.recipient_name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  recipient_name: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              電話
            </label>
            <div className="flex overflow-hidden rounded-lg border border-black/10 focus-within:border-accent">
              <span className="flex items-center border-r border-black/10 bg-bg px-3 text-sm text-muted">
                +{getDialCode(form.country)}
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value.replace(/[^\d]/g, ""),
                  }))
                }
                className="w-full px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              國家／地區
            </label>
            <select
              value={form.country}
              onChange={(event) => handleCountryChange(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              {STRIPE_SHIPPING_COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              地區
            </label>
            <select
              required
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
              }
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="">請選擇地區</option>
              {getDistrictOptions(form.country).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              地址
            </label>
            <input
              type="text"
              required
              value={form.street_address}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  street_address: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
              placeholder="街道、大廈、室號"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              郵遞區號（選填）
            </label>
            <input
              type="text"
              value={form.postal_code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  postal_code: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  is_default: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-black/20"
            />
            設為預設地址
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-contrast disabled:opacity-50"
            >
              {saving ? "儲存中…" : "儲存地址"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setEditingId(null)}
              className="rounded-lg border border-black/10 px-6 py-2.5 text-sm font-medium hover:bg-bg disabled:opacity-50"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={startCreate}
          className="cursor-pointer rounded-lg border border-black/10 bg-surface px-5 py-3 text-sm font-medium shadow-sm hover:bg-bg"
        >
          + 新增地址
        </button>
      )}
    </div>
  );
}
