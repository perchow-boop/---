import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <p className="text-5xl">↩</p>
      <h1 className="mt-6 font-serif text-3xl font-semibold text-text">
        結帳已取消
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        你的購物車內容已保留，可隨時回來完成付款。
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/products"
          className="inline-block rounded-lg bg-accent px-6 py-3 text-sm font-bold text-accent-contrast"
        >
          返回商店
        </Link>
        <Link
          href="/"
          className="text-sm text-muted underline-offset-4 hover:text-text hover:underline"
        >
          返回首頁
        </Link>
      </div>
    </div>
  );
}
