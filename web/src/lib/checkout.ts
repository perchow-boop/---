import type { Product } from "@/types/product";
import type { CheckoutLineItem } from "@/types/checkout";
import { getProductById, CURRENCY } from "@/lib/products";
import { getAppUrl } from "@/lib/stripe";
import type Stripe from "stripe";
import type { CheckoutShippingMethod } from "@/types/checkout";
import { getShippingFee } from "@/lib/shipping";

export type ResolvedCheckoutItem = {
  product: Product;
  quantity: number;
};

export async function resolveCheckoutItems(
  items: CheckoutLineItem[],
): Promise<ResolvedCheckoutItem[] | null> {
  if (!items.length) return null;

  const resolved: ResolvedCheckoutItem[] = [];

  for (const item of items) {
    if (!item.id || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return null;
    }

    const product = await getProductById(item.id);
    if (!product) return null;

    const existing = resolved.find((entry) => entry.product.id === product.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      resolved.push({ product, quantity: item.quantity });
    }
  }

  return resolved.length ? resolved : null;
}

export function toStripeLineItems(
  items: ResolvedCheckoutItem[],
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const appUrl = getAppUrl();

  return items.map(({ product, quantity }) => ({
    quantity,
    price_data: {
      currency: CURRENCY.toLowerCase(),
      // product.price 以「港元」為單位，Stripe 需要「分」（最小貨幣單位）
      unit_amount: product.price * 100,
      product_data: {
        name: product.name,
        description: product.meta,
        images: [`${appUrl}${product.image}`],
        metadata: {
          productId: product.id,
          category: product.category,
        },
      },
    },
  }));
}

export function toStripeShippingLineItem(
  method: CheckoutShippingMethod,
): Stripe.Checkout.SessionCreateParams.LineItem | null {
  const fee = getShippingFee(method);
  if (fee <= 0) return null;

  const label =
    method === "delivery" ? "香港地區運費" : "店鋪自取";

  return {
    quantity: 1,
    price_data: {
      currency: CURRENCY.toLowerCase(),
      unit_amount: fee * 100,
      product_data: {
        name: label,
      },
    },
  };
}
