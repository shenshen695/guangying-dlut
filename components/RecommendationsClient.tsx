"use client";

import Link from "next/link";
import { useState } from "react";
import AppIcon from "@/components/AppIcon";
import { getWeeklyRecommendations, type RecommendationFilter } from "@/data/recommendations";

const filters: RecommendationFilter[] = ["推荐", "天气", "月相", "光线", "主题"];

export default function RecommendationsClient() {
  const [filter, setFilter] = useState<RecommendationFilter>("推荐");
  const recommendations = getWeeklyRecommendations().filter((item) => item.filters.includes(filter));
  return <>
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${filter === item ? "bg-[#155e63] text-white" : "border border-slate-200 bg-white text-slate-500"}`}>{item}</button>)}</div>
    <div className="mt-4 space-y-3">{recommendations.map((item) => <Link key={item.location} href={item.href} className="grid grid-cols-[108px_1fr] gap-3 rounded-[16px] border border-slate-200 bg-white p-3 shadow-[0_3px_14px_rgba(15,23,42,.04)] sm:grid-cols-[150px_1fr]">
      <img src={item.image} alt={item.imageAlt} className="h-full min-h-[150px] w-full rounded-[11px] object-cover" />
      <span className="min-w-0 py-0.5"><span className="flex items-start justify-between gap-2"><strong className="text-[15px] leading-5">{item.title}</strong><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${item.priorityLabel === "高" ? "bg-[#fff1e7] text-[#c66e38]" : "bg-[#e9f3f3] text-[#155e63]"}`}>优先级 {item.priorityLabel}</span></span><span className="mt-2 flex flex-wrap gap-1">{item.tags.map((tag) => <small key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">{tag}</small>)}</span><span className="mt-2.5 line-clamp-3 block text-[11px] leading-5 text-slate-500">{item.reason}</span><span className="mt-3 flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-slate-500">{item.bestDate}</span><span className="flex items-center gap-0.5 text-[#d9874c]">{Array.from({ length: item.rating }).map((_, index) => <AppIcon key={index} name="star" className="h-3 w-3 fill-current" strokeWidth={1.5} />)}</span></span></span>
    </Link>)}</div>
  </>;
}
