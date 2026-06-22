import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-text">會員註冊</h1>
      <p className="mt-3 text-muted">建立帳戶以追蹤訂單與收藏商品。</p>
      <RegisterForm />
    </div>
  );
}
