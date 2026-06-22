import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-text">管理員登入</h1>
      <p className="mt-3 text-muted">登入以管理商品資料（admins 資料表）。</p>
      <AdminLoginForm />
    </div>
  );
}
