"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/AppIcon";
import { featuredWorks } from "@/data/works";
import type { PhotographyWork } from "@/types/work";

export default function PhotographySelections() {
  const [activeWork, setActiveWork] = useState<PhotographyWork | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(JSON.parse(window.localStorage.getItem("guangying-favorite-work-ids") || "[]") as string[]);
  }, []);

  useEffect(() => {
    if (!activeWork) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveWork(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [activeWork]);

  function toggleFavorite(workId: string) {
    const next = favorites.includes(workId) ? favorites.filter((id) => id !== workId) : [...favorites, workId];
    setFavorites(next);
    window.localStorage.setItem("guangying-favorite-work-ids", JSON.stringify(next));
  }

  return <>
    <div className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {featuredWorks.map((work, index) => <button key={work.workId} type="button" onClick={() => setActiveWork(work)} aria-label={`查看作品：${work.title}`} className={`${index === 0 ? "w-[45vw] max-w-[190px]" : "w-[41vw] max-w-[174px]"} shrink-0 snap-start overflow-hidden rounded-[14px] bg-slate-200 shadow-sm`}>
        <img src={work.thumbnail} alt={work.title} className={`${index % 3 === 1 ? "aspect-[.84]" : "aspect-[.9]"} h-full w-full object-cover`} />
      </button>)}
    </div>

    {activeWork && <div role="dialog" aria-modal="true" aria-label={`${activeWork.title}作品预览`} className="fixed inset-0 z-[1200] flex h-[100dvh] flex-col bg-[#080b0d] text-white">
      <div className="flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-end justify-between px-3 pb-2 pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={() => setActiveWork(null)} aria-label="关闭作品预览" className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><AppIcon name="close" className="h-5 w-5" /></button>
        <span className="max-w-[65vw] truncate text-xs text-white/55">{activeWork.title}</span>
        <span className="h-10 w-10" aria-hidden="true" />
      </div>

      <figure className="flex min-h-0 flex-1 items-center justify-center px-2 py-2">
        <img src={activeWork.image} alt={activeWork.title} className="max-h-full max-w-full object-contain" />
      </figure>

      <section className="shrink-0 border-t border-white/12 bg-[#101519] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/12 text-sm font-semibold">{activeWork.photographer.slice(0, 1)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{activeWork.photographer}</p><p className="mt-0.5 text-xs text-white/55">{[activeWork.spotName, activeWork.shotTime].filter(Boolean).join(" · ")}</p></div></div>
        <p className="mt-3 text-xs text-white/65">{activeWork.tags.join(" / ")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => toggleFavorite(activeWork.workId)} className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${favorites.includes(activeWork.workId) ? "bg-white text-ink" : "bg-white/10 text-white"}`}><AppIcon name="heart" className="h-4 w-4" />{favorites.includes(activeWork.workId) ? "已收藏" : "收藏"}</button>
          {activeWork.spotId && <Link href={`/spot/${activeWork.spotId}/`} className="flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold"><AppIcon name="location" className="h-4 w-4" />查看拍摄地点</Link>}
          {activeWork.cameraPositionId && <Link href={`/spot/ling-shui-lake/view/?position=${activeWork.cameraPositionId}`} className="flex h-10 items-center gap-1.5 rounded-full bg-sea px-3 text-xs font-semibold"><AppIcon name="camera" className="h-4 w-4" />查看这个机位</Link>}
        </div>
      </section>
    </div>}
  </>;
}
