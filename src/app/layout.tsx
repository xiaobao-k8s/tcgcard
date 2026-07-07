import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "童年神奇卡片百科",
  description: "童年卡片图鉴 - 怀旧神奇宝贝卡收藏",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
