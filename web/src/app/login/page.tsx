import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-text">會員登入</h1>
      <p className="mt-3 text-muted">登入以查看訂單與管理帳戶。</p>
      <Suspense fallback={<p className="mt-8 text-sm text-muted">載入中…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
