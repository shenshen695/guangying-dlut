"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/AppIcon";
import type { PhotographyWork } from "@/types/work";

export default function WorkLightbox({ work, onClose }: { work: PhotographyWork; onClose: () => void }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const ids = JSON.parse(window.localStorage.getItem("guangying-favorite-work-ids") || "[]") as string[];
    setSaved(ids.includes(work.workId));
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose, work.workId]);

  function toggleSaved() {
    const ids = JSON.parse(window.localStorage.getItem("guangying-favorite-work-ids") || "[]") as string[];
    const next = ids.includes(work.workId) ? ids.filter((id) => id !== work.workId) : [...ids, work.workId];
    window.localStorage.setItem("guangying-favorite-work-ids", JSON.stringify(next));
    setSaved(next.includes(work.workId));
  }

  return <div role="dialog" aria-modal="true" aria-label={`${work.title}作品预览`} className="fixed inset-0 z-[1200] flex h-[100dvh] flex-col bg-[#080b0d] text-white">
    <div className="flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-end justify-between px-3 pb-2 pt-[env(safe-area-inset-top)]">
      <button type="button" onClick={onClose} aria-label="关闭作品预览" className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><AppIcon name="close" className="h-5 w-5" /></button>
      <span className="max-w-[62vw] truncate text-xs text-white/60">{work.title}</span>
      <span className="h-10 w-10" aria-hidden="true" />
    </div>
    <figure className="flex min-h-0 flex-1 items-center justify-center px-2 py-2"><img src={work.image} alt={work.title} className="max-h-full max-w-full object-contain" /></figure>
    <section className="shrink-0 border-t border-white/10 bg-[#101519] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <Link href={`/photographers/${work.photographerId}/`} className="flex items-center gap-3 rounded-xl py-1">
        {work.photographerAvatar ? <img src={work.photographerAvatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <span className="grid h-10 w-10 rounded-full bg-white/10 place-items-center">{work.photographer.slice(0, 1)}</span>}
        <span className="min-w-0"><strong className="block truncate text-sm">{work.photographer}</strong><span className="mt-0.5 block text-xs text-white/55">{[work.spotName, work.shotTime].filter(Boolean).join(" · ")}</span></span>
        <AppIcon name="arrow" className="ml-auto h-4 w-4 text-white/45" />
      </Link>
      <p className="mt-2 text-xs text-white/65">{work.tags.join(" / ")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={toggleSaved} className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${saved ? "bg-white text-ink" : "bg-white/10"}`}><AppIcon name="heart" className="h-4 w-4" />{saved ? "已收藏" : "收藏"}</button>
        {work.spotId && <Link href={`/spot/${work.spotId}/`} className="flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold"><AppIcon name="location" className="h-4 w-4" />查看拍摄地点</Link>}
        {work.cameraPositionId && <Link href={`/spot/ling-shui-lake/view/?position=${work.cameraPositionId}`} className="flex h-10 items-center gap-1.5 rounded-full bg-sea px-3 text-xs font-semibold"><AppIcon name="camera" className="h-4 w-4" />查看这个机位</Link>}
      </div>
    </section>
  </div>;
}
