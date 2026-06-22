"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";

type FavoriteButtonProps = {
  productId: number | string;
  className?: string;
  compact?: boolean;
};

export function FavoriteButton({
  productId,
  className = "",
  compact = false,
}: FavoriteButtonProps) {
  const router = useRouter();
  const { token } = useAuth();
  const { isFavorite, toggleFavorite, savingId } = useFavorites();
  const [error, setError] = useState<string | null>(null);

  const favorited = isFavorite(productId);
  const saving = savingId === Number(productId);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setError(null);

    if (!token) {
      const redirect = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname : "/products",
      );
      router.push(`/login?redirect=${redirect}`);
      return;
    }

    try {
      await toggleFavorite(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "收藏操作失敗");
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        aria-label={favorited ? "取消收藏" : "加入收藏"}
        aria-pressed={favorited}
        disabled={saving}
        onClick={handleClick}
        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-surface text-base transition-colors hover:bg-bg disabled:opacity-50 ${className}`}
      >
        <span aria-hidden>{favorited ? "♥" : "♡"}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-pressed={favorited}
        disabled={saving}
        onClick={handleClick}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          favorited
            ? "border-accent bg-accent/5 text-accent"
            : "border-accent text-accent hover:bg-accent/5"
        } ${className}`}
      >
        <span aria-hidden>{favorited ? "♥" : "♡"}</span>
        {saving ? "處理中…" : favorited ? "已收藏" : "收藏"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
