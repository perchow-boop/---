"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const staticLinks = [
  { href: "/products", label: "系列商品" },
  { href: "/about", label: "關於我們" },
  { href: "/contact", label: "聯絡我們" },
];

export function HeaderNav() {
  const { user, loading } = useAuth();

  return (
    <nav className="hidden items-center gap-5 text-[15px] text-muted md:flex" aria-label="主選單">
      {!loading && !user && (
        <>
          <Link
            href="/register"
            className="rounded-md px-2 py-1.5 transition-colors hover:bg-black/5 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          >
            會員註冊
          </Link>
          <Link
            href="/login"
            className="rounded-md px-2 py-1.5 transition-colors hover:bg-black/5 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          >
            會員登入
          </Link>
        </>
      )}
      {!loading && user && (
        <Link
          href="/profile"
          className="rounded-md px-2 py-1.5 transition-colors hover:bg-black/5 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
        >
          會員中心
        </Link>
      )}
      {staticLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className="rounded-md px-2 py-1.5 transition-colors hover:bg-black/5 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
