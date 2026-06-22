"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/products";
import { CheckoutButton } from "@/components/cart/CheckoutButton";

export function CartDrawer() {
  const {
    items,
    isOpen,
    subtotal,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCart();
    }
    if (isOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/40 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden={!isOpen}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[80] flex w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="購物車"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-5">
          <h2 className="font-serif text-xl font-semibold text-text">購物車</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="關閉購物車"
            className="cursor-pointer rounded-md px-2 py-1 text-2xl leading-none text-muted hover:bg-black/5 hover:text-text"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center text-muted">
              <p className="text-4xl">🛒</p>
              <p className="mt-4 font-medium text-text">購物車是空的</p>
              <p className="mt-2 text-sm">前往商店挑選你的心願符紙吧。</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-black/5 p-3"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-bg">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-serif text-sm font-semibold text-text">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatPrice(item.price)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="減少數量"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-black/10 text-text hover:bg-black/5"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="增加數量"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-black/10 text-text hover:bg-black/5"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="ml-auto cursor-pointer text-xs text-muted hover:text-text"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-black/5 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted">小計</span>
            <span className="text-xl font-bold text-text">
              {formatPrice(subtotal)}
            </span>
          </div>
          <CheckoutButton />
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="mt-3 w-full cursor-pointer text-sm text-muted hover:text-text"
            >
              清空購物車
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
