"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppIcon, { type AppIconName } from "@/components/AppIcon";

// 光影大工 Product V2：四个一级入口使用统一 SVG 图标与 safe-area 布局。
const items: { href: string; label: string; icon: AppIconName }[] = [
  { href: "/", label: "首页", icon: "home" },
  { href: "/map/", label: "地图", icon: "map" },
  { href: "/planner/", label: "规划", icon: "planner" },
  { href: "/me/", label: "我的", icon: "user" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return <nav aria-label="一级导航" className="fixed inset-x-0 bottom-0 z-[800] border-t border-slate-200 bg-white/96 px-3 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur lg:hidden">
    <div className="mx-auto grid max-w-md grid-cols-4">{items.map((item) => {
      const baseHref = item.href === "/" ? "/" : item.href.slice(0, -1);
      const active = item.href === "/" ? pathname === "/" : pathname === baseHref || pathname.startsWith(item.href);
      return <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold transition ${active ? "text-sea" : "text-slate-400"}`} aria-current={active ? "page" : undefined}>
        <AppIcon name={item.icon} className={`h-[22px] w-[22px] ${active ? "text-sea" : "text-slate-400"}`} strokeWidth={active ? 2.2 : 1.8} />
        {item.label}
      </Link>;
    })}</div>
  </nav>;
}
