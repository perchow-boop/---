import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const notoSans = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans",
});

const notoSerif = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-serif",
});

export const metadata: Metadata = {
  title: "Lukibou — 一紙一願 一水一淨",
  description: "水溶符紙品牌 Lukibou，儀式簡潔而有意義。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${notoSans.variable} ${notoSerif.variable}`}>
      <body className="min-h-screen antialiased">
        <AppProviders>
          <Header />
          <main className="pt-[60px]">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
