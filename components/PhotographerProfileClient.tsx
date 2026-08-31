"use client";

import { useState } from "react";
import AppIcon from "@/components/AppIcon";
import WorkLightbox from "@/components/WorkLightbox";
import { featuredWorks } from "@/data/works";
import type { Photographer } from "@/types/photographer";
import type { PhotographyWork } from "@/types/work";

const tabs = ["作品集", "相册", "关于"] as const;

export default function PhotographerProfileClient({ photographer }: { photographer: Photographer }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("作品集");
  const [following, setFollowing] = useState(photographer.isFollowing);
  const [activeWork, setActiveWork] = useState<PhotographyWork | null>(null);
  const works = featuredWorks.filter((work) => photographer.workIds.includes(work.workId));

  return <>
    <section className="relative -mx-4 -mt-[max(1.25rem,env(safe-area-inset-top))] sm:-mx-8">
      <div className="relative h-48 overflow-hidden sm:h-64"><img src={photographer.cover} alt="" className="h-full w-full object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-mist via-black/5 to-black/20" /></div>
      <div className="relative -mt-14 px-4 sm:px-8"><div className="flex items-end gap-3"><img src={photographer.avatar} alt={`${photographer.nickname}头像`} className="h-[82px] w-[82px] rounded-full border-4 border-mist object-cover shadow-md" /><div className="min-w-0 flex-1 pb-1"><div className="flex items-center gap-2"><h1 className="truncate text-[21px] font-bold">{photographer.nickname}</h1><span className="rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">原型账号</span></div><p className="mt-1 text-[11px] text-slate-500">{photographer.handle}</p></div><button type="button" onClick={() => setFollowing(!following)} className={`mb-1 h-9 rounded-full px-4 text-xs font-semibold ${following ? "border border-slate-300 bg-white text-slate-600" : "bg-sea text-white"}`}>{following ? "已关注" : "关注"}</button></div>
        <p className="mt-3 max-w-2xl text-[13px] leading-5 text-slate-600">{photographer.intro}</p>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><AppIcon name="location" className="h-3.5 w-3.5" />{photographer.location}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{photographer.styleTags.map((tag) => <span key={tag} className="rounded-full bg-[#e8f3f3] px-2.5 py-1 text-[10px] font-semibold text-sea">{tag}</span>)}</div>
        <div className="mt-4 grid max-w-sm grid-cols-3 border-y border-slate-200 py-3 text-center"><Count value={photographer.worksCount} label="作品" /><Count value={photographer.followers} label="粉丝" /><Count value={photographer.following} label="关注" /></div>
      </div>
    </section>

    <div className="mt-5 flex border-b border-slate-200">{tabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`relative flex-1 py-3 text-xs font-semibold ${tab === item ? "text-ink" : "text-slate-400"}`}>{item}{tab === item && <span className="absolute inset-x-[32%] bottom-0 h-0.5 rounded-full bg-sea" />}</button>)}</div>

    {tab === "作品集" && <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">{works.map((work) => <button key={work.workId} type="button" onClick={() => setActiveWork(work)} className="aspect-[.86] overflow-hidden rounded-[10px] bg-slate-200"><img src={work.image} alt={work.title} className="h-full w-full object-cover" /></button>)}</div>}
    {tab === "相册" && <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="overflow-hidden rounded-[16px] bg-white shadow-sm"><div className="grid h-36 grid-cols-2 gap-0.5">{works.slice(0, 4).map((work) => <img key={work.workId} src={work.thumbnail} alt="" className="h-full w-full object-cover" />)}</div><p className="px-3 py-3 text-sm font-semibold">校园影像 · {works.length} 张</p></div></div>}
    {tab === "关于" && <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold">关于这个账号</h2><p className="mt-3 text-[13px] leading-6 text-slate-600">这是为产品交互测试建立的固定虚拟摄影师身份，不对应现实人物。作品使用项目提供的校园素材，正式发布前可按同一数据结构替换为已授权作者与作品。</p></div>}
    {activeWork && <WorkLightbox work={activeWork} onClose={() => setActiveWork(null)} />}
  </>;
}

function Count({ value, label }: { value: number; label: string }) { return <span><strong className="block text-[15px]">{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}</strong><small className="mt-0.5 block text-[10px] text-slate-500">{label}</small></span>; }
