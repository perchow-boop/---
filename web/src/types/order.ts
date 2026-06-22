export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export type OrderSummary = {
  order_id: number;
  user_id: number;
  stripe_payment_id: string;
  payment_no: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  total_amount: number;
  item_count: number;
};

export type OrderItem = {
  item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  name: string;
  image_url: string | null;
  type_id: string | null;
  category: string | null;
};

export type OrderDetail = {
  order: OrderSummary & { total_amount: number };
  items: OrderItem[];
};

export type AdminOrderSummary = OrderSummary & {
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_member_id: string | null;
  is_guest: boolean;
  shipping_address_text: string | null;
  billing_address: string | null;
};

export type AdminOrderDetail = {
  order: AdminOrderSummary & { total_amount: number; item_count: number };
  items: OrderItem[];
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "待付款",
  paid: "已付款",
  shipped: "已寄出",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "text-amber-700 bg-amber-50",
  paid: "text-green-700 bg-green-50",
  shipped: "text-blue-700 bg-blue-50",
  completed: "text-emerald-700 bg-emerald-50",
  cancelled: "text-gray-600 bg-gray-100",
  refunded: "text-red-700 bg-red-50",
};

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

/** 管理後台：含舊資料 refunded 狀態 */
export const ADMIN_ORDER_STATUS_OPTIONS: OrderStatus[] = [
  ...ORDER_STATUS_OPTIONS,
  "refunded",
];
