import Link from "next/link";
import Image from "next/image";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { HeaderNav } from "@/components/layout/HeaderNav";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-black/5 bg-white/60 px-6 py-3.5 backdrop-blur-md">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-serif text-lg font-bold tracking-widest text-text"
        aria-label="Lukibou 首頁"
      >
        <Image
          src="/pics/lukibou.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
        Lukibou
      </Link>

      <HeaderNav />
      <HeaderActions />
    </header>
  );
}
