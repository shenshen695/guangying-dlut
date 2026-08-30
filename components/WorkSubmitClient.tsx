"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import photographersData from "@/data/photographers.json";
import routesData from "@/data/routes.json";
import spotsData from "@/data/spots.json";
import worksData from "@/data/works.json";
import { CoralRule, Eyebrow, Pill, TopNav } from "@/components/guangying-ui";
import type { Photographer } from "@/types/photographer";
import type { Route } from "@/types/route";
import type { Season, Spot } from "@/types/spot";
import type { StyleReference } from "@/types/planner";
import type { SubmittedWork } from "@/types/work";
import { getBackendUserState, listApprovedPhotographers, submitWorkSubmission, type BackendUserState } from "@/lib/supabase/backend";

const photographers = photographersData as Photographer[];
const routes = routesData as Route[];
const spots = spotsData as Spot[];
const seededWorks = worksData as SubmittedWork[];
const seasons: Season[] = ["春", "夏", "秋", "冬"];
const styleOptions: StyleReference[] = ["清透自然", "学院纪实", "复古胶片", "电影氛围", "低饱和", "新中式", "Citywalk感", "多巴胺轻彩"];

export default function WorkSubmitClient() {
  const searchParams = useSearchParams();
  const requestedPhotographerSlug = searchParams.get("photographer");
  const initialPhotographer = photographers.find((item) => item.slug === requestedPhotographerSlug);
  const initialSpot = spots.find((item) => item.slug === searchParams.get("spot")) || spots[0];
  const initialRoute = routes.find((item) => item.slug === searchParams.get("route")) || routes[0];

  const [form, setForm] = useState({
    title: `${initialSpot.shortName}毕业作品`,
    photographerSlug: initialPhotographer?.slug || "",
    photographerName: initialPhotographer?.name || "",
    spotSlug: initialSpot.slug,
    routeSlug: initialRoute.slug,
    season: (initialSpot.seasons[0] || "春") as Season,
    description: `${initialSpot.cameraPosition}，${initialSpot.actionSuggestion}。`,
  });
  const [styleTags, setStyleTags] = useState<StyleReference[]>(["清透自然"]);
  const [files, setFiles] = useState<File[]>([]);
  const [submittedWork, setSubmittedWork] = useState<SubmittedWork | null>(null);
  const [reviews, setReviews] = useState<SubmittedWork[]>(seededWorks);
  const [directory, setDirectory] = useState<Photographer[]>(photographers);
  const [backendState, setBackendState] = useState<BackendUserState | null>(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);

  const selectedPhotographer = useMemo(
    () => directory.find((item) => item.slug === form.photographerSlug),
    [directory, form.photographerSlug],
  );
  const selectedSpot = useMemo(() => spots.find((item) => item.slug === form.spotSlug) || spots[0], [form.spotSlug]);
  const selectedRoute = useMemo(() => routes.find((item) => item.slug === form.routeSlug) || routes[0], [form.routeSlug]);

  const photographerName = selectedPhotographer?.name || form.photographerName.trim() || "未命名摄影者";

  useEffect(() => {
    getBackendUserState().then(setBackendState);
  }, []);

  useEffect(() => {
    listApprovedPhotographers().then((result) => {
      const merged = result.photographers.length > 0 && result.mode === "supabase"
        ? [...result.photographers, ...photographers.filter((item) => !result.photographers.some((live) => live.slug === item.slug))]
        : photographers;
      setDirectory(merged);
      const requested = requestedPhotographerSlug ? merged.find((item) => item.slug === requestedPhotographerSlug) : null;
      if (requested) {
        setForm((current) => ({
          ...current,
          photographerSlug: requested.slug,
          photographerName: requested.name,
        }));
      }
    });
  }, [requestedPhotographerSlug]);

  function toggleStyle(style: StyleReference) {
    setStyleTags((current) => {
      if (current.includes(style)) return current.length === 1 ? current : current.filter((item) => item !== style);
      return [...current, style].slice(0, 4);
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (backendState?.configured && !backendState.user) {
      setSubmitMessage("请先登录后上传作品。");
      return;
    }
    if (files.length === 0) {
      setSubmitMessage("请至少上传一张作品图片。");
      return;
    }
    if (!form.spotSlug) {
      setSubmitMessage("请选择关联点位。");
      return;
    }
    if (!form.season) {
      setSubmitMessage("请选择季节。");
      return;
    }
    if (styleTags.length === 0) {
      setSubmitMessage("请选择至少一个风格标签。");
      return;
    }
    if (!form.description.trim()) {
      setSubmitMessage("请填写拍摄说明。");
      return;
    }
    if (!rightsConfirmed) {
      setSubmitMessage("请勾选作品授权确认。");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    const result = await submitWorkSubmission({
      title: form.title.trim() || `${selectedSpot.shortName}毕业作品`,
      photographerName,
      photographerProfileId: selectedPhotographer?.sourceId || null,
      spotSlug: selectedSpot.slug,
      routeSlug: selectedRoute.slug,
      season: form.season,
      styleTags,
      description: form.description.trim() || selectedSpot.shootingTips,
      files,
      rightsConfirmed,
    });
    setIsSubmitting(false);

    if ("error" in result && result.error) {
      setSubmitMessage(result.error);
      return;
    }

    const nextWork: SubmittedWork = {
      id: `work-demo-${Date.now()}`,
      title: form.title.trim() || `${selectedSpot.shortName}毕业作品`,
      photographerName,
      photographerSlug: selectedPhotographer?.slug,
      spotSlug: selectedSpot.slug,
      spotName: selectedSpot.name,
      routeSlug: selectedRoute.slug,
      routeName: selectedRoute.name,
      season: form.season,
      styleTags,
      description: form.description.trim() || selectedSpot.shootingTips,
      images: selectedSpot.referenceImages.slice(0, 1),
      status: "待审核",
      submittedAt: "刚刚",
      note: `已选择 ${files.length} 张图片，并确认作品授权，等待审核。`,
    };
    setSubmittedWork(nextWork);
    setReviews((items) => [nextWork, ...items.filter((item) => item.id !== nextWork.id)]);
    setSubmitMessage(result.message || "作品已提交，等待审核。");
  }

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="摄影者" actionLabel="返回摄影者" actionHref="/photographers" />

        <section className="gy-work-submit-head">
          <div>
            <Eyebrow muted>WORK SUBMISSION</Eyebrow>
            <h1 className="gy-page-title">上传作品</h1>
            <CoralRule />
            <p className="gy-body-copy">上传已有点位的摄影作品，关联摄影者、路线、季节和风格，审核后进入作品档案。</p>
            <p className="gy-backend-note">
              {backendState?.configured
                ? backendState.user
                  ? `已连接 Supabase，当前账号：${backendState.user.email || "已登录用户"}`
                  : "已连接 Supabase，登录后可提交到真实作品审核队列。"
                : "当前为演示模式，后端未连接；表单会写入本地待审核状态。"}
              {backendState?.configured && !backendState.user ? <Link href="/login">去登录</Link> : null}
            </p>
          </div>
          <div className="gy-work-submit-source">
            <Pill active>{selectedSpot.name}</Pill>
            <Pill>{selectedRoute.name}</Pill>
            {selectedPhotographer ? <Pill>{selectedPhotographer.name}</Pill> : <Pill>可填写摄影者</Pill>}
          </div>
        </section>

        <section className="gy-work-submit-layout">
          <form className="gy-panel gy-side-panel gy-work-submit-form" onSubmit={submit}>
            {submittedWork ? (
              <div className="gy-work-submit-success">
                <strong>作品已提交，等待审核。</strong>
                <span>{submittedWork.title} · {submittedWork.spotName} · {submittedWork.submittedAt}</span>
              </div>
            ) : null}
            {submitMessage ? <p className="gy-submit-note">{submitMessage}</p> : null}

            <div className="gy-form-grid">
              <div className="gy-input-card">
                <label>作品名称</label>
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </div>
              <div className="gy-input-card">
                <label>选择已有摄影者</label>
                <select value={form.photographerSlug} onChange={(event) => setForm({ ...form, photographerSlug: event.target.value, photographerName: "" })}>
                  <option value="">手动填写</option>
                  {directory.map((photographer) => <option key={photographer.slug} value={photographer.slug}>{photographer.name}</option>)}
                </select>
              </div>
              <div className="gy-input-card">
                <label>摄影者姓名</label>
                <input
                  value={selectedPhotographer?.name || form.photographerName}
                  disabled={Boolean(selectedPhotographer)}
                  onChange={(event) => setForm({ ...form, photographerName: event.target.value })}
                />
              </div>
              <div className="gy-input-card">
                <label>关联点位</label>
                <select value={form.spotSlug} onChange={(event) => setForm({ ...form, spotSlug: event.target.value })}>
                  {spots.map((spot) => <option key={spot.slug} value={spot.slug}>{spot.name}</option>)}
                </select>
              </div>
              <div className="gy-input-card">
                <label>关联路线</label>
                <select value={form.routeSlug} onChange={(event) => setForm({ ...form, routeSlug: event.target.value })}>
                  {routes.map((route) => <option key={route.slug} value={route.slug}>{route.name}</option>)}
                </select>
              </div>
              <div className="gy-input-card">
                <label>上传状态</label>
                <input value="提交后进入待审核" readOnly />
              </div>
            </div>

            <div className="gy-work-form-block">
              <span className="gy-form-label">选择季节</span>
              <div className="gy-choice-row">
                {seasons.map((season) => (
                  <button key={season} type="button" className={form.season === season ? "gy-choice is-active" : "gy-choice"} onClick={() => setForm({ ...form, season })}>
                    {season}
                  </button>
                ))}
              </div>
            </div>

            <div className="gy-work-form-block">
              <span className="gy-form-label">风格标签</span>
              <div className="gy-choice-row">
                {styleOptions.map((style) => (
                  <button key={style} type="button" className={styleTags.includes(style) ? "gy-choice is-active" : "gy-choice"} onClick={() => toggleStyle(style)}>
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <label className="gy-textarea-card">
              <span>拍摄说明</span>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>

            <label className="gy-upload-box">
              <input type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} />
              <span>{files.length > 0 ? files.map((file) => file.name).join(" / ") : "上传作品图片：演示模式本地记录，接入后写入 Supabase Storage"}</span>
            </label>

            <label className="gy-consent-line">
              <input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} />
              <span>确认作品为本人拍摄或已获授权，允许用于光影大工作品审核与展示</span>
            </label>

            <div className="gy-work-submit-actions">
              <button type="submit" className="gy-primary-button" disabled={isSubmitting}>{isSubmitting ? "提交中..." : "提交作品并进入待审核"}</button>
              <Link href="/photographers" className="gy-secondary-button">返回摄影者目录</Link>
            </div>
          </form>

          <aside className="gy-panel gy-side-panel gy-work-review-panel">
            <div>
              <Eyebrow>REVIEW FLOW</Eyebrow>
              <h2>作品审核状态</h2>
              <p className="gy-body-copy">上传作品和提交新机位是两个流程：作品关联已有点位，机位共建用于新增地图点位。</p>
            </div>
            <div className="gy-review-flow">
              <span className="is-active">已提交</span>
              <b>→</b>
              <span className="is-active">待审核</span>
              <b>→</b>
              <span>补充材料 / 审核通过</span>
              <b>→</b>
              <span>进入作品档案</span>
            </div>
            <div className="gy-work-review-list">
              {reviews.map((item) => (
                <article key={item.id} className="gy-review-item">
                  <div className="gy-review-title">
                    <strong>{item.title}</strong>
                    <span className={`gy-status gy-status-${item.status}`}>{item.status}</span>
                  </div>
                  <p className="gy-body-copy" style={{ fontSize: 13 }}>{item.photographerName} · {item.spotName} · {item.season} · {item.styleTags.slice(0, 2).join(" / ")}</p>
                  <p className="gy-body-copy" style={{ fontSize: 13 }}>{item.note}</p>
                </article>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
