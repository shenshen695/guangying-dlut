"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eyebrow, Pill } from "@/components/guangying-ui";
import type { Photographer, PhotographerWorkCategory } from "@/types/photographer";
import { getApprovedPhotographerBySlug, listApprovedWorksForPhotographer } from "@/lib/supabase/backend";

const workTabs: Array<"全部" | PhotographerWorkCategory> = ["全部", "毕业照", "湖畔", "人像", "建筑", "夜景", "室内"];

export default function PhotographerProfileClient({ photographer, requestedSlug }: { photographer: Photographer; requestedSlug?: string }) {
  const [displayPhotographer, setDisplayPhotographer] = useState(photographer);
  const [sourceMessage, setSourceMessage] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof workTabs)[number]>("全部");
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredWorks = useMemo(() => {
    if (activeTab === "全部") return displayPhotographer.portfolio;
    return displayPhotographer.portfolio.filter((work) => work.categories.includes(activeTab));
  }, [activeTab, displayPhotographer.portfolio]);

  const contactText = [
    displayPhotographer.contact.wechat ? `微信 ${displayPhotographer.contact.wechat}` : "",
    displayPhotographer.contact.email ? `邮箱 ${displayPhotographer.contact.email}` : "",
    displayPhotographer.contact.qq ? `QQ ${displayPhotographer.contact.qq}` : "",
  ].filter(Boolean).join(" / ");

  useEffect(() => {
    const browserSlug = typeof window !== "undefined"
      ? decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() || "")
      : "";
    const slug = browserSlug || requestedSlug || photographer.slug;
    let cancelled = false;

    async function loadPublicProfile() {
      const profileResult = await getApprovedPhotographerBySlug(slug);
      const baseProfile = profileResult.photographer || photographer;
      const workResult = await listApprovedWorksForPhotographer(baseProfile);
      if (cancelled) return;
      setDisplayPhotographer({
        ...baseProfile,
        portfolio: workResult.works.length > 0 ? workResult.works : baseProfile.portfolio,
      });
      setSourceMessage(workResult.works.length > 0 ? workResult.message : profileResult.message || "");
    }

    loadPublicProfile();
    return () => { cancelled = true; };
  }, [photographer, requestedSlug]);

  async function copyContact() {
    if (!displayPhotographer.authorized || !contactText) return;
    if (!contactOpen) {
      setContactOpen(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(contactText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="gy-photographer-home">
      <div className="gy-photographer-home-head">
        <div>
          <Eyebrow muted>PHOTOGRAPHER ARCHIVE</Eyebrow>
          <h1 className="gy-page-title">摄影者档案</h1>
          <p className="gy-body-copy">查看熟悉大工点位的摄影者、作品风格与授权联系方式。</p>
          {sourceMessage ? <p className="gy-backend-note">{sourceMessage}</p> : null}
        </div>
        <div className="gy-photographer-home-actions">
          <Link href={`/works/submit?photographer=${displayPhotographer.slug}`} className="gy-primary-button">上传作品</Link>
          <Link href="/photographers" className="gy-secondary-button">返回摄影者目录</Link>
        </div>
      </div>

      <div className="gy-photographer-home-layout">
        <aside className="gy-panel gy-profile-sticky">
          <img className="gy-profile-avatar" src={displayPhotographer.avatar} alt={`${displayPhotographer.name}作品封面`} />
          <div className="gy-profile-name-row">
            <h2>{displayPhotographer.name}</h2>
            <Pill active>{displayPhotographer.identity}</Pill>
          </div>
          <p className="gy-body-copy">{displayPhotographer.intro}</p>

          <div className="gy-profile-info-list">
            <div><span>熟悉路线</span><p>{displayPhotographer.familiarRoutes.join(" / ")}</p></div>
            <div><span>擅长点位</span><p>{displayPhotographer.familiarSpots.join(" / ")}</p></div>
            <div><span>擅长风格</span><p>{displayPhotographer.styles.join(" / ")}</p></div>
            <div><span>可拍季节</span><p>{displayPhotographer.seasons.join(" / ")}</p></div>
            <div><span>互勉状态</span><p>{displayPhotographer.mutualStatus}</p></div>
          </div>

          <div className="gy-contact-box">
            <Eyebrow muted>AUTHORIZED CONTACT</Eyebrow>
            {displayPhotographer.authorized ? (
              contactOpen ? (
                <>
                  <p className="gy-contact-authorized">已获授权展示</p>
                  <p className="gy-contact-text">{contactText}</p>
                  <p className="gy-privacy-note">请说明来意，尊重摄影者时间，不进行骚扰或商业转载。</p>
                </>
              ) : (
                <p className="gy-body-copy">联系方式默认隐藏，点击后展示演示授权信息。</p>
              )
            ) : (
                <p className="gy-body-copy">该摄影者暂未授权公开联系方式，可先查看作品风格。</p>
            )}
            <div className="gy-profile-actions">
              <button type="button" className="gy-primary-button" disabled={!displayPhotographer.authorized} onClick={copyContact}>
                {contactOpen ? copied ? "已复制" : "复制联系方式" : displayPhotographer.authorized ? "查看授权联系方式" : "暂未授权联系方式"}
              </button>
              {contactOpen ? (
                <button type="button" className="gy-secondary-button" onClick={() => setContactOpen(false)}>收起联系方式</button>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="gy-panel gy-work-area">
          <div className="gy-work-head">
            <div>
              <Eyebrow>PORTFOLIO</Eyebrow>
              <h2>作品档案</h2>
            </div>
            <span>{filteredWorks.length} 组作品</span>
          </div>
          <div className="gy-work-tabs" role="tablist" aria-label="作品分类">
            {workTabs.map((tab) => (
              <button key={tab} type="button" className={tab === activeTab ? "is-active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </div>
          <div className="gy-work-grid">
            {filteredWorks.map((work) => (
              <article key={work.id} className="gy-work-card">
                <img src={work.image} alt={work.title} />
                <div>
                  <h3>{work.title}</h3>
                  <p>{work.spot} · {work.season} · {work.style}</p>
                  {work.description ? <p className="gy-work-card-note">{work.description}</p> : null}
                  <div className="gy-mini-pill-row">
                    {work.categories.slice(0, 3).map((category) => <Pill key={category}>{category}</Pill>)}
                  </div>
                </div>
              </article>
            ))}
            {filteredWorks.length === 0 ? (
              <div className="gy-empty-state gy-panel">
                <h3>暂无该分类作品</h3>
                <p>当前为演示占位数据，后续可替换真实授权作品。</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
