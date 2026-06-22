"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminOrderDetail,
  fetchAdminOrders,
  updateAdminOrderStatus,
} from "@/lib/admin-orders-api";
import { formatPrice } from "@/lib/products";
import type {
  AdminOrderDetail,
  AdminOrderSummary,
  OrderStatus,
} from "@/types/order";
import {
  ADMIN_ORDER_STATUS_OPTIONS,
  ORDER_STATUS_LABELS,
} from "@/types/order";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-Hant-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusOptions(current: OrderStatus) {
  return ADMIN_ORDER_STATUS_OPTIONS.includes(current)
    ? ADMIN_ORDER_STATUS_OPTIONS
    : [...ADMIN_ORDER_STATUS_OPTIONS, current];
}


function AddressDisplay({
  address,
  compact = false,
}: {
  address: string | null;
  compact?: boolean;
}) {
  if (!address) {
    return <span className="text-muted">—</span>;
  }

  const parts = address.split(" · ").map((part) => part.trim()).filter(Boolean);
  const primaryLabels = ["收件人", "電話", "地址"] as const;

  return (
    <div
      className={`space-y-1 whitespace-normal leading-relaxed ${
        compact ? "min-w-[280px] text-xs" : "text-sm"
      }`}
    >
      {parts.map((part, index) => (
        <p key={`${part}-${index}`} className="break-words">
          {index < primaryLabels.length ? (
            <>
              <span className="font-medium text-muted">
                {primaryLabels[index]}：
              </span>
              <span className={index === 0 ? "font-medium text-text" : "text-text"}>
                {part}
              </span>
            </>
          ) : (
            <span className="text-muted">{part}</span>
          )}
        </p>
      ))}
    </div>
  );
}

type AdminOrderListProps = {
  token: string;
};

