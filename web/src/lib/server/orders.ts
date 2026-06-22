import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createUniquePaymentNo } from "@/lib/server/payment-no";
import type {
  AdminOrderDetail,
  AdminOrderSummary,
  OrderDetail,
  OrderItem,
  OrderStatus as OrderStatusType,
  OrderSummary,
} from "@/types/order";

export const ORDER_STATUSES: OrderStatusType[] = [
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
];

export function isValidOrderStatus(status: string): status is OrderStatusType {
  return ORDER_STATUSES.includes(status as OrderStatusType);
}

export async function findUserIdByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
  return user?.id ?? null;
}

type CartItem = { id?: string | number; product_id?: number; quantity: number };

function mapOrderItem(row: {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: { toString(): string };
  product: {
    name: string;
    imageUrl: string | null;
    typeId: string;
    category: string;
  };
}): OrderItem {
  return {
    item_id: row.id,
    order_id: row.orderId,
    product_id: row.productId,
    quantity: row.quantity,
    price: Number(row.price),
    name: row.product.name,
    image_url: row.product.imageUrl,
    type_id: row.product.typeId,
    category: row.product.category,
  };
}

function getCustomerName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
} | null, guestName: string | null) {
  if (!user) return guestName || "訪客";
  const first = user.firstName?.trim() || "";
  const last = user.lastName?.trim() || "";
  return `${first} ${last}`.trim() || user.email.split("@")[0] || "會員";
}

export async function completeOrder({
  stripePaymentId,
  userId,
  cartItems,
  guestName,
  guestEmail,
  guestPhone,
  shippingAddressId,
  shippingAddressText,
  billingAddress,
  totalAmount,
}: {
  stripePaymentId: string;
  userId: number | null;
  cartItems: CartItem[];
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  shippingAddressId?: number | null;
  shippingAddressText?: string | null;
  billingAddress?: string | null;
  totalAmount?: number | null;
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { stripePaymentId },
      select: { id: true, paymentNo: true },
    });

    if (existing) {
      return {
        order_id: existing.id,
        payment_no: existing.paymentNo,
        created: false,
      };
    }

    const normalizedItems: {
      productId: number;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of cartItems) {
      const productId = Number(item.id ?? item.product_id);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(productId) || productId < 1) {
        throw new Error("INVALID_PRODUCT");
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("INVALID_QUANTITY");
      }

      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, price: true, stock: true },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      normalizedItems.push({
        productId,
        quantity,
        price: Number(product.price),
      });
    }

    const paymentNo = await createUniquePaymentNo(tx);
    const computedTotal =
      totalAmount ??
      normalizedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

    const order = await tx.order.create({
      data: {
        userId,
        guestName: guestName ?? null,
        guestEmail: guestEmail ?? null,
        guestPhone: guestPhone ?? null,
        shippingAddressId: shippingAddressId ?? null,
        shippingAddressText: shippingAddressText ?? null,
        shippingAddress: "",
        billingAddress: billingAddress ?? "",
        stripePaymentId,
        paymentNo,
        totalAmount: computedTotal,
        status: OrderStatus.paid,
      },
    });

    for (const item of normalizedItems) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return {
      order_id: order.id,
      payment_no: paymentNo,
      created: true,
    };
  });
}

export async function getOrdersForUser(userId: number): Promise<OrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => ({
    order_id: order.id,
    user_id: order.userId!,
    stripe_payment_id: order.stripePaymentId,
    payment_no: order.paymentNo,
    status: order.status as OrderStatusType,
    created_at: order.createdAt.toISOString(),
    updated_at: order.updatedAt.toISOString(),
    total_amount: Number(
      order.totalAmount ??
        order.items.reduce(
          (sum, item) => sum + Number(item.price) * item.quantity,
          0,
        ),
    ),
    item_count: order.items.length,
  }));
}

export async function getOrderDetailForUser(
  orderId: number,
  userId: number,
): Promise<OrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: { product: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!order) return null;

  const items = order.items.map(mapOrderItem);
  const totalAmount = Number(
    order.totalAmount ??
      items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  return {
    order: {
      order_id: order.id,
      user_id: order.userId!,
      stripe_payment_id: order.stripePaymentId,
      payment_no: order.paymentNo,
      status: order.status as OrderStatusType,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
      total_amount: totalAmount,
      item_count: items.length,
    },
    items,
  };
}

export async function getAllOrders(): Promise<AdminOrderSummary[]> {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => ({
    order_id: order.id,
    user_id: order.userId ?? 0,
    stripe_payment_id: order.stripePaymentId,
    payment_no: order.paymentNo,
    status: order.status as OrderStatusType,
    created_at: order.createdAt.toISOString(),
    updated_at: order.updatedAt.toISOString(),
    shipping_address_text: order.shippingAddressText,
    billing_address: order.billingAddress,
    customer_name: getCustomerName(order.user, order.guestName),
    customer_email: order.user?.email || order.guestEmail || "",
    customer_phone: order.user?.phone || order.guestPhone,
    customer_member_id: order.user?.memberId ?? null,
    is_guest: !order.userId,
    total_amount: Number(
      order.totalAmount ??
        order.items.reduce(
          (sum, item) => sum + Number(item.price) * item.quantity,
          0,
        ),
    ),
    item_count: order.items.length,
  }));
}

export async function getOrderDetailById(
  orderId: number,
): Promise<AdminOrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        include: { product: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!order) return null;

  const items = order.items.map(mapOrderItem);
  const totalAmount = Number(
    order.totalAmount ??
      items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  return {
    order: {
      order_id: order.id,
      user_id: order.userId ?? 0,
      stripe_payment_id: order.stripePaymentId,
      payment_no: order.paymentNo,
      status: order.status as OrderStatusType,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
      shipping_address_text: order.shippingAddressText,
      billing_address: order.billingAddress,
      customer_name: getCustomerName(order.user, order.guestName),
      customer_email: order.user?.email || order.guestEmail || "",
      customer_phone: order.user?.phone || order.guestPhone,
      customer_member_id: order.user?.memberId ?? null,
      is_guest: !order.userId,
      total_amount: totalAmount,
      item_count: items.length,
    },
    items,
  };
}

export async function updateOrderStatus(orderId: number, status: OrderStatusType) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      select: { id: true, status: true, updatedAt: true },
    });

    return {
      order_id: order.id,
      status: order.status,
      updated_at: order.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}
