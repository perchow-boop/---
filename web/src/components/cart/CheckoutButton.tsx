"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export function CheckoutButton() {
  const { items, closeCart } = useCart();

  return (
    <Link
      href="/checkout"
      className={`block w-full rounded-lg bg-accent px-4 py-3.5 text-center text-sm font-bold text-accent-contrast transition-opacity ${
        items.length === 0
          ? "pointer-events-none opacity-40"
          : "hover:opacity-90"
      }`}
      aria-disabled={items.length === 0}
      onClick={(event) => {
        if (items.length === 0) {
          event.preventDefault();
          return;
        }
        closeCart();
      }}
    >
      前往結帳
    </Link>
  );
}
