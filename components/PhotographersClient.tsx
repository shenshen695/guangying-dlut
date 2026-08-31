"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import photographersData from "@/data/photographers.json";
import { Eyebrow, TopNav } from "@/components/guangying-ui";
import type { Photographer } from "@/types/photographer";
import { listApprovedPhotographers } from "@/lib/supabase/backend";

const fallbackPhotographers = photographersData as Photographer[];
const categories = ["全部", "校园风光", "建筑", "人像", "秋景"];

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
  const [sourceMessage, setSourceMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("全部");
  const [authOnly, setAuthOnly] = useState(false);
  const [followed, setFollowed] = useState<Set<string>>(new Set(["ming"]));

  useEffect(() => {
    listApprovedPhotographers().then((result) => {
      setDirectory(result.photographers.length > 0 && result.mode === "supabase" ? result.photographers : fallbackPhotographers);
      setSourceMessage(result.message || "");
    });
  }, []);

  const filtered = useMemo(() => directory.filter((item) => {
    if (!searchMatches(item, keyword)) return false;
    if (!categoryMatches(item, category)) return false;
    if (authOnly && !item.authorized) return false;
    return true;
  }), [authOnly, category, directory, keyword]);

  const visible = filtered;

  function toggleFollow(slug: string) {
    setFollowed((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const isSupabaseNotice = sourceMessage.includes("Supabase") && !sourceMessage.includes("未配置 Supabase");

  return (
    <main className="gy-page gy-photographer-market-page">
      <div className="gy-container gy-photographer-market-container">
        <TopNav active="摄影者" actionLabel="上传作品" actionHref="/works/submit" />

        <section className="gy-photographer-market-head">
          <div>
            <Eyebrow muted>PHOTOGRAPHERS</Eyebrow>
            <h1 className="gy-page-title">摄影师</h1>
            <p className="gy-body-copy">搜索熟悉大工点位的摄影师，看作品、风格、路线和授权联系方式。</p>
            {sourceMessage ? (
              <p className={isSupabaseNotice ? "gy-source-note is-connected" : "gy-source-note"}>
                {sourceMessage}
              </p>
            ) : null}
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
          {visible.map((item, index) => {
            const stats = getPhotographerStats(item, index);
            const isFollowed = followed.has(item.slug);
            return (
              <article key={item.slug} className="gy-photographer-feed-card">
                <div className="gy-photographer-feed-profile">
                  <img src={item.avatar} alt={`${item.name}头像`} />
                  <div>
                    <div className="gy-photographer-name-row">
                      <Link href={`/photographers/${item.slug}`}>{item.name}</Link>
                      <span>{item.identity}</span>
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
    </main>
  );
}
