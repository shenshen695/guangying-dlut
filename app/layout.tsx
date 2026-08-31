import type { Metadata } from "next";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = { title: "光影大工", description: "校园毕业影像地图与摄影者连接平台" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}<BottomNav /></body></html>;
}
