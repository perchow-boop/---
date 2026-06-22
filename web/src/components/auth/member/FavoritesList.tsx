"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useFavorites } from "@/context/FavoritesContext";
import { formatPrice } from "@/lib/products";
import { getStockStatus } from "@/lib/products";
import { StockStatus } from "@/components/products/StockStatus";

export function FavoritesList() {
  const { favorites, loading, savingId, removeFromFavorites } = useFavorites();
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(productId: number) {
    setError(null);

    try {
      await removeFromFavorites(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取消收藏失敗");
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-black/10 bg-surface p-8 text-center text-sm text-muted shadow-sm">
        載入收藏清單中…
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!favorites.length ? (
        <div className="rounded-xl border border-black/10 bg-surface p-8 text-center text-sm text-muted shadow-sm">
          尚未加入任何收藏商品。
          <div className="mt-4">
            <Link
              href="/products"
              className="text-sm font-medium text-text underline underline-offset-2"
            >
              前往商店
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {favorites.map((item) => {
            const stockStatus = getStockStatus(item.product.stock);

            return (
              <li
                key={item.favorite_id}
                className="flex items-center gap-4 rounded-xl border border-black/10 bg-surface p-4 shadow-sm"
              >
                <Link
                  href={`/products/${item.product_id}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-bg"
                >
                  {item.product.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">
                      無圖
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.product_id}`}
                    className="block truncate text-sm font-medium text-text hover:underline"
                  >
                    {item.product.name}
                  </Link>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {formatPrice(item.product.price)}
                  </p>
                  <StockStatus stock={item.product.stock} className="mt-2" />
                </div>

                <button
                  type="button"
                  disabled={savingId === item.product_id}
                  onClick={() => handleRemove(item.product_id)}
                  className="cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-bg disabled:opacity-50"
                >
                  {savingId === item.product_id ? "處理中…" : "取消收藏"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
