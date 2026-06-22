import { fetchProduct, fetchProducts } from "@/lib/products-api";
import type { DbProduct } from "@/types/db-product";
import type { Product } from "@/types/product";

export const CURRENCY = "HKD" as const;

export function getProductCategories(products: Product[]): string[] {
  const types = new Set<string>();

  for (const product of products) {
    if (product.category) {
      types.add(product.category);
    }
  }

  return ["全部", ...Array.from(types)];
}

function parseDescription(description: string | null) {
  const raw = (description ?? "").trim();
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const usage = lines.find((line) => line.startsWith("適合：")) ?? "";
  const contentLines = lines.filter(
    (line) =>
      !line.startsWith("適合：") &&
      !line.startsWith("[") &&
      !line.startsWith("*"),
  );

  const body = contentLines.join("\n").trim();
  const strippedUsage = usage.replace(/^適合：\s*/, "").trim();
  const summary = body || strippedUsage || raw;

  return {
    usage,
    meta: summary.length > 36 ? `${summary.slice(0, 36)}…` : summary,
    description: body,
    features: contentLines.length > 1 ? contentLines.slice(1) : [],
  };
}

export function mapDbProductToProduct(db: DbProduct): Product {
  const parsed = parseDescription(db.description);
  const image = db.image_url || "/pics/cat01.png";

  return {
    id: String(db.product_id),
    sku: db.type_id ?? "",
    name: db.name,
    category: db.type ?? "",
    meta: parsed.meta,
    description: parsed.description,
    price: db.price,
    image,
    images: [image],
    stock: db.stock,
    inStock: db.stock > 0,
    usage: parsed.usage,
    features: parsed.features,
  };
}

export async function getProductsFromDb(): Promise<Product[]> {
  const data = await fetchProducts();
  return data.products.map(mapDbProductToProduct);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) {
    return undefined;
  }

  try {
    const data = await fetchProduct(productId);
    return mapDbProductToProduct(data.product);
  } catch {
    return undefined;
  }
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("zh-Hant-HK", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 2,
  }).format(price);
}

export type StockStatusInfo = {
  label: string;
  className: string;
  dotClassName: string;
  showDot: boolean;
  canPurchase: boolean;
};

export function getStockStatus(stock: number): StockStatusInfo {
  if (stock >= 20) {
    return {
      label: "現貨供應",
      className: "text-green-700",
      dotClassName: "bg-green-600",
      showDot: true,
      canPurchase: true,
    };
  }

  if (stock >= 1) {
    return {
      label: "即將售罄",
      className: "text-orange-600",
      dotClassName: "bg-orange-500",
      showDot: true,
      canPurchase: true,
    };
  }

  if (stock === 0) {
    return {
      label: "已售完，補貨中",
      className: "text-red-700",
      dotClassName: "bg-red-600",
      showDot: false,
      canPurchase: false,
    };
  }

  return {
    label: "已售完",
    className: "text-muted",
    dotClassName: "bg-muted",
    showDot: false,
    canPurchase: false,
  };
}