export function AdminOrderList({ token }: AdminOrderListProps) {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, AdminOrderDetail>>({});
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);
  const [savingStatusId, setSavingStatusId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAdminOrders(token);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "讀取訂貨單失敗");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function toggleOrder(orderId: number) {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(orderId);

    if (details[orderId]) return;

    setLoadingDetail(orderId);
    try {
      const detail = await fetchAdminOrderDetail(token, orderId);
      setDetails((current) => ({ ...current, [orderId]: detail }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "讀取訂單詳情失敗");
      setExpandedId(null);
    } finally {
      setLoadingDetail(null);
    }
  }

  async function handleStatusUpdate(orderId: number, status: OrderStatus) {
    setSavingStatusId(orderId);
    setError(null);
    setMessage(null);

    try {
      const result = await updateAdminOrderStatus(token, orderId, status);
      setOrders((current) =>
        current.map((order) =>
          order.order_id === orderId
            ? {
                ...order,
                status: result.status as OrderStatus,
                updated_at: result.updated_at,
              }
            : order,
        ),
      );
      setDetails((current) => {
        const detail = current[orderId];
        if (!detail) return current;

        return {
          ...current,
          [orderId]: {
            ...detail,
            order: {
              ...detail.order,
              status: result.status as OrderStatus,
              updated_at: result.updated_at,
            },
          },
        };
      });
      setMessage(`訂單 ${orders.find((o) => o.order_id === orderId)?.payment_no ?? orderId} 狀態已更新`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新狀態失敗");
    } finally {
      setSavingStatusId(null);
    }
  }

  return (
    <section>
      <h2 className="font-serif text-2xl font-semibold text-text">訂貨單</h2>
      <p className="mt-2 text-sm text-muted">檢視所有訂單（會員及訪客）。</p>

      {error && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 text-sm text-green-700" role="status">
          {message}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl bg-surface shadow-sm">
        {loading ? (
          <p className="px-6 py-10 text-center text-muted">載入中…</p>
        ) : orders.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">尚無訂單紀錄。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead className="border-b border-black/5 bg-bg/60 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">下單時間</th>
                  <th className="px-4 py-3 font-medium">訂單編號</th>
                  <th className="px-4 py-3 font-medium">客戶</th>
                  <th className="px-4 py-3 font-medium">配送地址</th>
                  <th className="px-4 py-3 font-medium">狀態</th>
                  <th className="px-4 py-3 font-medium">金額</th>
                  <th className="px-4 py-3 font-medium">件數</th>
                  <th className="px-4 py-3 font-medium">Payment ID</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isExpanded = expandedId === order.order_id;
                  const detail = details[order.order_id];

                  return (
                    <OrderRows
                      key={order.order_id}
                      order={order}
                      isExpanded={isExpanded}
                      detail={detail}
                      loadingDetail={loadingDetail === order.order_id}
                      savingStatus={savingStatusId === order.order_id}
                      onToggle={() => toggleOrder(order.order_id)}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

type OrderRowsProps = {
  order: AdminOrderSummary;
  isExpanded: boolean;
  detail?: AdminOrderDetail;
  loadingDetail: boolean;
  savingStatus: boolean;
  onToggle: () => void;
  onStatusUpdate: (orderId: number, status: OrderStatus) => Promise<void>;
};

function OrderRows({
  order,
  isExpanded,
  detail,
  loadingDetail,
  savingStatus,
  onToggle,
  onStatusUpdate,
}: OrderRowsProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const statusChanged = selectedStatus !== order.status;
  const statusOptions = getStatusOptions(order.status);

  useEffect(() => {
    setSelectedStatus(order.status);
  }, [order.status]);

  return (
    <>
      <tr className="border-b border-black/5 align-top">
        <td className="px-4 py-3 text-muted">{formatDate(order.created_at)}</td>
        <td className="px-4 py-3 font-medium text-text">{order.payment_no}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                order.is_guest
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {order.is_guest ? "訪客" : "會員"}
            </span>
            <span className="font-medium text-text">{order.customer_name}</span>
          </div>
          <div className="mt-1 text-xs text-muted">{order.customer_email || "—"}</div>
          {!order.is_guest && order.customer_member_id && (
            <div className="mt-1 font-mono text-xs text-muted">
              會員編號：{order.customer_member_id}
            </div>
          )}
          {order.customer_phone && (
            <div className="text-xs text-muted">{order.customer_phone}</div>
          )}
        </td>
        <td className="min-w-[280px] px-4 py-3">
          <AddressDisplay address={order.shipping_address_text} compact />
        </td>
        <td className="px-4 py-3">
          <div className="flex min-w-[150px] flex-col gap-2">
            <select
              value={selectedStatus}
              disabled={savingStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as OrderStatus)
              }
              className="w-full rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-accent disabled:opacity-50"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </select>
            {statusChanged && (
              <button
                type="button"
                disabled={savingStatus}
                onClick={() => onStatusUpdate(order.order_id, selectedStatus)}
                className="cursor-pointer rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-contrast disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingStatus ? "更新中…" : "更新狀態"}
              </button>
            )}
          </div>
        </td>
        <td className="px-4 py-3 font-medium">{formatPrice(order.total_amount)}</td>
        <td className="px-4 py-3">{order.item_count}</td>
        <td className="max-w-[140px] px-4 py-3">
          <span
            className="block truncate font-mono text-xs text-muted"
            title={order.stripe_payment_id}
          >
            {order.stripe_payment_id}
          </span>
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="cursor-pointer rounded-md border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
          >
            {isExpanded ? "收合" : "明細"}
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b border-black/5 bg-bg/40">
          <td colSpan={9} className="px-4 py-4">
            {loadingDetail && (
              <p className="text-sm text-muted">載入商品明細…</p>
            )}

            {detail && (
              <div className="space-y-4">
                {(detail.order.billing_address ||
                  detail.order.shipping_address_text) && (
                  <div className="grid gap-3 rounded-lg border border-black/5 bg-surface p-4 text-xs md:grid-cols-2">
                    {detail.order.shipping_address_text && (
                      <div>
                        <p className="font-medium text-text">配送地址</p>
                        <div className="mt-2">
                          <AddressDisplay
                            address={detail.order.shipping_address_text}
                          />
                        </div>
                      </div>
                    )}
                    {detail.order.billing_address && (
                      <div>
                        <p className="font-medium text-text">帳單地址</p>
                        <div className="mt-2">
                          <AddressDisplay address={detail.order.billing_address} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <ul className="space-y-3">
                  {detail.items.map((item) => (
                    <li key={item.item_id} className="flex items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-bg">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted">
                            無圖
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted">
                          {item.category || item.type_id || "商品"} · 數量{" "}
                          {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-text">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
