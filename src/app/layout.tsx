import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "童年神奇卡片百科",
  description: "童年卡片图鉴 - 怀旧神奇宝贝卡收藏",
};

const NAV_LINKS = [
  { href: "/", label: "🏠 图鉴" },
  { href: "/evolution", label: "⛓️ 进化链" },
  { href: "/rarity", label: "💎 稀有度" },
  { href: "/battle-rules", label: "⚔️ 对战" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {/* Global navigation bar */}
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-primary/95 to-orange-500/95 backdrop-blur-sm border-b border-white/10 px-4 py-0">
          <div className="max-w-6xl mx-auto flex items-center gap-1 sm:gap-4 overflow-x-auto">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/80 hover:text-white text-sm sm:text-base py-3 px-2 sm:px-4 border-b-2 border-transparent hover:border-white/50 transition-all duration-200 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
