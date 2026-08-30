"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import photographersData from "@/data/photographers.json";
import { Eyebrow, Pill, TopNav } from "@/components/guangying-ui";
import type { Photographer } from "@/types/photographer";
import { listApprovedPhotographers } from "@/lib/supabase/backend";

const photographers = photographersData as Photographer[];

export default function PhotographersClient() {
  const [directory, setDirectory] = useState<Photographer[]>(photographers);
  const [sourceMessage, setSourceMessage] = useState("");
  const [season, setSeason] = useState("全部");
  const [route, setRoute] = useState("全部");
  const [availability, setAvailability] = useState("全部");
  const [authOnly, setAuthOnly] = useState(false);
  const [previewSlug, setPreviewSlug] = useState("ruoshui");
  const [contactOpen, setContactOpen] = useState(false);

  const routeOptions = useMemo(() => {
    const names = new Set<string>();
    directory.forEach((item) => item.familiarRoutes.forEach((name) => names.add(name)));
    return ["全部", ...Array.from(names)];
  }, [directory]);

  useEffect(() => {
    listApprovedPhotographers().then((result) => {
      if (result.photographers.length > 0 && result.mode === "supabase") {
        setDirectory(result.photographers);
      } else {
        setDirectory(photographers);
      }
      setSourceMessage(result.message || "");
    });
  }, []);

  const filtered = useMemo(() => directory.filter((item) => {
    if (season !== "全部" && !item.seasons.includes(season as Photographer["seasons"][number])) return false;
    if (route !== "全部" && !item.familiarRoutes.some((value) => value.includes(route.replace("毕业线", "")) || route.includes(value))) return false;
    if (availability !== "全部" && item.mutualStatus !== availability) return false;
    if (authOnly && !item.authorized) return false;
    return true;
  }), [directory, season, route, availability, authOnly]);

  const preview = directory.find((item) => item.slug === previewSlug && filtered.some((match) => match.slug === item.slug)) || filtered[0] || directory[0] || photographers[0];
  const previewWorks = preview.portfolio.slice(0, 3).map((work) => work.title).join("、");

  function previewPhotographer(slug: string) {
    setPreviewSlug(slug);
    setContactOpen(false);
  }

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="摄影者" actionLabel="上传作品" actionHref="/works/submit" />
        <section className="gy-directory-head">
          <div>
            <Eyebrow muted>PHOTOGRAPHERS</Eyebrow>
            <h1 className="gy-page-title">摄影者档案</h1>
            <p className="gy-body-copy">查看熟悉大工点位的摄影者、作品风格与授权联系方式。</p>
            {sourceMessage ? <p className="gy-backend-note">{sourceMessage}</p> : null}
          </div>
          <div className="gy-directory-tools">
            <Link href="/contribute" className="gy-secondary-button">提交摄影者档案</Link>
            <div className="gy-filter-bar">
              <select value={season} onChange={(event) => setSeason(event.target.value)} aria-label="按季节筛选">
                <option>全部</option>
                <option>春</option>
                <option>夏</option>
                <option>秋</option>
                <option>冬</option>
              </select>
              <select value={route} onChange={(event) => setRoute(event.target.value)} aria-label="按路线筛选">
                {routeOptions.map((name) => <option key={name}>{name}</option>)}
              </select>
              <select value={availability} onChange={(event) => setAvailability(event.target.value)} aria-label="按互勉状态筛选">
                <option>全部</option>
                <option>可互勉</option>
                <option>可约拍</option>
                <option>暂不互勉</option>
              </select>
              <label><input type="checkbox" checked={authOnly} onChange={(event) => setAuthOnly(event.target.checked)} /> 已授权</label>
            </div>
          </div>
        </section>

        <section className="gy-photographer-layout">
          <div className="gy-photographer-grid">
            {filtered.map((item) => (
              <Link
                key={item.slug}
                href={`/photographers/${item.slug}`}
                onMouseEnter={() => previewPhotographer(item.slug)}
                onFocus={() => previewPhotographer(item.slug)}
                className={item.slug === preview.slug ? "gy-panel gy-photographer-card gy-card-link is-active" : "gy-panel gy-photographer-card gy-card-link"}
              >
                <img src={item.avatar} alt={`${item.name}作品预览`} />
                <h3>{item.name}</h3>
                <p>{item.identity} · {item.styles.slice(0, 2).join(" / ")}</p>
                <div className="gy-mini-pill-row">
                  <Pill active={item.slug === preview.slug}>{item.familiarRoutes[0]}</Pill>
                  <Pill>{item.mutualStatus}</Pill>
                  {item.authorized ? <Pill>已授权</Pill> : null}
                </div>
              </Link>
            ))}
            {filtered.length === 0 ? (
              <div className="gy-panel gy-empty-state">
                <h3>暂无匹配摄影者</h3>
                <p>可以放宽筛选条件，或先在共建页提交摄影者档案。</p>
              </div>
            ) : null}
          </div>

          <aside className="gy-panel gy-side-panel gy-profile-panel">
            <img src={preview.avatar} alt={`${preview.name}摄影作品预览`} />
            <Eyebrow muted>{contactOpen ? "AUTHORIZED CONTACT" : "PROFILE PREVIEW"}</Eyebrow>
            <h2>{preview.name}</h2>
            <p className="gy-body-copy" style={{ marginTop: 14 }}>{preview.intro}</p>
            <div className="gy-profile-row"><span>身份</span><p>{preview.identity}</p></div>
            <div className="gy-profile-row"><span>熟悉路线</span><p>{preview.familiarRoutes.join(" / ")}</p></div>
            <div className="gy-profile-row"><span>作品片段</span><p>{previewWorks}</p></div>
            <div className="gy-profile-row"><span>互勉状态</span><p>{preview.mutualStatus === "可互勉" ? "开放互勉，需提前预约" : preview.mutualStatus}</p></div>
            <div className="gy-profile-row"><span>联系方式</span><p>{contactOpen && preview.authorized ? `微信 ${preview.contact.wechat || "未填"} / 邮箱 ${preview.contact.email || "未填"}` : preview.authorized ? "已授权展示，点击后显示" : "暂未授权展示"}</p></div>
            {contactOpen && preview.authorized ? <p className="gy-privacy-note">请说明来意，尊重摄影者时间，不进行骚扰或商业转载。</p> : null}
            <div className="gy-profile-actions">
              <Link href={`/photographers/${preview.slug}`} className="gy-primary-button">查看主页</Link>
              <button type="button" className="gy-secondary-button" disabled={!preview.authorized} onClick={() => setContactOpen((value) => !value)}>
                {contactOpen ? "收起联系方式" : preview.authorized ? "查看授权联系方式" : "暂未授权联系方式"}
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
