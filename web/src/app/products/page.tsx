import { Suspense } from "react";
import { getProductCategories, getProductsFromDb } from "@/lib/products";
import { ProductGrid } from "@/components/products/ProductGrid";
import {
  ProductFilter,
  ProductsPageIntro,
} from "@/components/products/ProductFilter";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams;
  const products = await getProductsFromDb();
  const categories = getProductCategories(products);
  const filtered =
    category && category !== "全部"
      ? products.filter((product) => product.category === category)
      : products;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <ProductsPageIntro />
      <Suspense fallback={<div className="mb-8 h-10" />}>
        <div className="mb-8">
          <ProductFilter categories={categories} />
        </div>
      </Suspense>
      <ProductGrid products={filtered} />
    </div>
  );
}
