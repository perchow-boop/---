import Link from "next/link";

export function AboutTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12" aria-label="關於我們">
      <div className="max-w-2xl">
        <h2 className="mb-3 font-serif text-3xl font-semibold text-text">
          源自傳統文化的啟發，注入現代創意。
        </h2>
        <p className="mb-4 text-[15px] leading-relaxed text-muted">
          每款設計都融入日常，將這份祝福帶進您的每一天。
        </p>
        <Link
          href="/about"
          className="text-sm font-semibold text-text underline-offset-4 hover:underline"
        >
          了解更多 →
        </Link>
      </div>
    </section>
  );
}
