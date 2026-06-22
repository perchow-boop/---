"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPrice, getStockStatus } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { FavoriteButton } from "@/components/products/FavoriteButton";
import { StockStatus } from "./StockStatus";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const stockStatus = getStockStatus(product.stock);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-surface shadow-[0_8px_20px_rgba(15,15,15,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,15,15,0.08)]">
      <div className="relative aspect-[4/3] bg-bg">
        <Link href={`/products/${product.id}`} className="block h-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton productId={product.id} compact />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {product.category}
        </p>
        <h3 className="mt-1 font-serif text-lg font-semibold text-text">
          <Link
            href={`/products/${product.id}`}
            className="hover:underline"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
          {product.description || product.usage}
        </p>
        <StockStatus stock={product.stock} className="mt-4" />
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-text">
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            disabled={!stockStatus.canPurchase}
            onClick={() => addItem(product)}
            className="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-contrast transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            加入購物車
          </button>
        </div>
      </div>
    </article>
  );
}
