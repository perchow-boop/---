"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/types/product";
import { formatPrice, getStockStatus } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { FavoriteButton } from "@/components/products/FavoriteButton";
import { BackToTop } from "@/components/ui/BackToTop";
import { StockStatus } from "@/components/products/StockStatus";

type ProductDetailProps = {
  product: Product;
};

type TabId = "details" | "features";

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>("details");

  const images = product.images.length ? product.images : [product.image];
  const stockStatus = getStockStatus(product.stock);

  function changeQuantity(delta: number) {
    setQuantity((current) => Math.max(1, current + delta));
  }

  function handleAddToCart() {
    addItem(product, quantity);
  }

  function handleBuyNow() {
    addItem(product, quantity);
    router.push("/checkout");
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted" aria-label="麵包屑">
          <Link href="/" className="hover:text-text hover:underline">
            首頁
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-text hover:underline">
            系列商品
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">{product.name}</span>
        </nav>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 gap-10 border-b border-black/10 pb-12 lg:grid-cols-2 lg:gap-14">
          {/* Image gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-lg border border-black/8 bg-surface">
              <Image
                src={images[activeImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {images.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`relative h-16 w-16 overflow-hidden rounded-md border-2 transition-colors ${
                      activeImage === index
                        ? "border-accent"
                        : "border-transparent hover:border-black/20"
                    }`}
                    aria-label={`檢視圖片 ${index + 1}`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            <p className="text-sm text-muted">型號：{product.sku}</p>
            <h1 className="mt-2 font-serif text-2xl font-semibold leading-snug text-text md:text-3xl">
              {product.name}
            </h1>

            <p className="mt-6 text-3xl font-bold text-accent">
              {formatPrice(product.price)}
            </p>

            <StockStatus stock={product.stock} className="mt-4" />

            <div className="mt-8">
              <label className="mb-2 block text-sm font-medium text-text">
                數量
              </label>
              <div className="inline-flex items-center overflow-hidden rounded-lg border border-black/15">
                <button
                  type="button"
                  onClick={() => changeQuantity(-1)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center text-lg hover:bg-black/5"
                  aria-label="減少數量"
                >
                  −
                </button>
                <span className="flex h-10 min-w-12 items-center justify-center border-x border-black/15 px-3 text-sm font-medium">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => changeQuantity(1)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center text-lg hover:bg-black/5"
                  aria-label="增加數量"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <FavoriteButton productId={product.id} />
              <button
                type="button"
                disabled={!stockStatus.canPurchase}
                onClick={handleAddToCart}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-accent px-5 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span aria-hidden>🛒</span>
                加入購物車
              </button>
              <button
                type="button"
                disabled={!stockStatus.canPurchase}
                onClick={handleBuyNow}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-accent-contrast transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                立即購買
              </button>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="text-sm text-muted">分享</span>
              <div className="flex gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="分享到 Facebook"
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-black/10 hover:bg-black/5"
                >
                  <Image
                    src="/pics/facebook_logo.png"
                    alt=""
                    width={36}
                    height={36}
                    className="h-full w-full object-contain p-1.5"
                  />
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="分享到 Instagram"
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-black/10 hover:bg-black/5"
                >
                  <Image
                    src="/pics/instagram_logo.png"
                    alt=""
                    width={36}
                    height={36}
                    className="h-full w-full object-contain p-1.5"
                  />
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  aria-label="複製連結"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-black/10 hover:bg-black/5"
                >
                  <Image
                    src="/pics/sharelink_logo.png"
                    alt=""
                    width={36}
                    height={36}
                    className="h-full w-full object-contain p-1.5"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10">
          <div className="flex gap-8 border-b border-black/10">
            {(
              [
                { id: "details" as const, label: "產品詳情" },
                { id: "features" as const, label: "產品特點" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer border-b-2 pb-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8 text-[15px] leading-relaxed text-muted" role="tabpanel">
            {activeTab === "details" ? (
              <div className="space-y-3">
                {product.usage ? (
                  <p>
                    <strong className="text-text">{product.usage}</strong>
                  </p>
                ) : null}
                {product.description ? <p>{product.description}</p> : null}
                <p className="text-sm italic">*圖片只供參考</p>
              </div>
            ) : (
              <ul className="list-disc space-y-2 pl-5">
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <BackToTop />
    </>
  );
}
