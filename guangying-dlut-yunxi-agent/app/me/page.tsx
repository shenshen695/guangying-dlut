"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/AppIcon";
import BottomNav from "@/components/BottomNav";
import { getCampusMedia } from "@/data/media";

type SavedPlan = { title: string; summary: string; spotIds: string[]; stops: { spot: { name: string } }[]; peopleCount?: number; shootType?: string; timeOfDay?: string; duration?: string };
const samplePlan: SavedPlan = { title: "毕业照 · 4人", summary: "周六 16:00 · 2 小时", spotIds: ["main-building", "ling-shui-lake", "bochuan"], stops: [{ spot: { name: "主楼" } }, { spot: { name: "凌水湖" } }, { spot: { name: "伯川图书馆" } }] };
const favorites = [
  { name: "凌水湖机位 A", note: "日落摄影", media: "lake-golden", href: "/spot/ling-shui-lake/view/?position=lake-west" },
  { name: "主楼广场", note: "对称构图", media: "main-building", href: "/spot/main-building/" },
  { name: "伯川图书馆", note: "建筑线条", media: "autumn-light", href: "/spot/bochuan/" },
];
const works = [
  { name: "红桥", status: "已发布", media: "lake-portrait", tone: "bg-sea text-white" },
  { name: "湖岸日落", status: "审核中", media: "lake-golden", tone: "bg-[#f59e0b] text-white" },
  { name: "校园银杏", status: "草稿", media: "autumn-walk", tone: "bg-ink/75 text-white" },
];

export default function MePage() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  useEffect(() => { setPlans(JSON.parse(window.localStorage.getItem("guangying-plans") || "[]") as SavedPlan[]); }, []);
  const visiblePlans = plans.length ? plans : [samplePlan];
  const portrait = getCampusMedia("lake-portrait");

  return <main className="min-h-screen overflow-x-clip bg-mist pb-24 text-ink lg:pb-12">
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
      <section className="flex items-center gap-3.5 py-3">
        <img src={portrait.src} alt="校园摄影用户头像" className="h-[62px] w-[62px] rounded-full object-cover object-[50%_74%] ring-2 ring-white shadow-sm" />
        <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-[19px] font-semibold">大工摄影同学</h1><span className="shrink-0 rounded-md bg-sea px-2 py-1 text-[10px] font-bold text-white">Lv.3</span></div><p className="mt-1 text-[12px] font-medium text-slate-500">凌水校区 · 记录校园第 28 天</p></div>
      </section>

      <section className="mt-4 grid grid-cols-4 rounded-[16px] border border-slate-200 bg-white px-2 py-4 shadow-[0_5px_18px_rgba(15,23,42,.06)]">{[
        { label: "收藏", value: "3", href: "#favorites" },
        { label: "规划", value: String(plans.length || 1), href: "#plans" },
        { label: "作品", value: "1", href: "#works" },
        { label: "投稿", value: "3", href: "/submit/" },
      ].map((item, index) => <Link key={item.label} href={item.href} className={`${index ? "border-l border-slate-200" : ""} text-center`}><strong className="block text-[19px] font-semibold">{item.value}</strong><span className="mt-1 block text-[11px] font-medium text-slate-500">{item.label}</span></Link>)}</section>

      <section id="favorites" className="scroll-mt-3 pt-7">
        <SectionHeader title="我的收藏" action="查看全部" href="/map/" />
        <div className="mt-3 grid grid-cols-3 gap-2">{favorites.map((item) => { const media = getCampusMedia(item.media); return <Link key={item.name} href={item.href} className="min-w-0"><span className="relative block aspect-[.86] overflow-hidden rounded-[12px] bg-slate-200"><img src={media.src} alt={media.alt} className="h-full w-full object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-black/68 via-transparent to-transparent" /><strong className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-1 text-[11px] font-semibold text-white"><span className="line-clamp-2">{item.name}</span><AppIcon name="arrow" className="h-3.5 w-3.5 shrink-0" /></strong></span><span className="mt-1.5 block truncate text-[10px] font-medium text-slate-500">{item.note}</span></Link>; })}</div>
      </section>

      <section id="plans" className="scroll-mt-3 border-t border-slate-200 pt-6 mt-6">
        <SectionHeader title="我的规划" action="查看全部" href="/planner/" />
        <div className="mt-3 space-y-3">{visiblePlans.slice(0, 2).map((plan, index) => <Link key={`${plan.title}-${index}`} href={`/map/?spots=${encodeURIComponent(plan.spotIds.join(","))}&style=${encodeURIComponent(plan.title)}`} className="block rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_4px_15px_rgba(15,23,42,.05)]"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7f1f1] text-sea"><AppIcon name="route" className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate text-[15px] font-semibold">{plan.shootType ? `${plan.shootType} · ${plan.peopleCount || ""}人` : plan.title}</h3><AppIcon name="arrow" className="h-4 w-4 shrink-0 text-slate-400" /></div><p className="mt-1 truncate text-[11px] text-slate-500">{plan.stops.map((stop) => stop.spot.name).join(" → ")}</p><p className="mt-1.5 text-[11px] text-slate-400">{plan.timeOfDay && plan.duration ? `${plan.timeOfDay} · ${plan.duration}` : plan.summary}</p><div className="mt-3 flex items-center gap-3"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><span className="block h-full w-2/3 rounded-full bg-sea" /></span><span className="text-[10px] font-semibold text-slate-500">2/3</span></div></div></div></Link>)}</div>
      </section>

      <section id="works" className="scroll-mt-3 border-t border-slate-200 pt-6 mt-6">
        <SectionHeader title="我的作品" action="查看全部" href="/submit/" />
        <div className="mt-3 grid grid-cols-3 gap-2">{works.map((item) => { const media = getCampusMedia(item.media); return <Link key={item.name} href="/submit/" className="relative aspect-[.9] overflow-hidden rounded-[12px] bg-slate-200"><img src={media.src} alt={media.alt} className="h-full w-full object-cover" /><span className={`absolute right-1.5 top-1.5 rounded-full px-2 py-1 text-[9px] font-semibold ${item.tone}`}>{item.status}</span><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-7 text-[10px] font-semibold text-white">{item.name}</span></Link>; })}</div>
        <Link href="/submit/" className="mt-3 flex items-center justify-between rounded-[14px] bg-[#e7f1f1] px-4 py-3"><span className="flex items-center gap-2 text-[13px] font-semibold text-sea"><AppIcon name="upload" className="h-[18px] w-[18px]" />上传作品，参与校园影像共建</span><AppIcon name="arrow" className="h-4 w-4 text-sea" /></Link>
      </section>
    </div>
    <BottomNav />
  </main>;
}

function SectionHeader({ title, action, href }: { title: string; action: string; href: string }) {
  return <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">{title}</h2><Link href={href} className="flex items-center gap-1 text-[11px] font-semibold text-sea">{action}<AppIcon name="arrow" className="h-3.5 w-3.5" /></Link></div>;
}
