"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MEMBER_NAV_ITEMS, type MemberTab } from "./types";

type MemberCenterLayoutProps = {
  activeTab: MemberTab;
  title: string;
  onTabChange: (tab: MemberTab) => void;
  onLogout: () => void;
  children: ReactNode;
};

function ChevronRight() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4 shrink-0 text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
      />
    </svg>
  );
}

export function MemberCenterLayout({
  activeTab,
  title,
  onTabChange,
  onLogout,
  children,
}: MemberCenterLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <nav className="text-sm text-muted" aria-label="麵包屑">
        <Link href="/" className="transition-colors hover:text-text">
          首頁
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text">我的帳戶</span>
      </nav>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-64">
          <nav
            className="overflow-hidden rounded-xl border border-black/10 bg-surface"
            aria-label="會員中心選單"
          >
            {MEMBER_NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full cursor-pointer items-center justify-between border-b border-black/5 px-5 py-4 text-left text-sm transition-colors last:border-b-0 ${
                    isActive
                      ? "bg-bg font-semibold text-text"
                      : "text-text hover:bg-bg/60"
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight />
                </button>
              );
            })}

            <div className="border-t border-black/10">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full cursor-pointer items-center gap-2 px-5 py-4 text-left text-sm text-muted transition-colors hover:bg-bg/60 hover:text-text"
              >
                <LogoutIcon />
                會員登出
              </button>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-text">{title}</h1>
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
