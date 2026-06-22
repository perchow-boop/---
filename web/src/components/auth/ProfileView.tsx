"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { OrderHistory } from "@/components/auth/OrderHistory";
import { AddressBook } from "@/components/auth/member/AddressBook";
import { ChangePasswordForm } from "@/components/auth/member/ChangePasswordForm";
import { FavoritesList } from "@/components/auth/member/FavoritesList";
import { MemberAccountForm } from "@/components/auth/member/MemberAccountForm";
import { MemberCenterLayout } from "@/components/auth/member/MemberCenterLayout";
import { MemberDashboard } from "@/components/auth/member/MemberDashboard";
import { MEMBER_TAB_TITLES, type MemberTab } from "@/components/auth/member/types";

export function ProfileView() {
  const router = useRouter();
  const { user, token, loading, logout, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<MemberTab>("dashboard");

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, token, router]);

  useEffect(() => {
    if (token) {
      refreshProfile().catch(() => {
        router.replace("/login");
      });
    }
  }, [token, refreshProfile, router]);

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  if (loading || !user || !token) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center text-muted">
        載入中…
      </div>
    );
  }

  return (
    <MemberCenterLayout
      activeTab={activeTab}
      title={MEMBER_TAB_TITLES[activeTab]}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === "dashboard" && <MemberDashboard user={user} />}

      {activeTab === "account" && (
        <MemberAccountForm
          user={user}
          token={token}
          onUpdated={refreshProfile}
        />
      )}

      {activeTab === "password" && <ChangePasswordForm token={token} />}

      {activeTab === "addresses" && (
        <AddressBook user={user} token={token} onUpdated={refreshProfile} />
      )}

      {activeTab === "orders" && <OrderHistory token={token} />}

      {activeTab === "favorites" && <FavoritesList />}
    </MemberCenterLayout>
  );
}
