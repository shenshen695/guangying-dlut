"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/AppIcon";
import photographersData from "@/data/photographers.json";
import { Eyebrow, TopNav } from "@/components/guangying-ui";
import type { Photographer } from "@/types/photographer";
import { listApprovedPhotographers } from "@/lib/supabase/backend";

const fallbackPhotographers = photographersData as Photographer[];
const categories = ["全部", "校园风光", "建筑", "人像", "秋景", "夜景"];

function getPhotographerStats(item: Photographer, index: number) {
  return {
    works: item.portfolio.length * 12 + 8 + index,
    fans: index === 0 ? "1.3k" : index === 1 ? "968" : `${620 + index * 87}`,
    following: 218 + index * 31,
  };
}

function categoryMatches(item: Photographer, category: string) {
  if (category === "全部") return true;
  const text = [
    item.identity,
    item.intro,
    item.familiarRoutes.join(" "),
    item.familiarSpots.join(" "),
    item.styles.join(" "),
    item.seasons.join(" "),
    item.portfolio.map((work) => `${work.title} ${work.spot} ${work.style} ${work.categories.join(" ")}`).join(" "),
  ].join(" ");

  if (category === "校园风光") return /校园|湖畔|凌水湖|南门|风光|清透|自然/.test(text);
  if (category === "秋景") return item.seasons.includes("秋") || /秋|胶片|黄昏/.test(text);
  return text.includes(category);
}

function searchMatches(item: Photographer, keyword: string) {
  if (!keyword.trim()) return true;
  const query = keyword.trim().toLowerCase();
  const text = [
    item.name,
    item.identity,
    item.intro,
    item.familiarRoutes.join(" "),
    item.familiarSpots.join(" "),
    item.styles.join(" "),
    item.portfolio.map((work) => `${work.title} ${work.spot} ${work.style}`).join(" "),
  ].join(" ").toLowerCase();
  return text.includes(query);
}

