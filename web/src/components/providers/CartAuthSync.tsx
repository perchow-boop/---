"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

/** 會員登出時同步清空購物車 */
export function CartAuthSync() {
  const { token, loading } = useAuth();
  const { clearCart } = useCart();
  const previousToken = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (previousToken.current && !token) {
      clearCart();
    }

    previousToken.current = token;
  }, [token, loading, clearCart]);

  return null;
}
