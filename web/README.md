# Lukibou Web

基於 `main.html` 設計的 Next.js (App Router) + Tailwind CSS 電商前端，整合 **Stripe Checkout**。

## 功能

- **首頁** (`/`)：Hero、分類卡片、關於我們預覽
- **商品列表** (`/products`)：分類篩選、加入購物車
- **購物車**：側邊抽屜、數量調整、localStorage 持久化
- **Stripe 結帳**：購物車 → Stripe Hosted Checkout → 成功 / 取消頁
- **Webhook** (`/api/webhooks/stripe`)：接收 `checkout.session.completed`

## 快速開始

```bash
cd web
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

瀏覽 [http://localhost:3000](http://localhost:3000)

## Stripe 設定

1. 至 [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) 取得 **Test mode** 金鑰
2. 填入 `.env.local`：
   - `STRIPE_SECRET_KEY` — 私密金鑰（僅伺服器端）
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — 公開金鑰（預留，Checkout 導向模式目前由 API 建立 session）
   - `NEXT_PUBLIC_APP_URL` — 本站網址，本地為 `http://localhost:3000`
3. 測試卡號：`4242 4242 4242 4242`、任意未來日期與 CVC

### 本地 Webhook（選用）

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

將 CLI 輸出的 `whsec_...` 填入 `STRIPE_WEBHOOK_SECRET`。

## 結帳流程

```
購物車 → POST /api/checkout → Stripe Checkout → /checkout/success | /checkout/cancel
```

- 伺服器端以 `lib/products.ts` 驗證商品 ID 與價格，防止客戶端竄改
- 幣別：HKD（港元）
- 支援香港、台灣、澳門收貨地址

## 專案結構

```
src/
  app/
    api/checkout/route.ts       # 建立 Stripe Checkout Session
    api/webhooks/stripe/route.ts
    checkout/success/page.tsx
    checkout/cancel/page.tsx
  components/cart/
    CartDrawer.tsx
    CheckoutButton.tsx
  lib/
    stripe.ts
    checkout.ts
    products.ts
```

## 後續可擴充

- 訂單 email 通知（Resend / SendGrid）
- Stripe Customer Portal 退貨退款
- 商品詳情頁 `/products/[id]`
