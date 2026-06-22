"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchOrderDetail, fetchOrders } from "@/lib/orders-api";
import { formatPrice } from "@/lib/products";
import type { OrderDetail, OrderSummary } from "@/types/order";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "@/types/order";

const STATUS_LABELS = ORDER_STATUS_LABELS;
const STATUS_COLORS = ORDER_STATUS_COLORS;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-Hant-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type OrderHistoryProps = {
  token: string;
};

export function OrderHistory({ token }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, OrderDetail>>({});
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchOrders(token);
        if (!cancelled) {
          setOrders(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "讀取訂單失敗");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function toggleOrder(orderId: number) {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(orderId);

    if (details[orderId]) return;

    setLoadingDetail(orderId);
    try {
      const detail = await fetchOrderDetail(token, orderId);
      setDetails((current) => ({ ...current, [orderId]: detail }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "讀取訂單詳情失敗");
      setExpandedId(null);
    } finally {
      setLoadingDetail(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-black/10 bg-surface p-6 text-center text-sm text-muted shadow-sm">
        載入訂單中…
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!orders.length ? (
        <div className="rounded-xl border border-black/10 bg-surface p-8 text-center text-sm text-muted shadow-sm">
          尚無訂單紀錄。完成付款後，訂單會顯示於此。
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedId === order.order_id;
            const detail = details[order.order_id];

            return (
              <li
                key={order.order_id}
                className="overflow-hidden rounded-xl border border-black/10 bg-surface shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleOrder(order.order_id)}
                  className="flex w-full cursor-pointer items-start justify-between gap-4 px-5 py-4 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {order.payment_no}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(order.created_at)} · {order.item_count} 件商品
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-text">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-black/5 px-5 py-4">
                    {loadingDetail === order.order_id && (
                      <p className="text-sm text-muted">載入商品明細…</p>
                    )}

                    {detail && (
                      <ul className="space-y-3">
                        {detail.items.map((item) => (
                          <li
                            key={item.item_id}
                            className="flex items-center gap-3"
                          >
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
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
