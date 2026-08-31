"use client";

import Link from "next/link";
import { useState } from "react";
import { photographers } from "@/data/photographers";
import { getWork } from "@/data/works";

export default function HomePhotographers() {
  const [following, setFollowing] = useState<string[]>(photographers.filter((item) => item.isFollowing).map((item) => item.id));
  return <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{photographers.slice(0, 5).map((photographer) => {
    const works = photographer.workIds.map((id) => getWork(id)).filter(Boolean);
    const isFollowing = following.includes(photographer.id);
    return <article key={photographer.id} className="w-[78vw] max-w-[320px] shrink-0 rounded-[16px] border border-slate-200 bg-white p-3 shadow-[0_3px_12px_rgba(15,23,42,.035)]">
      <div className="flex items-center gap-2.5"><Link href={`/photographers/${photographer.id}/`} className="flex min-w-0 flex-1 items-center gap-2.5"><img src={photographer.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /><span className="min-w-0"><span className="flex items-center gap-1.5"><strong className="truncate text-[12px]">{photographer.nickname}</strong><small className="rounded bg-slate-100 px-1 py-0.5 text-[8px] text-slate-500">原型账号</small></span><span className="mt-0.5 block truncate text-[9px] text-slate-400">{photographer.styleTags.join(" · ")}</span></span></Link><button type="button" onClick={() => setFollowing((current) => isFollowing ? current.filter((id) => id !== photographer.id) : [...current, photographer.id])} className={`h-7 shrink-0 rounded-full px-3 text-[10px] font-semibold ${isFollowing ? "border border-slate-200 text-slate-500" : "border border-sea/35 text-sea"}`}>{isFollowing ? "已关注" : "关注"}</button></div>
      <div className="mt-2.5 flex items-center gap-5 border-y border-slate-100 py-2 text-center"><Stat value={photographer.worksCount} label="作品" /><Stat value={formatCount(photographer.followers)} label="粉丝" /><Stat value={photographer.following} label="关注" /></div>
      <Link href={`/photographers/${photographer.id}/`} className="mt-2.5 grid grid-cols-3 gap-1.5">{works.slice(0, 3).map((work) => work && <img key={work.workId} src={work.thumbnail} alt={work.title} className="aspect-[1.25] w-full rounded-[7px] object-cover" />)}</Link>
    </article>;
  })}</div>;
}

function Stat({ value, label }: { value: number | string; label: string }) { return <span><strong className="block text-[11px]">{value}</strong><small className="mt-0.5 block text-[8px] text-slate-400">{label}</small></span>; }
function formatCount(value: number) { return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value); }
