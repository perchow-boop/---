import { prisma } from "@/lib/prisma";
import type { FavoriteItem } from "@/lib/auth-api";

export async function getFavoritesForUser(userId: number): Promise<FavoriteItem[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    favorite_id: row.id,
    user_id: row.userId,
    product_id: row.productId,
    created_at: row.createdAt.toISOString(),
    product: {
      product_id: row.product.id,
      name: row.product.name,
      price: Number(row.product.price),
      image_url: row.product.imageUrl,
      type_id: null,
      category: row.product.category,
      stock: row.product.stock,
    },
  }));
}

export async function addFavorite(userId: number, productId: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    return { error: "PRODUCT_NOT_FOUND" as const };
  }

  await prisma.favorite.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    create: { userId, productId },
    update: {},
  });

  return { ok: true as const };
}

export async function removeFavorite(userId: number, productId: number) {
  const result = await prisma.favorite.deleteMany({
    where: { userId, productId },
  });
  return result.count > 0;
}
