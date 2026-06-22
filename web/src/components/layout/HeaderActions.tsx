"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export function HeaderActions() {
  const { user, loading } = useAuth();
  const { itemCount, toggleCart } = useCart();

  return (
    <div className="flex items-center gap-3">
      {!loading && user && (
        <Link
          href="/profile"
          className="max-w-[120px] truncate text-sm font-medium text-text transition-opacity hover:opacity-70 sm:max-w-[160px]"
          title={user.name}
        >
          {user.name}
        </Link>
      )}
      <button
        type="button"
        aria-label="搜尋"
        className="cursor-pointer border-none bg-transparent text-lg transition-opacity hover:opacity-70"
      >
        🔍
      </button>
      <button
        type="button"
        aria-label="開啟購物車"
        onClick={toggleCart}
        className="relative cursor-pointer border-none bg-transparent text-lg transition-opacity hover:opacity-70"
      >
        🛒
        {itemCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-contrast">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>
    </div>
  );
}
