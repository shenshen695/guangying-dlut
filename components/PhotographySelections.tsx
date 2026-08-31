"use client";

import Link from "next/link";
import { useState } from "react";
import AppIcon from "@/components/AppIcon";
import WorkLightbox from "@/components/WorkLightbox";
import { featuredWorks } from "@/data/works";
import type { PhotographyWork } from "@/types/work";

export default function PhotographySelections() {
  const [activeWork, setActiveWork] = useState<PhotographyWork | null>(null);
  return <>
    <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {featuredWorks.slice(0, 8).map((work) => <article key={work.workId} className="w-[66vw] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-[16px] bg-white shadow-[0_5px_16px_rgba(15,23,42,.08)]">
        <button type="button" onClick={() => setActiveWork(work)} aria-label={`查看作品：${work.title}`} className="block w-full overflow-hidden bg-slate-200"><img src={work.thumbnail} alt={work.title} className="aspect-[1.22] w-full object-cover" /></button>
        <div className="px-3 pb-3 pt-2.5"><h3 className="truncate text-[13px] font-semibold">{work.title}</h3><div className="mt-2 flex items-center gap-2"><Link href={`/photographers/${work.photographerId}/`} className="flex min-w-0 items-center gap-2"><img src={work.photographerAvatar || work.thumbnail} alt="" className="h-6 w-6 rounded-full object-cover" /><span className="truncate text-[10px] font-medium text-slate-500">{work.photographer}</span></Link><span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] text-slate-400"><AppIcon name="location" className="h-3.5 w-3.5" />{work.spotName || work.shotTime}</span></div></div>
      </article>)}
    </div>
    {activeWork && <WorkLightbox work={activeWork} onClose={() => setActiveWork(null)} />}
  </>;
}
