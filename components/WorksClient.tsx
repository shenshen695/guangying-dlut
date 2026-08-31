"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppIcon from "@/components/AppIcon";
import WorkLightbox from "@/components/WorkLightbox";
import { featuredWorks, workCategories } from "@/data/works";
import type { PhotographyWork } from "@/types/work";

export default function WorksClient() {
  const [filter, setFilter] = useState<(typeof workCategories)[number]>("最新");
  const [activeWork, setActiveWork] = useState<PhotographyWork | null>(null);
  const works = useMemo(() => {
    const filtered = filter === "最新" || filter === "热门" ? featuredWorks : featuredWorks.filter((work) => work.categories.includes(filter));
    return [...filtered].sort((a, b) => filter === "热门" ? (b.likes || 0) - (a.likes || 0) : b.createdAt.localeCompare(a.createdAt));
  }, [filter]);

  return <>
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{workCategories.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${filter === item ? "bg-ink text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
    {works.length ? <div className="mt-4 columns-2 gap-2.5 md:columns-3 lg:columns-4">{works.map((work) => <article key={work.workId} className="mb-4 break-inside-avoid overflow-hidden rounded-[15px] bg-white shadow-[0_4px_16px_rgba(15,23,42,.07)]">
      <button type="button" onClick={() => setActiveWork(work)} className="block w-full overflow-hidden bg-slate-200" aria-label={`查看作品 ${work.title}`}><img src={work.thumbnail} alt={work.title} className="h-auto w-full object-cover transition duration-300 active:scale-[1.02]" /></button>
      <div className="px-3 pb-3 pt-2.5"><h2 className="line-clamp-2 text-[13px] font-semibold leading-5">{work.title}</h2><div className="mt-2 flex items-center gap-2"><Link href={`/photographers/${work.photographerId}/`} className="flex min-w-0 items-center gap-2"><img src={work.photographerAvatar || work.thumbnail} alt="" className="h-6 w-6 rounded-full object-cover" /><span className="truncate text-[10px] font-medium text-slate-500">{work.photographer}</span></Link><span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] text-slate-400"><AppIcon name="heart" className="h-3.5 w-3.5" />{work.likes}</span></div></div>
    </article>)}</div> : <div className="mt-10 rounded-[18px] border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">这一分类正在等待新的校园作品</div>}
    {activeWork && <WorkLightbox work={activeWork} onClose={() => setActiveWork(null)} />}
  </>;
}
