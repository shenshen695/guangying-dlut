"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import spotsData from "@/data/spots.json";
import { CoralRule, Eyebrow, Pill, TopNav } from "@/components/guangying-ui";
import { getBackendUserState, roleLabel, submitPhotographerApplication, type BackendUserState } from "@/lib/supabase/backend";
import type { StyleReference } from "@/types/planner";
import type { Spot } from "@/types/spot";

const spots = spotsData as Spot[];
const identityOptions = ["摄影社成员", "校友摄影者", "在校学生", "摄影爱好者"];
const styleOptions: StyleReference[] = ["清透自然", "学院纪实", "复古胶片", "电影氛围", "低饱和", "新中式", "Citywalk感", "多巴胺轻彩"];

export default function PhotographerApplyClient() {
  const [backendState, setBackendState] = useState<BackendUserState | null>(null);
  const [form, setForm] = useState({
    identity: "摄影爱好者",
    name: "",
    bio: "",
    portfolioNote: "",
    contactWechat: "",
    contactEmail: "",
    contactQq: "",
    contactAuthorized: false,
    rightsConfirmed: false,
  });
  const [styles, setStyles] = useState<StyleReference[]>(["清透自然"]);
  const [familiarSpots, setFamiliarSpots] = useState<string[]>(["南门"]);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("正在检查登录状态...");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getBackendUserState().then((state) => {
      setBackendState(state);
      setMessage(state.configured
        ? state.user
          ? `已连接 Supabase，当前账号：${state.user.email || "已登录用户"}`
          : "已连接 Supabase，请先登录后提交认证。"
        : "当前站点未配置 Supabase 环境变量，提交会进入本地演示待审核状态。");
      if (state.profile?.display_name && !form.name) {
        setForm((current) => ({ ...current, name: state.profile?.display_name || current.name }));
      }
    });
  }, []);

  function toggleStyle(style: StyleReference) {
    setStyles((current) => {
      if (current.includes(style)) return current.length === 1 ? current : current.filter((item) => item !== style);
      return [...current, style].slice(0, 4);
    });
  }

  function toggleSpot(name: string) {
    setFamiliarSpots((current) => {
      if (current.includes(name)) return current.length === 1 ? current : current.filter((item) => item !== name);
      return [...current, name].slice(0, 6);
    });
  }

  function updateFiles(nextFiles: FileList | null) {
    const selected = Array.from(nextFiles || []).slice(0, 3);
    setFiles(selected);
    if ((nextFiles?.length || 0) > 3) {
      setMessage("代表作品最多上传 3 张，已自动保留前 3 张。");
    }
  }

  function validate() {
    if (backendState?.configured && !backendState.user) return "请先登录后提交摄影师认证。";
    if (!form.name.trim()) return "请填写昵称或姓名。";
    if (!form.bio.trim()) return "请填写简介。";
    if (styles.length === 0) return "请选择至少一种擅长风格。";
    if (familiarSpots.length === 0) return "请选择至少一个熟悉点位。";
    if (files.length === 0) return "请上传 1-3 张代表作品。";
    if (!form.portfolioNote.trim()) return "请填写作品说明。";
    if (!form.contactWechat.trim() && !form.contactEmail.trim() && !form.contactQq.trim()) return "请至少填写一种联系方式。";
    if (!form.rightsConfirmed) return "请勾选作品授权确认。";
    return "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validate();
    if (error) {
      setMessage(error);
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    const result = await submitPhotographerApplication({
      identity: form.identity,
      name: form.name.trim(),
      bio: form.bio.trim(),
      styles,
      familiarSpots,
      representativeFiles: files,
      portfolioNote: form.portfolioNote.trim(),
      contactWechat: form.contactWechat.trim(),
      contactEmail: form.contactEmail.trim(),
      contactQq: form.contactQq.trim(),
      contactAuthorized: form.contactAuthorized,
      rightsConfirmed: form.rightsConfirmed,
    });
    setIsSubmitting(false);

    if ("error" in result && result.error) {
      setMessage(result.error);
      return;
    }
    setSubmitted(true);
    setMessage(result.message || "摄影师认证已提交，等待管理员审核。");
    const nextState = await getBackendUserState();
    setBackendState(nextState);
  }

  const role = backendState?.profile?.role;
  const approved = role === "photographer" || role === "admin";
  const pending = role === "photographer_pending" || submitted;

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="摄影者" actionLabel="返回摄影者" actionHref="/photographers" />

        <section className="gy-apply-head">
          <div>
            <Eyebrow muted>PHOTOGRAPHER VERIFY</Eyebrow>
            <h1 className="gy-page-title">摄影师认证</h1>
            <CoralRule />
            <p className="gy-body-copy">提交身份、熟悉点位和代表作品，管理员审核通过后才能进入正式摄影师后台，并在目录中公开展示主页。</p>
            <p className="gy-backend-note">{message} {backendState?.configured && !backendState.user ? <Link href="/login">去登录</Link> : null}</p>
          </div>
          <div className="gy-apply-status">
            <Pill active>{approved ? "已认证" : pending ? "认证审核中" : "待提交认证"}</Pill>
            <Pill>{role ? roleLabel[role] : "未登录"}</Pill>
          </div>
        </section>

        {approved ? (
          <section className="gy-panel gy-admin-empty">
            <h2>认证已通过</h2>
            <p className="gy-body-copy">你已经可以进入摄影师后台维护主页、上传作品并查看投稿状态。</p>
            <div className="gy-work-submit-actions">
              <Link href="/photographer/dashboard" className="gy-primary-button">进入摄影师后台</Link>
              <Link href="/works/submit" className="gy-secondary-button">上传作品</Link>
            </div>
          </section>
        ) : null}

        {!approved ? (
          <section className="gy-apply-layout">
            <form className="gy-panel gy-side-panel gy-apply-form" onSubmit={submit}>
              {pending ? (
                <div className="gy-work-submit-success">
                  <strong>认证审核中</strong>
                  <span>审核通过前不会公开展示主页，也不能进入正式摄影师后台。</span>
                </div>
              ) : null}

              <div className="gy-form-grid">
                <div className="gy-input-card">
                  <label>身份类型</label>
                  <select value={form.identity} onChange={(event) => setForm({ ...form, identity: event.target.value })}>
                    {identityOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div className="gy-input-card">
                  <label>昵称 / 姓名</label>
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：若水" />
                </div>
              </div>

              <label className="gy-textarea-card">
                <span>简介</span>
                <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="写你熟悉的拍摄场景、毕业照经验和沟通习惯。" />
              </label>

              <div className="gy-work-form-block">
                <span className="gy-form-label">擅长风格</span>
                <div className="gy-choice-row">
                  {styleOptions.map((style) => (
                    <button key={style} type="button" className={styles.includes(style) ? "gy-choice is-active" : "gy-choice"} onClick={() => toggleStyle(style)}>
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gy-work-form-block">
                <span className="gy-form-label">熟悉点位</span>
                <div className="gy-choice-row">
                  {spots.slice(0, 8).map((spot) => (
                    <button key={spot.slug} type="button" className={familiarSpots.includes(spot.name) ? "gy-choice is-active" : "gy-choice"} onClick={() => toggleSpot(spot.name)}>
                      {spot.shortName}
                    </button>
                  ))}
                </div>
              </div>

              <label className="gy-upload-box">
                <input type="file" accept="image/*" multiple onChange={(event) => updateFiles(event.target.files)} />
                <span>{files.length > 0 ? files.map((file) => file.name).join(" / ") : "代表作品上传：最多 3 张，建议包含人像、点位环境和成片效果"}</span>
              </label>

              <label className="gy-textarea-card">
                <span>作品说明</span>
                <textarea value={form.portfolioNote} onChange={(event) => setForm({ ...form, portfolioNote: event.target.value })} placeholder="说明作品拍摄地点、风格、是否适合毕业照参考。" />
              </label>

              <div className="gy-form-grid">
                <div className="gy-input-card"><label>微信</label><input value={form.contactWechat} onChange={(event) => setForm({ ...form, contactWechat: event.target.value })} /></div>
                <div className="gy-input-card"><label>邮箱</label><input value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} /></div>
                <div className="gy-input-card"><label>QQ</label><input value={form.contactQq} onChange={(event) => setForm({ ...form, contactQq: event.target.value })} /></div>
              </div>

              <label className="gy-consent-line">
                <input type="checkbox" checked={form.contactAuthorized} onChange={(event) => setForm({ ...form, contactAuthorized: event.target.checked })} />
                <span>授权审核通过后在摄影者主页展示联系方式</span>
              </label>
              <label className="gy-consent-line">
                <input type="checkbox" checked={form.rightsConfirmed} onChange={(event) => setForm({ ...form, rightsConfirmed: event.target.checked })} />
                <span>确认作品为本人拍摄或已获授权</span>
              </label>

              <div className="gy-work-submit-actions">
                <button type="submit" className="gy-primary-button" disabled={isSubmitting}>{isSubmitting ? "提交中..." : "提交摄影师认证"}</button>
                <Link href="/login" className="gy-secondary-button">返回登录</Link>
              </div>
            </form>

            <aside className="gy-panel gy-side-panel gy-apply-side">
              <h2>审核后会发生什么</h2>
              <div className="gy-review-flow is-vertical">
                <span className="is-active">提交认证</span>
                <b>→</b>
                <span className={pending ? "is-active" : ""}>管理员审核</span>
                <b>→</b>
                <span>通过 / 需补充 / 拒绝</span>
                <b>→</b>
                <span>进入摄影者目录</span>
              </div>
              <p className="gy-body-copy">审核通过后，账号角色会变为摄影师，可以进入后台维护主页。待审核期间只能查看认证状态，不会公开展示主页。</p>
            </aside>
          </section>
        ) : null}
      </div>
    </main>
  );
}
