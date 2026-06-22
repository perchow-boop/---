import { Suspense } from "react";
import { ClearCartOnSuccess } from "@/components/checkout/ClearCartOnSuccess";
import { ConfirmOrderOnSuccess } from "@/components/checkout/ConfirmOrderOnSuccess";
import { CheckoutSuccessLinks } from "@/components/checkout/CheckoutSuccessLinks";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <Suspense fallback={null}>
        <ClearCartOnSuccess />
        <ConfirmOrderOnSuccess sessionId={sessionId} />
      </Suspense>

      <p className="text-5xl">✓</p>
      <h1 className="mt-6 font-serif text-3xl font-semibold text-text">
        付款成功
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        感謝你的訂購。我們已收到付款，將盡快為你準備商品並寄出。
      </p>
      {sessionId && (
        <p className="mt-3 text-xs text-muted">
          訂單參考：{sessionId}
        </p>
      )}
      <CheckoutSuccessLinks />
    </div>
  );
}
