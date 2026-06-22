import { prisma } from "@/lib/prisma";
import { mapPrismaProduct } from "@/lib/server/mappers";
import type { DbProduct } from "@/types/db-product";

export async function listProducts(): Promise<DbProduct[]> {
  const rows = await prisma.product.findMany({
    orderBy: { id: "desc" },
  });
  return rows.map(mapPrismaProduct);
}

export async function getProductById(id: number): Promise<DbProduct | null> {
  const row = await prisma.product.findUnique({ where: { id } });
  if (!row) return null;
  return mapPrismaProduct(row);
}

export function validateProductBody(
  body: Record<string, unknown>,
  isUpdate = false,
) {
  const { type_id, type, name, description, price, stock, image_url } = body;

  if (!isUpdate && (!String(name || "").trim() || price === undefined)) {
    return "請填寫商品名稱與價格";
  }

  if (type_id !== undefined && type_id !== null && String(type_id).length > 20) {
    return "型號不可超過 20 個字元";
  }

  if (type !== undefined && type !== null && String(type).length > 20) {
    return "種類不可超過 20 個字元";
  }

  if (name !== undefined && !String(name).trim()) {
    return "商品名稱不可為空";
  }

  if (
    price !== undefined &&
    (Number.isNaN(Number(price)) || Number(price) < 0)
  ) {
    return "價格必須為 0 或以上的數字";
  }

  if (stock !== undefined && !Number.isInteger(Number(stock))) {
    return "庫存必須為整數";
  }

  if (
    image_url !== undefined &&
    image_url !== null &&
    String(image_url).length > 255
  ) {
    return "圖片網址過長";
  }

  if (
    description !== undefined &&
    description !== null &&
    String(description).length > 5000
  ) {
    return "描述過長";
  }

  return null;
}

export async function createProduct(body: Record<string, unknown>) {
  const { type_id, type, name, description, price, stock = 0, image_url } =
    body;

  const row = await prisma.product.create({
    data: {
      typeId: String(type_id || "").trim() || "LKB-000",
      category: String(type || "").trim() || "未分類",
      name: String(name).trim(),
      description: String(description || "").trim() || null,
      price: Number(price),
      stock: Number(stock),
      imageUrl: String(image_url || "").trim() || null,
    },
  });

  return mapPrismaProduct(row);
}

export async function updateProduct(id: number, body: Record<string, unknown>) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return null;

  const { type_id, type, name, description, price, stock, image_url } = body;

  const row = await prisma.product.update({
    where: { id },
    data: {
      typeId: String(type_id || "").trim() || existing.typeId,
      category: String(type || "").trim() || existing.category,
      name: String(name).trim(),
      description: String(description || "").trim() || null,
      price: Number(price),
      stock: Number(stock),
      imageUrl: String(image_url || "").trim() || null,
    },
  });

  return mapPrismaProduct(row);
}

export async function deleteProduct(id: number) {
  try {
    await prisma.product.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
