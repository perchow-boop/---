"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  deleteAdmin,
  emptyAdminForm,
  fetchAdmins,
  registerAdmin,
  updateAdmin,
  type Admin,
  type AdminFormData,
} from "@/lib/admin-api";

const ROLES: Admin["role"][] = ["superadmin", "manager", "staff"];

function toFormData(admin: Admin): AdminFormData {
  return {
    username: admin.username,
    email: admin.email || "",
    password: "",
    role: admin.role,
  };
}

export function AdminManagePage() {
  const router = useRouter();
  const { admin, token, loading: authLoading, logout } = useAdminAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [form, setForm] = useState<AdminFormData>(emptyAdminForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isSuperadmin = admin?.role === "superadmin";

  const loadAdmins = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdmins(token);
      setAdmins(data.admins);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/admin/login");
      return;
    }

    if (!authLoading && admin && admin.role !== "superadmin") {
      router.replace("/admin/products");
    }
  }, [authLoading, token, admin, router]);

  useEffect(() => {
    if (token && isSuperadmin) {
      loadAdmins();
    }
  }, [loadAdmins, token, isSuperadmin]);

  function resetForm() {
    setForm(emptyAdminForm);
    setEditingId(null);
  }

  function handleEdit(item: Admin) {
    setEditingId(item.admin_id);
    setForm(toFormData(item));
    setMessage(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (editingId) {
        const data = await updateAdmin(token, editingId, {
          email: form.email.trim() || null,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });
        setMessage(data.message);
      } else {
        if (!form.password) {
          setError("新增管理員時請填寫密碼");
          return;
        }

        const data = await registerAdmin(
          {
            username: form.username.trim(),
            email: form.email.trim() || undefined,
            password: form.password,
            role: form.role,
          },
          token,
        );
        setMessage(data.message);
      }

      resetForm();
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, username: string) {
    if (!token) return;
    if (!window.confirm(`確定要刪除管理員「${username}」？`)) return;

    setError(null);
    setMessage(null);

    try {
      const data = await deleteAdmin(token, id);
      setMessage(data.message);
      if (editingId === id) resetForm();
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  }

  if (authLoading || !isSuperadmin) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center text-muted">
        載入中…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <Link href="/" className="hover:underline">
              首頁
            </Link>
            <span className="mx-2">/</span>
            <Link href="/admin/products" className="hover:underline">
              商品管理
            </Link>
            <span className="mx-2">/</span>
            <span>管理員管理</span>
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-text">
            管理員 CRUD
          </h1>
          <p className="mt-2 text-sm text-muted">
            管理 admins 資料表（僅 superadmin 可存取）
          </p>
          {admin && (
            <p className="mt-1 text-sm text-muted">
              已登入：{admin.username}（{admin.role}）
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin/products"
            className="text-sm font-medium text-text hover:underline"
          >
            商品管理 →
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace("/admin/login");
            }}
            className="cursor-pointer text-sm font-medium text-muted hover:text-text hover:underline"
          >
            管理員登出
          </button>
        </div>
      </div>

      <section className="mb-10 rounded-xl bg-surface p-6 shadow-sm">
        <h2 className="font-serif text-xl font-semibold text-text">
          {editingId ? `編輯管理員 #${editingId}` : "新增管理員"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">帳號 *</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={50}
              disabled={!!editingId}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent disabled:bg-bg disabled:text-muted"
              placeholder="staff01"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">角色 *</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Admin["role"] })
              }
              disabled={editingId === admin?.admin_id}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent disabled:bg-bg disabled:text-muted"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">電郵</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
              placeholder="admin@lukibou.com"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              密碼 {editingId ? "（留空則不變更）" : "*"}
            </label>
            <input
              type="password"
              required={!editingId}
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
              placeholder={editingId ? "不變更請留空" : "至少 8 個字元"}
            />
          </div>
          {error && (
            <p className="md:col-span-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="md:col-span-2 text-sm text-green-700" role="status">
              {message}
            </p>
          )}
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-contrast disabled:opacity-50"
            >
              {saving ? "儲存中…" : editingId ? "更新管理員" : "新增管理員"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-black/15 px-5 py-2.5 text-sm font-medium text-text hover:bg-black/5"
              >
                取消編輯
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl bg-surface shadow-sm">
        <div className="border-b border-black/5 px-6 py-4">
          <h2 className="font-serif text-xl font-semibold text-text">管理員列表</h2>
        </div>
        {loading ? (
          <p className="px-6 py-10 text-center text-muted">載入中…</p>
        ) : admins.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">尚無管理員。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-black/5 bg-bg/60 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">帳號</th>
                  <th className="px-4 py-3 font-medium">電郵</th>
                  <th className="px-4 py-3 font-medium">角色</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((item) => (
                  <tr
                    key={item.admin_id}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="px-4 py-3">{item.admin_id}</td>
                    <td className="px-4 py-3 font-medium text-text">
                      {item.username}
                      {item.admin_id === admin?.admin_id && (
                        <span className="ml-2 text-xs text-muted">（你）</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{item.email || "—"}</td>
                    <td className="px-4 py-3">{item.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          disabled={item.admin_id === admin?.admin_id}
                          onClick={() =>
                            handleDelete(item.admin_id, item.username)
                          }
                          className="cursor-pointer rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
