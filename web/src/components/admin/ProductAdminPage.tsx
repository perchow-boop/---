"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from "@/lib/products-api";
import { formatPrice } from "@/lib/products";
import type { DbProduct, ProductFormData } from "@/types/db-product";
import { emptyProductForm, PRODUCT_CATEGORIES } from "@/types/db-product";
import { uploadProductImage } from "@/lib/upload-image";
import { AdminOrderList } from "@/components/admin/AdminOrderList";

function toFormData(product: DbProduct): ProductFormData {
  return {
    type_id: product.type_id || "",
    type: product.type || "",
    name: product.name,
    description: product.description || "",
    price: String(product.price),
    stock: String(product.stock),
    image_url: product.image_url || "",
  };
}

function getNextTypeId(products: DbProduct[]) {
  const maxId = products.reduce(
    (max, product) => Math.max(max, product.product_id),
    0,
  );
  return `LKB-${String(maxId + 1).padStart(3, "0")}`;
}

function createEmptyForm(products: DbProduct[]): ProductFormData {
  return {
    ...emptyProductForm,
    type_id: getNextTypeId(products),
  };
}

type AdminTab = "crud" | "list" | "orders";

const NAV_ITEMS: { id: AdminTab; label: string }[] = [
  { id: "crud", label: "商品 CRUD 管理" },
  { id: "list", label: "商品列表" },
  { id: "orders", label: "訂貨單" },
];