export default function PhotographersClient() {
  const [directory, setDirectory] = useState<Photographer[]>(fallbackPhotographers);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("全部");
  const [authOnly, setAuthOnly] = useState(false);
  const [followed, setFollowed] = useState<Set<string>>(new Set(["ming"]));

  useEffect(() => {
    listApprovedPhotographers().then((result) => {
      setDirectory(result.photographers.length > 0 && result.mode === "supabase" ? result.photographers : fallbackPhotographers);
    });
  }, []);

  const filtered = useMemo(() => directory.filter((item) => {
    if (!searchMatches(item, keyword)) return false;
    if (!categoryMatches(item, category)) return false;
    if (authOnly && !item.authorized) return false;
    return true;
  }), [authOnly, category, directory, keyword]);

  function toggleFollow(slug: string) {
    setFollowed((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  return (
    <main className="gy-page gy-photographer-market-page">
      <section className="gy-mobile-photographers">
        <header className="flex h-10 items-center gap-2 sm:gap-2.5">
          <h1 className="shrink-0 text-[21px] font-bold leading-none tracking-tight text-[#101827]">摄影师</h1>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-1.5 rounded-[12px] border border-slate-200 bg-white px-2.5 text-slate-400 shadow-[0_3px_12px_rgba(16,24,39,.035)]">
            <AppIcon name="search" className="h-4 w-4 shrink-0" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              aria-label="搜索摄影师"
              placeholder="搜索摄影师"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-ink outline-none placeholder:text-slate-400"
            />
          </label>
          <Link href="/photographer/apply/" className="flex h-10 shrink-0 items-center whitespace-nowrap rounded-[12px] bg-sea px-2.5 text-[10px] font-semibold text-white sm:px-3 sm:text-[11px]">
            成为摄影师
          </Link>
        </header>

        <div className="scrollbar-none -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${category === item ? "bg-[#101827] text-white" : "border border-slate-200 bg-white text-[#445064]"}`}
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAuthOnly(!authOnly)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${authOnly ? "bg-[#101827] text-white" : "border border-slate-200 bg-white text-[#445064]"}`}
          >
            已授权
          </button>
        </div>

        <div className="mt-3 grid gap-2.5">
          {filtered.map((item, index) => {
            const stats = getPhotographerStats(item, index);
            const isFollowed = followed.has(item.slug);
            return (
              <article key={item.slug} className="relative overflow-hidden rounded-[16px] border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(16,24,39,.03)]">
                <Link href={`/photographers/${item.slug}/`} aria-label={`查看摄影师 ${item.name}`} className="absolute inset-0 z-0" />
                <div className="relative z-10 flex items-center gap-2.5 pointer-events-none">
                  <img src={item.avatar} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h2 className="truncate text-[13px] font-semibold text-[#101827]">{item.name}</h2>
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-500">原型账号</span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {item.familiarSpots.slice(0, 2).join(" · ")} · {item.styles.slice(0, 2).join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFollow(item.slug)}
                    className={`pointer-events-auto relative z-20 h-7 shrink-0 rounded-full border px-2.5 text-[10px] font-semibold ${isFollowed ? "border-slate-200 bg-white text-slate-500" : "border-sea/40 bg-white text-sea"}`}
                  >
                    {isFollowed ? "已关注" : "关注"}
                  </button>
                </div>
                <p className="relative z-10 mt-2 flex items-center gap-2.5 pointer-events-none text-[10px] text-slate-400">
                  <span>作品 <strong className="font-black text-[#263140]">{stats.works}</strong></span>
                  <span>粉丝 <strong className="font-black text-[#263140]">{stats.fans}</strong></span>
                  <span>关注 <strong className="font-black text-[#263140]">{stats.following}</strong></span>
                </p>
                <div className="relative z-10 mt-2 grid grid-cols-3 gap-1.5 pointer-events-none">
                  {item.portfolio.slice(0, 3).map((work) => (
                    <img key={work.id} src={work.image} alt={work.title} className="h-16 w-full rounded-[8px] object-cover" />
                  ))}
                </div>
                <AppIcon name="arrow" className="relative z-10 ml-auto mt-1 h-3.5 w-3.5 text-sea pointer-events-none" />
              </article>
            );
          })}
          {filtered.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
              没有找到相关摄影师
            </div>
          ) : null}
        </div>
      </section>

      <div className="gy-photographers-desktop">
        <div className="gy-container gy-photographer-market-container">
          <TopNav active="摄影者" actionLabel="上传作品" actionHref="/works/submit" />

          <section className="gy-photographer-market-head">
            <div>
              <Eyebrow muted>PHOTOGRAPHERS</Eyebrow>
              <h1 className="gy-page-title">摄影师</h1>
              <p className="gy-body-copy">搜索熟悉大工点位的摄影师，看作品、风格、路线和授权联系方式。</p>
            </div>
            <div className="gy-photographer-market-actions">
              <div className="gy-photographer-search">
                <span aria-hidden>⌕</span>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索摄影师"
                  aria-label="搜索摄影师"
                />
              </div>
              <Link href="/photographer/apply" className="gy-become-photographer-button">成为摄影师</Link>
            </div>
          </section>

          <section className="gy-photographer-tabs" aria-label="摄影师分类">
            {categories.map((item) => (
              <button key={item} type="button" className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
            <button type="button" className={authOnly ? "is-active" : ""} onClick={() => setAuthOnly(!authOnly)}>
              已授权
            </button>
          </section>

          <section className="gy-photographer-feed" aria-label="摄影师列表">
            {filtered.map((item, index) => {
              const stats = getPhotographerStats(item, index);
              const isFollowed = followed.has(item.slug);
              return (
                <article key={item.slug} className="gy-photographer-feed-card">
                  <div className="gy-photographer-feed-profile">
                    <img src={item.avatar} alt={`${item.name}头像`} />
                    <div>
                      <div className="gy-photographer-name-row">
                        <Link href={`/photographers/${item.slug}`}>{item.name}</Link>
                        <span>原型账号</span>
                      </div>
                      <p>{item.familiarSpots.slice(0, 2).join(" · ")} · {item.styles.slice(0, 2).join(" · ")}</p>
                    </div>
                    <button type="button" className={isFollowed ? "is-followed" : ""} onClick={() => toggleFollow(item.slug)}>
                      {isFollowed ? "已关注" : "关注"}
                    </button>
                  </div>

                  <div className="gy-photographer-stats">
                    <span>作品 <strong>{stats.works}</strong></span>
                    <span>粉丝 <strong>{stats.fans}</strong></span>
                    <span>关注 <strong>{stats.following}</strong></span>
                  </div>

                  <div className="gy-photographer-work-strip">
                    {item.portfolio.slice(0, 3).map((work) => (
                      <Link key={work.id} href={`/photographers/${item.slug}`} aria-label={`查看作品：${work.title}`}>
                        <img src={work.image} alt={work.title} />
                      </Link>
                    ))}
                  </div>

                  <div className="gy-photographer-card-foot">
                    <span>{item.mutualStatus}</span>
                    <span>{item.authorized ? "联系方式已授权" : "联系方式未公开"}</span>
                    <Link href={`/photographers/${item.slug}`}>查看主页 →</Link>
                  </div>
                </article>
              );
            })}
          </section>

          {filtered.length === 0 ? (
            <section className="gy-panel gy-empty-state">
              <h3>暂无匹配摄影师</h3>
              <p>可以换一个分类，或先进入认证页面成为摄影师。</p>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
