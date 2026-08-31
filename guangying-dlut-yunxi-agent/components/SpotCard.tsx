"use client";

import type { Spot } from "@/types/spot";
import Link from "next/link";
import type { KeyboardEvent } from "react";

type SpotCardProps = { spot: Spot; index: number; selected?: boolean; onSelect: () => void };

export default function SpotCard({ spot, index, selected, onSelect }: SpotCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) return;
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(); }
  }
  return <div role="button" tabIndex={0} onClick={onSelect} onKeyDown={handleKeyDown} className={`group w-full rounded-2xl border p-4 text-left transition ${selected ? "border-coral bg-[#fffaf7]" : "border-black/8 bg-white hover:border-sea/40 hover:bg-white"}`} aria-pressed={selected}>
    <div className="flex items-start gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${selected ? "bg-coral" : "bg-ink"}`}>{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p className="text-[11px] font-medium tracking-wide text-sea">{spot.area}</p><h3 className="mt-1 text-lg font-semibold text-ink">{spot.name}</h3></div><span className={`pt-1 text-xs ${selected ? "text-coral" : "text-slate-400"}`}>↗</span></div>
    <p className="mt-3 text-sm leading-6 text-slate-500">{spot.description}</p>
    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-ink/8 pt-3 text-xs"><div><p className="text-slate-400">最佳时间</p><p className="mt-1 font-medium text-ink">{spot.bestTime}</p></div><div><p className="text-slate-400">人流</p><p className="mt-1 font-medium text-ink">{spot.crowdLevel}</p></div></div>
    <p className="mt-4 text-xs leading-5 text-slate-500"><span className="font-semibold text-ink">拍摄建议</span>　{spot.shootingTips}</p>
    <Link href={`/spot/${spot.slug}/`} onClick={(event) => event.stopPropagation()} className="relative z-10 mt-4 inline-flex text-xs font-semibold text-coral hover:text-ink">查看摄影攻略 →</Link>
  </div>;
}
