import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { canManageProducts, requireAdmin } from "@/lib/server/auth";
import {
  createProduct,
  listProducts,
  validateProductBody,
} from "@/lib/server/products";

export async function GET() {
  try {
    const products = await listProducts();
    return jsonOk({ products });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return jsonError("讀取商品列表失敗", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    if (!canManageProducts(auth.admin.role)) {
      return jsonError("此角色無法修改商品（僅 superadmin / manager）", 403);
    }

    const body = await request.json();
    const validationError = validateProductBody(body);
    if (validationError) {
      return jsonError(validationError, 400);
    }

    const product = await createProduct(body);

    return jsonOk(
      {
        message: "商品已新增",
        product,
      },
      201,
    );
  } catch (error) {
    console.error("[POST /api/products]", error);
    return jsonError("新增商品失敗", 500);
  }
}
