"use client";

import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/AppIcon";
import PhotographySelections from "@/components/PhotographySelections";
import { getCampusMedia } from "@/data/media";

const weekly = [
  { title: "凌水湖", detail: "日落倒影 · 湖边人像", media: "lake-golden", href: "/spot/ling-shui-lake/", className: "row-span-2", golden: true },
  { title: "主楼广场", detail: "建筑全景 · 对称构图", media: "main-building", href: "/spot/main-building/" },
  { title: "伯川图书馆", detail: "静谧阅读 · 建筑线条", media: "autumn-light", href: "/spot/bochuan/" },
];

const shortcuts: { label: string; icon: AppIconName; tone: string }[] = [
  { label: "凌水湖", icon: "location", tone: "bg-[#eef7f6] text-sea" },
  { label: "毕业照", icon: "graduation", tone: "bg-[#edf5f6] text-sea" },
  { label: "日落", icon: "sun", tone: "bg-[#fff7e8] text-[#d97706]" },
  { label: "建筑", icon: "building", tone: "bg-[#eef3f7] text-[#397385]" },
  { label: "夜景", icon: "moon", tone: "bg-[#eef3f7] text-sea" },
];

const guides = [
  { title: "毕业照怎么拍", subtitle: "4 个机位 · 构图技巧", media: "main-building", href: "/route/classic-graduation/" },
  { title: "凌水湖日落攻略", subtitle: "时间 · 机位 · 参数", media: "lake-golden", href: "/route/lingshui-sunset/" },
  { title: "建筑摄影指南", subtitle: "对称 · 线条 · 光影", media: "autumn-light", href: "/route/campus-architecture/" },
  { title: "夜景拍摄", subtitle: "长曝光 · 参数", media: "lake-wide", href: "/route/campus-couple-walk/" },
];

export default function MobileHomeSections() {
  const atmosphere = getCampusMedia("autumn-walk");

  return (
    <main className="gy-kelvin-mobile-home min-h-screen overflow-x-clip bg-mist pb-24 text-ink lg:pb-10">
      <div className="mx-auto max-w-3xl pb-8">
        <header className="relative isolate h-[136px] overflow-hidden px-4 pt-[max(1.15rem,env(safe-area-inset-top))] sm:px-7">
          <img src={atmosphere.src} alt="" className="absolute inset-y-0 right-0 -z-20 w-[62%] object-cover object-[70%_32%] opacity-45" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-mist via-mist/95 to-mist/25" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-14 bg-gradient-to-t from-mist to-transparent" />
          <h1 className="pt-4 text-[27px] font-bold tracking-[.08em]">光影大工</h1>
          <p className="mt-2 flex items-center gap-2 text-[13px] font-medium text-slate-600">
            <AppIcon name="sun" className="h-4 w-4 text-coral" strokeWidth={2} />
            今日推荐 · 凌水湖适合拍倒影
          </p>
        </header>

        <div className="px-4 sm:px-7">
          <section className="relative z-10 -mt-3">
            <form action="/map/" className="flex h-14 w-full items-center rounded-[20px] border border-slate-200/90 bg-white p-1.5 pl-4 shadow-[0_8px_22px_rgba(15,23,42,.09)]">
              <AppIcon name="search" className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={2} />
              <input name="search" aria-label="搜索地点、机位、拍摄主题" placeholder="搜索地点、机位、拍摄主题" className="min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-slate-400" />
              <button type="submit" className="h-11 rounded-[14px] bg-sea px-5 text-[14px] font-semibold text-white">搜索</button>
            </form>
            <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {shortcuts.map((item) => (
                <Link key={item.label} href={`/map/?search=${encodeURIComponent(item.label)}`} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold ${item.tone}`}>
                  <AppIcon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <ContentSection title="本周值得拍" action="地图探索" href="/map/">
            <div className="grid h-[258px] grid-cols-[1.42fr_.95fr] grid-rows-2 gap-2.5">
              {weekly.map((item) => {
                const media = getCampusMedia(item.media);
                return (
                  <Link key={item.title} href={item.href} className={`group relative isolate min-h-0 overflow-hidden rounded-[16px] bg-slate-200 shadow-[0_5px_15px_rgba(15,23,42,.12)] ${item.className || ""}`}>
                    <img src={media.src} alt={media.alt} className="h-full w-full object-cover transition duration-300 group-active:scale-[1.02]" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/8 to-transparent" />
                    {item.golden ? (
                      <>
                        <span className="absolute left-3 top-3 rounded-md bg-black/38 px-2 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">GOLDEN HOUR</span>
                        <span className="absolute left-3 top-11 rounded-md bg-black/42 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">17:00-18:30</span>
                      </>
                    ) : null}
                    <span className="absolute inset-x-3 bottom-3 text-white">
                      <strong className={`block font-semibold ${item.golden ? "text-[20px]" : "text-[15px]"}`}>{item.title}</strong>
                      <span className={`mt-0.5 flex items-end justify-between gap-2 ${item.golden ? "text-[12px]" : "text-[10px] leading-4"}`}>
                        <span>{item.detail}</span>
                        <AppIcon name="arrow" className="h-5 w-5 shrink-0" />
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </ContentSection>

          <ContentSection title="大工摄影精选" action="查看全部" href="/me/#works">
            <PhotographySelections />
          </ContentSection>

          <ContentSection title="摄影攻略" action="查看更多" href="/map/">
            <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {guides.map((guide) => {
                const media = getCampusMedia(guide.media);
                return (
                  <Link key={guide.title} href={guide.href} className="relative isolate aspect-[4/3] w-[58vw] max-w-[235px] shrink-0 overflow-hidden rounded-[14px] bg-slate-200 shadow-sm">
                    <img src={media.src} alt={media.alt} className="h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <span className="absolute inset-x-3 bottom-3 text-white">
                      <strong className="block text-[15px] font-semibold">{guide.title}</strong>
                      <span className="mt-1 block text-[11px] text-white/82">{guide.subtitle}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </ContentSection>

          <Link href="/planner/" className="mt-7 flex items-center justify-between border-y border-slate-200 py-4">
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e7f1f1] text-sea">
                <AppIcon name="sparkles" className="h-[18px] w-[18px]" />
              </span>
              <span>
                <strong className="block text-[14px]">为我规划一次拍摄</strong>
                <span className="mt-0.5 block text-[11px] text-slate-500">时间、地点与光线安排</span>
              </span>
            </span>
            <AppIcon name="arrow" className="h-4 w-4 text-sea" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function ContentSection({ title, action, href, children }: { title: string; action?: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>
        {action && href ? (
          <Link href={href} className="flex items-center gap-1 text-[12px] font-semibold text-sea">
            {action}
            <AppIcon name="arrow" className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
