import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { canManageProducts, requireAdmin } from "@/lib/server/auth";
import {
  deleteProduct,
  getProductById,
  updateProduct,
  validateProductBody,
} from "@/lib/server/products";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId < 1) {
      return jsonError("無效的商品 ID", 400);
    }

    const product = await getProductById(productId);

    if (!product) {
      return jsonError("找不到此商品", 404);
    }

    return jsonOk({ product });
  } catch (error) {
    console.error("[GET /api/products/:id]", error);
    return jsonError("讀取商品失敗", 500);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    if (!canManageProducts(auth.admin.role)) {
      return jsonError("此角色無法修改商品（僅 superadmin / manager）", 403);
    }

    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId < 1) {
      return jsonError("無效的商品 ID", 400);
    }

    const body = await request.json();
    const validationError = validateProductBody(body, true);
    if (validationError) {
      return jsonError(validationError, 400);
    }

    const product = await updateProduct(productId, body);
    if (!product) {
      return jsonError("找不到此商品", 404);
    }

    return jsonOk({
      message: "商品已更新",
      product,
    });
  } catch (error) {
    console.error("[PUT /api/products/:id]", error);
    return jsonError("更新商品失敗", 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    if (!canManageProducts(auth.admin.role)) {
      return jsonError("此角色無法修改商品（僅 superadmin / manager）", 403);
    }

    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId < 1) {
      return jsonError("無效的商品 ID", 400);
    }

    const removed = await deleteProduct(productId);
    if (!removed) {
      return jsonError("找不到此商品", 404);
    }

    return jsonOk({ message: "商品已刪除" });
  } catch (error) {
    console.error("[DELETE /api/products/:id]", error);
    return jsonError("刪除商品失敗", 500);
  }
}
