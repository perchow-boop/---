"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ProductFilterProps = {
  categories: string[];
};

export function ProductFilter({ categories }: ProductFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "全部";

  function setCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "全部") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="商品分類">
      {categories.map((category) => {
        const isActive = active === category;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setCategory(category)}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent text-accent-contrast"
                : "bg-surface text-muted hover:bg-black/5 hover:text-text"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

export function ProductsPageIntro() {
  return (
    <div className="mb-8">
      <p className="text-sm text-muted">
        <Link href="/" className="hover:text-text hover:underline">
          首頁
        </Link>
        <span className="mx-2">/</span>
        <span>系列商品</span>
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-text">
        系列商品
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        探索水溶符紙系列——祈願、護佑與書寫，每款皆承載儀式與手作溫度。
      </p>
    </div>
  );
}
