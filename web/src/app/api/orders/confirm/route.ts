import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { persistOrderFromStripeSession } from "@/lib/orders-server";

export async function POST(request: Request) {
  try {
    const { session_id: sessionId } = (await request.json()) as {
      session_id?: string;
    };

    if (!sessionId) {
      return NextResponse.json({ error: "缺少 session_id" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "付款尚未完成" }, { status: 400 });
    }

    const result = await persistOrderFromStripeSession(session);

    return NextResponse.json({
      message: result?.created === false ? "訂單已存在" : "訂單已建立",
      order_id: result?.order_id ?? null,
      payment_no: result?.payment_no ?? null,
    });
  } catch (error) {
    console.error("[POST /api/orders/confirm]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "訂單確認失敗，請稍後再試",
      },
      { status: 500 },
    );
  }
}
