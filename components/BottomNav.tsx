"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppIcon, { type AppIconName } from "@/components/AppIcon";

// 光影大工 Product V2：手机端保留学长分支的底部导航，并补齐摄影师入口。
const items: { href: string; label: string; icon: AppIconName; primary?: boolean }[] = [
  { href: "/", label: "首页", icon: "home" },
  { href: "/map/", label: "地图", icon: "map" },
  { href: "/submit/", label: "上传", icon: "plus", primary: true },
  { href: "/planner/", label: "规划", icon: "planner" },
  { href: "/photographers/", label: "摄影师", icon: "camera" },
  { href: "/me/", label: "我的", icon: "user" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return <nav aria-label="一级导航" className="fixed inset-x-0 bottom-0 z-[800] border-t border-slate-200 bg-white/96 px-3 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur lg:hidden">
    <div className="mx-auto grid max-w-md grid-cols-6">{items.map((item) => {
      const baseHref = item.href === "/" ? "/" : item.href.slice(0, -1);
      const active = item.href === "/" ? pathname === "/" : pathname === baseHref || pathname.startsWith(item.href);
      return <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition ${active ? "text-sea" : "text-slate-400"}`} aria-current={active ? "page" : undefined}>
        <span className={item.primary ? "grid -mt-5 h-11 w-11 place-items-center rounded-full border-4 border-white bg-sea text-white shadow-[0_8px_20px_rgba(22,123,117,.26)]" : ""}>
          <AppIcon name={item.icon} className={`${item.primary ? "h-[22px] w-[22px] text-white" : `h-[22px] w-[22px] ${active ? "text-sea" : "text-slate-400"}`}`} strokeWidth={active || item.primary ? 2.2 : 1.8} />
        </span>
        {item.label}
      </Link>;
    })}</div>
  </nav>;
}
