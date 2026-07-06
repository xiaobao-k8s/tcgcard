import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "奇多卡片百科",
  description: "旋风卡图鉴 - 怀旧宝可梦卡片收藏",
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
