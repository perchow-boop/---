import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden px-6 text-accent-contrast" aria-label="主視覺">
      <div
        className="absolute inset-0 bg-cover bg-center contrast-[0.95] saturate-90"
        style={{ backgroundImage: "url('/pics/main_bg.png')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[var(--overlay)]" aria-hidden />

      <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-10 py-20 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-10">
        <div className="max-w-2xl">
          <h1 className="mb-4 font-serif text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)] md:text-5xl">
            一紙一願 一水一淨
          </h1>
          <p className="mb-7 max-w-xl text-lg leading-relaxed text-white/95">
            儀式簡潔而有意義
            <br />
            寫下・放下・願行
          </p>
          <Link
            href="/products"
            className="inline-block rounded-lg bg-accent px-6 py-3.5 text-sm font-bold tracking-wide text-accent-contrast shadow-[0_8px_28px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5"
          >
            前往商店
          </Link>
        </div>

        <div className="aspect-video overflow-hidden rounded-[10px] bg-black shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
          <video
            className="h-full w-full object-cover"
            src="/videos/video01.mp4"
            controls
            playsInline
            preload="metadata"
            aria-label="品牌介紹影片"
          >
            你的瀏覽器不支援影片播放。
          </video>
        </div>
      </div>
    </section>
  );
}
