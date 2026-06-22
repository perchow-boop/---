export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-10 font-serif text-4xl font-semibold text-text">
        聯絡我們
      </h1>
      <article className="rounded-xl bg-surface p-8 text-[17px] leading-[1.9] shadow-[0_8px_24px_rgba(15,15,15,0.06)]">
        <p className="text-muted">如有查詢，歡迎電郵聯絡我們：</p>
        <p className="mt-4">
          <a
            href="mailto:service@Lukibou.com"
            className="font-medium text-text underline-offset-4 hover:underline"
          >
            service@Lukibou.com
          </a>
        </p>
      </article>
    </div>
  );
}
