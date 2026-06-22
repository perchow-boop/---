import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { isValidOrderStatus, updateOrderStatus } from "@/lib/server/orders";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function handleStatusUpdate(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = await context.params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId < 1) {
    return jsonError("無效的訂單 ID", 400);
  }

  const { status } = await request.json();

  if (!status || !isValidOrderStatus(status)) {
    return jsonError("無效的訂單狀態", 400);
  }

  const updated = await updateOrderStatus(orderId, status);

  if (!updated) {
    return jsonError("找不到此訂貨單", 404);
  }

  return jsonOk({
    message: "訂單狀態已更新",
    order_id: updated.order_id,
    status: updated.status,
    updated_at: updated.updated_at,
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    return await handleStatusUpdate(request, context);
  } catch (error) {
    console.error("[PUT /api/admin/orders/:id/status]", error);
    return jsonError("更新訂單狀態失敗", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    return await handleStatusUpdate(request, context);
  } catch (error) {
    console.error("[PATCH /api/admin/orders/:id/status]", error);
    return jsonError("更新訂單狀態失敗", 500);
  }
}
