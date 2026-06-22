"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartAuthSync } from "@/components/providers/CartAuthSync";
import { FavoritesProvider } from "@/context/FavoritesContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <CartAuthSync />
            {children}
            <CartDrawer />
          </CartProvider>
        </FavoritesProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
