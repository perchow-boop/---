"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function CheckoutSuccessLinks() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <Link
        href="/products"
        className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-bold text-accent-contrast"
      >
        繼續選購
      </Link>
      {user ? (
        <Link
          href="/profile"
          className="text-sm text-muted underline-offset-4 hover:text-text hover:underline"
        >
          查看訂單紀錄
        </Link>
      ) : (
        <Link
          href="/register"
          className="text-sm text-muted underline-offset-4 hover:text-text hover:underline"
        >
          註冊會員以追蹤訂單
        </Link>
      )}
    </div>
  );
}