export function ProductAdminPage() {
  const router = useRouter();
  const { admin, token, loading: authLoading, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("crud");
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [form, setForm] = useState<ProductFormData>(emptyProductForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const canWriteProducts =
    admin?.role === "superadmin" || admin?.role === "manager";

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/admin/login");
    }
  }, [authLoading, token, router]);

  useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [loadProducts, token]);

  useEffect(() => {
    if (editingId !== null) return;

    setForm((current) => {
      if (current.name.trim()) return current;

      return {
        ...current,
        type_id: getNextTypeId(products),
      };
    });
  }, [products, editingId]);

  function resetForm() {
    setForm(createEmptyForm(products));
    setEditingId(null);
  }

  function handleEdit(product: DbProduct) {
    setEditingId(product.product_id);
    setForm(toFormData(product));
    setMessage(null);
    setError(null);
    setActiveTab("crud");
  }

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setUploadingImage(true);
    setError(null);

    try {
      const imagePath = await uploadProductImage(token, file);
      setForm((current) => ({ ...current, image_url: imagePath }));
      setMessage("圖片已上傳並填入路徑");
    } catch (err) {
      setError(err instanceof Error ? err.message : "圖片上傳失敗");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      type_id: form.type_id.trim() || null,
      type: form.type.trim() || null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      stock: Number(form.stock),
      image_url: form.image_url.trim() || null,
    };

    try {
      if (editingId) {
        const data = await updateProduct(token, editingId, payload);
        setMessage(data.message);
      } else {
        const data = await createProduct(token, payload);
        setMessage(data.message);
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!token) return;
    if (!window.confirm(`確定要刪除「${name}」？`)) return;

    setError(null);
    setMessage(null);

    try {
      const data = await deleteProduct(token, id);
      setMessage(data.message);
      if (editingId === id) resetForm();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center text-muted">
        載入中…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm text-muted">
        <Link href="/" className="hover:underline">
          首頁
        </Link>
        <span className="mx-2">/</span>
        <span>商品管理</span>
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-text">商品管理</h1>
      {admin && (
        <p className="mt-2 text-sm text-muted">
          已登入：{admin.username}（{admin.role}）
        </p>
      )}

      <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start">
        <aside className="w-full shrink-0 md:w-56">
          <nav
            className="rounded-xl bg-surface p-2 shadow-sm"
            aria-label="商品管理選單"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-contrast"
                      : "text-text hover:bg-bg"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            <div className="mt-2 border-t border-black/5 pt-2">
              {admin?.role === "superadmin" && (
                <Link
                  href="/admin/admins"
                  className="block rounded-lg px-4 py-3 text-sm text-muted transition-colors hover:bg-bg hover:text-text"
                >
                  管理員管理
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.replace("/admin/login");
                }}
                className="w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-muted transition-colors hover:bg-bg hover:text-text"
              >
                管理員登出
              </button>
              <Link
                href="/products"
                className="block rounded-lg px-4 py-3 text-sm text-muted transition-colors hover:bg-bg hover:text-text"
              >
                返回商店
              </Link>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {activeTab === "orders" ? (
            token ? (
              <AdminOrderList token={token} />
            ) : null
          ) : activeTab === "crud" ? (
            <section>
              <h2 className="font-serif text-2xl font-semibold text-text">
                商品 CRUD 管理
              </h2>
              <p className="mt-2 text-sm text-muted">
                新增、編輯、刪除 Products 資料表內容
              </p>

              {!canWriteProducts && (
                <p className="mt-6 rounded-lg bg-bg px-4 py-3 text-sm text-muted">
                  你目前為 staff 角色，僅能檢視商品列表；修改商品需 superadmin 或
                  manager 權限。
                </p>
              )}

              {canWriteProducts && (
                <div className="mt-6 rounded-xl bg-surface p-6 shadow-sm">
                  <h3 className="font-serif text-xl font-semibold text-text">
                    {editingId ? `編輯商品 #${editingId}` : "新增商品"}
                  </h3>
                  <form
                    onSubmit={handleSubmit}
                    className="mt-5 grid gap-4 md:grid-cols-2"
                  >
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">型號</label>
            <input
              maxLength={50}
              value={form.type_id}
              onChange={(e) => setForm({ ...form, type_id: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
              placeholder={getNextTypeId(products)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">種類</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="">請選擇種類</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">商品名稱 *</label>
            <input
              required
              maxLength={150}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
              placeholder="祈願符 · 經典款"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">描述</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
              placeholder="商品說明…"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">價格 (HKD) *</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">庫存</label>
            <input
              required
              type="number"
              step="1"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">圖片路徑</label>
            <div className="flex flex-wrap gap-2">
              <input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="min-w-[220px] flex-1 rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent"
                placeholder="/pics/cat01.png"
              />
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => imageInputRef.current?.click()}
                className="cursor-pointer rounded-lg border border-black/15 px-4 py-2.5 text-sm font-medium text-text hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingImage ? "上傳中…" : "選擇圖片"}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
            {form.image_url && (
              <div className="relative mt-3 h-24 w-24 overflow-hidden rounded-md border border-black/10 bg-bg">
                <Image
                  src={form.image_url}
                  alt="商品圖片預覽"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            )}
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
              {saving ? "儲存中…" : editingId ? "更新商品" : "新增商品"}
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
                </div>
              )}
            </section>
          ) : (
            <section>
              <h2 className="font-serif text-2xl font-semibold text-text">
                商品列表
              </h2>
              <p className="mt-2 text-sm text-muted">檢視所有商品資料。</p>

              {error && (
                <p className="mt-4 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="mt-4 text-sm text-green-700" role="status">
                  {message}
                </p>
              )}

              <div className="mt-6 overflow-hidden rounded-xl bg-surface shadow-sm">
        {loading ? (
          <p className="px-6 py-10 text-center text-muted">載入中…</p>
        ) : products.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">
            尚無商品，請至「商品 CRUD 管理」新增。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-black/5 bg-bg/60 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">圖片</th>
                  <th className="px-4 py-3 font-medium">型號</th>
                  <th className="px-4 py-3 font-medium">種類</th>
                  <th className="px-4 py-3 font-medium">名稱</th>
                  <th className="px-4 py-3 font-medium">價格</th>
                  <th className="px-4 py-3 font-medium">庫存</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.product_id}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="px-4 py-3">{product.product_id}</td>
                    <td className="px-4 py-3">
                      {product.image_url ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded-md bg-bg">
                          <Image
                            src={product.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{product.type_id || "—"}</td>
                    <td className="px-4 py-3 text-muted">{product.type || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text">{product.name}</div>
                      {product.description && (
                        <div className="mt-0.5 line-clamp-1 text-xs text-muted">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">
                      {canWriteProducts ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(product.product_id, product.name)
                          }
                          className="cursor-pointer rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          刪除
                        </button>
                      </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
