export function Footer() {
  return (
    <footer className="mt-12 bg-gradient-to-b from-black/[0.02] to-black/[0.01] px-6 py-9 text-muted">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-6">
        <div className="min-w-40">
          <strong className="text-text">客戶服務</strong>
          <div className="mt-1">常見問題 · 物流運送</div>
        </div>
        <div className="min-w-40">
          <strong className="text-text">關注我們</strong>
          <div className="mt-1">Instagram · Facebook</div>
        </div>
        <div className="min-w-40 md:ml-auto md:text-right">
          <div className="mt-6 md:mt-7">© 2026 Lukibou. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
