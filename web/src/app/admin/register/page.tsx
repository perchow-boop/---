import { AdminRegisterForm } from "@/components/admin/AdminRegisterForm";

export default function AdminRegisterPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold text-text">管理員註冊</h1>
      <p className="mt-3 text-muted">
        建立 admins 資料表帳號。首位註冊者將成為 superadmin。
      </p>
      <AdminRegisterForm />
    </div>
  );
}
