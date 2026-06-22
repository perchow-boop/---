"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addFavorite,
  fetchFavorites,
  removeFavorite,
  type FavoriteItem,
} from "@/lib/auth-api";
import { useAuth } from "@/context/AuthContext";

type FavoritesContextValue = {
  favorites: FavoriteItem[];
  loading: boolean;
  savingId: number | null;
  isFavorite: (productId: number | string) => boolean;
  toggleFavorite: (productId: number | string) => Promise<void>;
  removeFromFavorites: (productId: number | string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function toProductId(productId: number | string) {
  return Number(productId);
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((item) => item.product_id)),
    [favorites],
  );

  const refreshFavorites = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      return;
    }

    setLoading(true);

    try {
      const data = await fetchFavorites(token);
      setFavorites(data.favorites);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (productId: number | string) => favoriteIds.has(toProductId(productId)),
    [favoriteIds],
  );

  const removeFromFavorites = useCallback(
    async (productId: number | string) => {
      if (!token) return;

      const id = toProductId(productId);
      setSavingId(id);

      try {
        await removeFavorite(token, id);
        setFavorites((current) =>
          current.filter((item) => item.product_id !== id),
        );
      } finally {
        setSavingId(null);
      }
    },
    [token],
  );

  const toggleFavorite = useCallback(
    async (productId: number | string) => {
      if (!token) {
        throw new Error("LOGIN_REQUIRED");
      }

      const id = toProductId(productId);
      setSavingId(id);

      try {
        if (favoriteIds.has(id)) {
          await removeFavorite(token, id);
          setFavorites((current) =>
            current.filter((item) => item.product_id !== id),
          );
        } else {
          await addFavorite(token, id);
          const data = await fetchFavorites(token);
          setFavorites(data.favorites);
        }
      } finally {
        setSavingId(null);
      }
    },
    [token, favoriteIds],
  );

  const value = useMemo(
    () => ({
      favorites,
      loading,
      savingId,
      isFavorite,
      toggleFavorite,
      removeFromFavorites,
      refreshFavorites,
    }),
    [
      favorites,
      loading,
      savingId,
      isFavorite,
      toggleFavorite,
      removeFromFavorites,
      refreshFavorites,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
