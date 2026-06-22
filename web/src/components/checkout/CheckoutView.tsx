"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { startCheckout } from "@/lib/checkout-client";
import { formatPhoneForInput, getDialCode, toE164Phone } from "@/lib/phone";
import { formatPrice } from "@/lib/products";
import {
  CHECKOUT_SHIPPING_OPTIONS,
  getDistrictOptions,
  getShippingFee,
  STRIPE_SHIPPING_COUNTRIES,
} from "@/lib/shipping";
import type {
  CheckoutAddress,
  CheckoutShippingMethod,
} from "@/types/checkout";

function emptyAddress(): CheckoutAddress {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "HK",
    city: "",
    postalCode: "",
    address1: "",
    address2: "",
  };
}

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-accent";

export function CheckoutView() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const { items, subtotal, closeCart } = useCart();

  const [billing, setBilling] = useState<CheckoutAddress>(emptyAddress);
  const [shipping, setShipping] = useState<CheckoutAddress>(emptyAddress);
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingMethod, setShippingMethod] =
    useState<CheckoutShippingMethod>("delivery");
  const [orderNotes, setOrderNotes] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingFee = getShippingFee(shippingMethod);
  const total = subtotal + shippingFee;

  useEffect(() => {
    closeCart();
  }, [closeCart]);

  useEffect(() => {
    if (!authLoading && !items.length) {
      router.replace("/products");
    }
  }, [items.length, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const defaultAddress = user.default_address;

    setBilling({
      firstName: user.first_name,
      lastName: user.last_name || "",
      email: user.email,
      phone: formatPhoneForInput(user.phone, defaultAddress?.country || "HK"),
      country: defaultAddress?.country || "HK",
      city: defaultAddress?.city || "",
      postalCode: defaultAddress?.postal_code || "",
      address1: defaultAddress?.street_address || "",
      address2: "",
    });
  }, [user]);

  useEffect(() => {
    if (shippingSameAsBilling) {
      setShipping(billing);
    }
  }, [billing, shippingSameAsBilling]);

  function updateBilling<K extends keyof CheckoutAddress>(
    key: K,
    value: CheckoutAddress[K],
  ) {
    setBilling((current) => ({ ...current, [key]: value }));
  }

  function updateShipping<K extends keyof CheckoutAddress>(
    key: K,
    value: CheckoutAddress[K],
  ) {
    setShipping((current) => ({ ...current, [key]: value }));
  }

  function handleBillingCountryChange(country: string) {
    const normalized = toE164Phone(billing.phone, billing.country);
    updateBilling("country", country);
    updateBilling("city", "");
    updateBilling("phone", formatPhoneForInput(normalized, country));
  }

  function handleShippingCountryChange(country: string) {
    const normalized = toE164Phone(shipping.phone, shipping.country);
    updateShipping("country", country);
    updateShipping("city", "");
    updateShipping("phone", formatPhoneForInput(normalized, country));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!items.length || loading) return;

    if (!agreedTerms) {
      setError("請確認已年滿 18 歲並同意網站條款及細則。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = await startCheckout(
        {
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          billing: {
            ...billing,
            phone: toE164Phone(billing.phone, billing.country) || billing.phone,
          },
          shippingSameAsBilling,
          shipping: shippingSameAsBilling
            ? undefined
            : {
                ...shipping,
                email: billing.email,
                phone:
                  toE164Phone(shipping.phone, shipping.country) ||
                  shipping.phone,
              },
          shippingMethod,
          orderNotes,
        },
        token,
      );

      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "結帳失敗，請稍後再試。");
      setLoading(false);
    }
  }

  const billingDistrictOptions = useMemo(
    () => getDistrictOptions(billing.country),
    [billing.country],
  );

  const shippingDistrictOptions = useMemo(
    () => getDistrictOptions(shipping.country),
    [shipping.country],
  );

  if (authLoading || !items.length) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center text-muted">
        載入中…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-serif text-3xl font-semibold text-text">結帳</h1>

      {!user && (
        <p className="mt-3 text-sm text-muted">
          以訪客身份結帳。已有帳戶？
          <Link href="/login?redirect=/checkout" className="ml-1 text-text underline">
            會員登入
          </Link>
        </p>
      )}

      <div className="mt-6 flex items-center gap-3 text-sm">
        <span className="rounded-full bg-accent px-3 py-1 font-medium text-accent-contrast">
          1 結帳
        </span>
        <span className="text-muted">›</span>
        <span className="rounded-full bg-bg px-3 py-1 font-medium text-text">
          2 填寫資料及付款
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl bg-surface p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-text">
              帳單地址
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">名字</label>
                <input
                  required
                  value={billing.firstName}
                  onChange={(e) => updateBilling("firstName", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">姓氏</label>
                <input
                  value={billing.lastName}
                  onChange={(e) => updateBilling("lastName", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">電郵</label>
                <input
                  type="email"
                  required
                  value={billing.email}
                  readOnly={Boolean(user)}
                  onChange={(e) => updateBilling("email", e.target.value)}
                  className={`${inputClass}${user ? " bg-bg text-muted" : ""}`}
                  placeholder="you@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">電話</label>
                <div className="flex overflow-hidden rounded-lg border border-black/10 focus-within:border-accent">
                  <span className="flex items-center border-r border-black/10 bg-bg px-3 text-sm text-muted">
                    +{getDialCode(billing.country)}
                  </span>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    value={billing.phone}
                    onChange={(e) =>
                      updateBilling(
                        "phone",
                        e.target.value.replace(/[^\d]/g, ""),
                      )
                    }
                    className="w-full px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  國家／地區
                </label>
                <select
                  required
                  value={billing.country}
                  onChange={(e) => handleBillingCountryChange(e.target.value)}
                  className={inputClass}
                >
                  {STRIPE_SHIPPING_COUNTRIES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  地區／市
                </label>
                <select
                  required
                  value={billing.city}
                  onChange={(e) => updateBilling("city", e.target.value)}
                  className={inputClass}
                >
                  <option value="">請選擇地區</option>
                  {billingDistrictOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  郵遞區號
                </label>
                <input
                  value={billing.postalCode}
                  onChange={(e) => updateBilling("postalCode", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">地址</label>
                <input
                  required
                  value={billing.address1}
                  onChange={(e) => updateBilling("address1", e.target.value)}
                  className={inputClass}
                  placeholder="街道、大廈、室號"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  地址（第二行）
                </label>
                <input
                  value={billing.address2}
                  onChange={(e) => updateBilling("address2", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={shippingSameAsBilling}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setShippingSameAsBilling(checked);
                  if (checked) {
                    setShipping(billing);
                  } else {
                    setShipping({ ...billing });
                  }
                }}
                className="h-4 w-4 rounded border-black/20"
              />
              產品配送地址和帳單地址相同
            </label>
          </section>

          {!shippingSameAsBilling && (
            <section className="rounded-xl bg-surface p-6 shadow-sm">
              <h2 className="font-serif text-xl font-semibold text-text">
                配送地址
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">名字</label>
                  <input
                    required
                    value={shipping.firstName}
                    onChange={(e) => updateShipping("firstName", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">姓氏</label>
                  <input
                    value={shipping.lastName}
                    onChange={(e) => updateShipping("lastName", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">電話</label>
                  <div className="flex overflow-hidden rounded-lg border border-black/10 focus-within:border-accent">
                    <span className="flex items-center border-r border-black/10 bg-bg px-3 text-sm text-muted">
                      +{getDialCode(shipping.country)}
                    </span>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      value={shipping.phone}
                      onChange={(e) =>
                        updateShipping(
                          "phone",
                          e.target.value.replace(/[^\d]/g, ""),
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    國家／地區
                  </label>
                  <select
                    required
                    value={shipping.country}
                    onChange={(e) =>
                      handleShippingCountryChange(e.target.value)
                    }
                    className={inputClass}
                  >
                    {STRIPE_SHIPPING_COUNTRIES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    地區／市
                  </label>
                  <select
                    required
                    value={shipping.city}
                    onChange={(e) => updateShipping("city", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">請選擇地區</option>
                    {shippingDistrictOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">地址</label>
                  <input
                    required
                    value={shipping.address1}
                    onChange={(e) => updateShipping("address1", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>
          )}

          <section className="rounded-xl bg-surface p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-text">
              訂單備註
            </h2>
            <textarea
              rows={4}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className={`${inputClass} mt-4`}
              placeholder="如有特別要求，請在此留言。"
            />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl bg-surface p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-text">
              訂購紀錄
            </h2>

            <ul className="mt-4 space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-bg">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">{item.name}</p>
                    <p className="mt-1 text-xs text-muted">數量 {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-text">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-black/5 pt-4">
              <h3 className="text-sm font-medium text-text">配送方式</h3>
              <div className="mt-3 space-y-2">
                {CHECKOUT_SHIPPING_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2.5 text-sm"
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={option.id}
                      checked={shippingMethod === option.id}
                      onChange={() => setShippingMethod(option.id)}
                    />
                    <span className="flex-1">{option.label}</span>
                    <span className="text-muted">
                      {option.fee > 0 ? formatPrice(option.fee) : "免費"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-black/5 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">商品總計</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">運費</span>
                <span>{shippingFee > 0 ? formatPrice(shippingFee) : "免費"}</span>
              </div>
              <div className="flex justify-between border-t border-black/5 pt-3 text-base font-semibold text-text">
                <span>帳單總計</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-black/20"
              />
              <span>
                本人已年滿 18 歲，並同意本網站的
                <Link href="/about" className="mx-1 text-text underline">
                  條款及細則
                </Link>
                。
              </span>
            </label>

            {error && (
              <p className="mt-4 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !agreedTerms}
              className="mt-5 w-full cursor-pointer rounded-lg bg-accent px-4 py-3.5 text-sm font-bold text-accent-contrast disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "前往付款中…" : "前往結帳"}
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}
