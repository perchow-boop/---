"use client";

import type { User } from "@/lib/auth-api";
import { getMemberDisplayName } from "./utils";

type MemberDashboardProps = {
  user: User;
};

export function MemberDashboard({ user }: MemberDashboardProps) {
  const displayName = getMemberDisplayName(user);

  return (
    <section className="rounded-xl border border-black/10 bg-surface px-6 py-16 text-center shadow-sm">
      <p className="text-sm text-muted">歡迎回來！</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <h2 className="text-2xl font-semibold text-text">{displayName}</h2>
        <span className="text-lg font-medium text-teal-600">Lukibou會員</span>
      </div>
      <p className="mt-4 text-sm text-muted">
        會員編號：{user.member_id || "—"}
      </p>
    </section>
  );
}
