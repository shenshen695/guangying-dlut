"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/AppIcon";
import { photographers } from "@/data/photographers";
import { getWork } from "@/data/works";
import { getPhotographerApplication, withdrawPhotographerApplication } from "@/lib/photographerApplication";
import type { PhotographerApplicationStatus } from "@/types/photographer-application";

const filters = ["全部", "校园风光", "建筑", "人像", "秋景", "夜景"] as const;

export default function PhotographersClient() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("全部");
  const [query, setQuery] = useState("");
  const [applicationStatus, setApplicationStatus] = useState<PhotographerApplicationStatus | null>(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [following, setFollowing] = useState<string[]>(photographers.filter((item) => item.isFollowing).map((item) => item.id));
  useEffect(() => { setApplicationStatus(getPhotographerApplication()?.status || null); }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const visible = photographers.filter((photographer) => {
    const works = photographer.workIds.map((id) => getWork(id)).filter(Boolean);
    const matchesFilter = filter === "全部" || photographer.styleTags.some((tag) => tag.includes(filter)) || works.some((work) => work?.tags.some((tag) => tag.includes(filter)));
    const searchable = [photographer.nickname, photographer.handle, photographer.intro, ...photographer.styleTags, ...works.flatMap((work) => work ? [...work.tags, ...work.categories] : [])].join(" ").toLowerCase();
    return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  const canWithdraw = applicationStatus === "reviewing" || applicationStatus === "submitted";
  const applicationLabel = applicationStatus === "approved" ? "我的摄影师主页" : applicationStatus === "rejected" ? "重新申请" : "成为摄影师";

  function confirmWithdraw() {
    setApplicationStatus(withdrawPhotographerApplication().status);
    setShowWithdrawConfirm(false);
  }

  return <>
    <header className="flex h-10 items-center gap-2 sm:gap-2.5"><h1 className="shrink-0 text-[21px] font-bold tracking-tight">摄影师</h1><label className="flex h-10 min-w-0 flex-1 items-center gap-1.5 rounded-[12px] border border-slate-200 bg-white px-2.5 text-slate-400"><AppIcon name="search" className="h-4 w-4 shrink-0" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索摄影师" placeholder="搜索摄影师" className="min-w-0 flex-1 bg-transparent text-[11px] text-ink outline-none placeholder:text-slate-400" /></label>{canWithdraw ? <span className="flex h-10 shrink-0 items-center gap-1 rounded-[12px] border border-slate-200 bg-white p-1"><span className="whitespace-nowrap px-1 text-[9px] font-semibold text-sea sm:px-1.5 sm:text-[10px]">申请审核中</span><button type="button" onClick={() => setShowWithdrawConfirm(true)} className="h-8 whitespace-nowrap rounded-[9px] border border-slate-200 px-1.5 text-[9px] font-semibold text-slate-500 sm:px-2 sm:text-[10px]">撤回申请</button></span> : <Link href="/photographers/apply/" className="flex h-10 shrink-0 items-center whitespace-nowrap rounded-[12px] bg-sea px-2.5 text-[10px] font-semibold text-white sm:px-3 sm:text-[11px]">{applicationLabel}</Link>}</header>
    <div className="scrollbar-none -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">{filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${filter === item ? "bg-ink text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{item}</button>)}</div>
    <div className="mt-3 grid gap-2.5 md:grid-cols-2">{visible.map((photographer) => {
      const works = photographer.workIds.map((id) => getWork(id)).filter(Boolean);
      const isFollowing = following.includes(photographer.id);
      return <article key={photographer.id} className="relative overflow-hidden rounded-[16px] border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,.03)]">
        <Link href={`/photographers/${photographer.id}/`} aria-label={`查看摄影师 ${photographer.nickname}`} className="absolute inset-0 z-0" />
        <div className="relative z-10 flex items-center gap-2.5 pointer-events-none"><img src={photographer.avatar} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm" /><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><h2 className="truncate text-[13px] font-semibold">{photographer.nickname}</h2><span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-500">原型账号</span></div><p className="mt-0.5 truncate text-[10px] text-slate-500">{photographer.styleTags.join(" · ")}</p></div><button type="button" onClick={() => setFollowing((current) => isFollowing ? current.filter((id) => id !== photographer.id) : [...current, photographer.id])} className={`pointer-events-auto relative z-20 h-7 shrink-0 rounded-full border px-2.5 text-[10px] font-semibold ${isFollowing ? "border-slate-200 bg-white text-slate-500" : "border-sea/40 bg-white text-sea"}`}>{isFollowing ? "已关注" : "关注"}</button></div>
        <p className="relative z-10 mt-2 flex items-center gap-2.5 pointer-events-none text-[10px] text-slate-400"><span>作品 <strong className="font-semibold text-slate-700">{photographer.worksCount}</strong></span><span>粉丝 <strong className="font-semibold text-slate-700">{formatCount(photographer.followers)}</strong></span><span>关注 <strong className="font-semibold text-slate-700">{photographer.following}</strong></span></p>
        <div className="relative z-10 mt-2 grid grid-cols-3 gap-1.5 pointer-events-none">{works.slice(0, 3).map((work) => work && <img key={work.workId} src={work.thumbnail} alt={work.title} className="h-16 w-full rounded-[8px] object-cover" />)}</div>
        <AppIcon name="arrow" className="relative z-10 ml-auto mt-1 h-3.5 w-3.5 text-sea pointer-events-none" />
      </article>;
    })}{!visible.length && <div className="col-span-full rounded-[16px] border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">没有找到相关摄影师</div>}</div>

    {showWithdrawConfirm && <div className="fixed inset-0 z-[1200] grid place-items-center bg-ink/30 px-5" role="dialog" aria-modal="true" aria-labelledby="withdraw-title"><section className="w-full max-w-sm rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.18)]"><h2 id="withdraw-title" className="text-[18px] font-semibold">撤回摄影师申请？</h2><p className="mt-2 text-xs leading-5 text-slate-500">撤回后，本次申请将取消，你可以重新填写并再次提交。</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowWithdrawConfirm(false)} className="h-9 rounded-full border border-slate-200 px-4 text-xs font-semibold text-slate-500">取消</button><button type="button" onClick={confirmWithdraw} className="h-9 rounded-full border border-[#d9a58b] bg-[#fff7f2] px-4 text-xs font-semibold text-[#ad5f3e]">确认撤回</button></div></section></div>}
  </>;
}

function formatCount(value: number) { return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value); }
