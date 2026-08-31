"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppIcon, { type AppIconName } from "@/components/AppIcon";

// 五个一级入口在手机和桌面保持同一产品层级，规划固定在中央。
const items: { href: string; label: string; icon: AppIconName }[] = [
  { href: "/", label: "首页", icon: "home" },
  { href: "/map/", label: "地图", icon: "map" },
  { href: "/planner/", label: "规划", icon: "planner" },
  { href: "/photographers/", label: "摄影师", icon: "users" },
  { href: "/me/", label: "我的", icon: "user" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return <nav aria-label="一级导航" className="fixed inset-x-0 bottom-0 z-[800] border-t border-slate-200/80 bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-3px_12px_rgba(15,23,42,.025)]">
    <div className="mx-auto grid max-w-3xl grid-cols-5">{items.map((item) => {
      const baseHref = item.href === "/" ? "/" : item.href.slice(0, -1);
      const active = item.href === "/" ? pathname === "/" : pathname === baseHref || pathname.startsWith(item.href);
      return <Link key={item.href} href={item.href} className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${active ? "text-[#155e63]" : "text-slate-400"}`} aria-current={active ? "page" : undefined}>
        <AppIcon name={item.icon} className="h-[21px] w-[21px]" strokeWidth={active ? 2.15 : 1.75} />
        <span>{item.label}</span>
        {active && <span className="absolute bottom-0 h-0.5 w-7 rounded-full bg-[#155e63]" />}
      </Link>;
    })}</div>
  </nav>;
}
