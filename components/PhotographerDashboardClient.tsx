"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CoralRule, Eyebrow, TopNav } from "@/components/guangying-ui";
import {
  getPhotographerDashboard,
  parseList,
  savePhotographerProfile,
  statusLabel,
  type AdminSubmission,
  type PhotographerProfileDraft,
} from "@/lib/supabase/backend";

const emptyProfile: PhotographerProfileDraft = {
  slug: "my-photo-profile",
  name: "我的摄影主页",
  identity: "摄影爱好者",
  bio: "写一段你熟悉的点位、拍摄习惯和适合的毕业照风格。",
  familiar_routes: ["春日花阶线"],
  familiar_spots: ["南门", "伯川"],
  styles: ["清透自然", "学院纪实"],
  seasons: ["春", "夏"],
  mutual_status: "可互勉",
  contact_authorized: false,
  contact_wechat: "",
  contact_email: "",
  contact_qq: "",
  status: "pending",
  review_note: "",
};

export default function PhotographerDashboardClient() {
  const [allowed, setAllowed] = useState(true);
  const [message, setMessage] = useState("正在读取摄影师管理数据...");
  const [profile, setProfile] = useState<PhotographerProfileDraft>(emptyProfile);
  const [spotSubmissions, setSpotSubmissions] = useState<AdminSubmission[]>([]);
  const [workSubmissions, setWorkSubmissions] = useState<AdminSubmission[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getPhotographerDashboard().then((result) => {
      setAllowed(result.allowed);
      setMessage(result.message || (result.mode === "demo" ? "当前为演示模式，后端未连接。" : "已连接 Supabase 摄影师管理后台。"));
      setProfile(result.data.photographerProfile || emptyProfile);
      setSpotSubmissions(result.data.spotSubmissions);
      setWorkSubmissions(result.data.workSubmissions);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const result = await savePhotographerProfile(profile);
    setIsSaving(false);
    setMessage(result.message);
  }

  function updateList(field: "familiar_routes" | "familiar_spots" | "styles" | "seasons", value: string) {
    setProfile((current) => ({ ...current, [field]: parseList(value) }));
  }

  function renderSubmissionList(title: string, items: AdminSubmission[]) {
    return (
      <div className="gy-dashboard-submissions">
        <h3>{title}</h3>
        {items.length === 0 ? <p className="gy-body-copy">暂无提交记录。</p> : null}
        {items.map((item) => (
          <article key={item.id} className="gy-review-item">
            <div className="gy-review-title">
              <strong>{item.title}</strong>
              <span className={`gy-status gy-status-${statusLabel[item.status]}`}>{statusLabel[item.status]}</span>
            </div>
            <p className="gy-body-copy" style={{ fontSize: 13 }}>{item.summary}</p>
            {item.reviewNote ? <p className="gy-admin-note">审核备注：{item.reviewNote}</p> : null}
          </article>
        ))}
      </div>
    );
  }

  const isPendingReview = !allowed && (profile.status === "pending" || profile.status === "needs_revision" || message.includes("认证审核中"));

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="摄影者" actionLabel="上传作品" actionHref="/works/submit" />

        <section className="gy-admin-head">
          <div>
            <Eyebrow muted>PHOTOGRAPHER DASHBOARD</Eyebrow>
            <h1 className="gy-page-title">摄影师管理</h1>
            <CoralRule />
            <p className="gy-body-copy">编辑摄影师主页，查看作品和新机位提交状态，控制联系方式是否授权展示。</p>
            <p className="gy-backend-note">{message} {!allowed ? <Link href="/login">去登录</Link> : null}</p>
          </div>
          <div className="gy-work-submit-source">
            <Link href="/works/submit" className="gy-secondary-button">上传作品</Link>
            <Link href="/contribute" className="gy-secondary-button">提交新机位</Link>
          </div>
        </section>

        {!allowed ? (
          <section className="gy-panel gy-admin-empty">
            <h2>{isPendingReview ? "认证审核中" : "需要摄影师认证"}</h2>
            <p className="gy-body-copy">
              {isPendingReview
                ? "审核通过前不能进入正式摄影师后台，也不会公开展示摄影者主页。你可以回到认证页查看或补充资料。"
                : "请先登录并提交摄影师认证，审核通过后再进入正式摄影师后台。"}
            </p>
            {profile.review_note ? <p className="gy-admin-note">管理员备注：{profile.review_note}</p> : null}
            <div className="gy-work-submit-actions">
              <Link href="/photographer/apply" className="gy-primary-button">查看摄影师认证</Link>
              <Link href="/login" className="gy-secondary-button">返回登录</Link>
            </div>
            {(workSubmissions.length > 0 || spotSubmissions.length > 0) ? (
              <div className="gy-dashboard-pending-list">
                {renderSubmissionList("我的作品投稿", workSubmissions)}
                {renderSubmissionList("我的机位投稿", spotSubmissions)}
              </div>
            ) : null}
          </section>
        ) : (
          <section className="gy-dashboard-layout">
            <form className="gy-panel gy-dashboard-form" onSubmit={submit}>
              <h2>主页资料</h2>
              <div className="gy-form-grid">
                <div className="gy-input-card"><label>主页 slug</label><input value={profile.slug} onChange={(event) => setProfile({ ...profile, slug: event.target.value })} /></div>
                <div className="gy-input-card"><label>姓名</label><input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></div>
                <div className="gy-input-card"><label>身份</label><select value={profile.identity} onChange={(event) => setProfile({ ...profile, identity: event.target.value })}><option>摄影社成员</option><option>校友摄影者</option><option>在校学生</option><option>摄影爱好者</option></select></div>
                <div className="gy-input-card"><label>熟悉路线</label><input value={profile.familiar_routes.join(" / ")} onChange={(event) => updateList("familiar_routes", event.target.value)} /></div>
                <div className="gy-input-card"><label>熟悉点位</label><input value={profile.familiar_spots.join(" / ")} onChange={(event) => updateList("familiar_spots", event.target.value)} /></div>
                <div className="gy-input-card"><label>擅长风格</label><input value={profile.styles.join(" / ")} onChange={(event) => updateList("styles", event.target.value)} /></div>
                <div className="gy-input-card"><label>可拍季节</label><input value={profile.seasons.join(" / ")} onChange={(event) => updateList("seasons", event.target.value)} /></div>
                <div className="gy-input-card"><label>互勉状态</label><select value={profile.mutual_status} onChange={(event) => setProfile({ ...profile, mutual_status: event.target.value })}><option>可互勉</option><option>可约拍</option><option>暂不互勉</option></select></div>
                <div className="gy-input-card"><label>当前审核状态</label><input value={statusLabel[profile.status || "pending"]} readOnly /></div>
              </div>
              <label className="gy-textarea-card">
                <span>简介</span>
                <textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} />
              </label>
              <div className="gy-dashboard-contact">
                <label><input type="checkbox" checked={profile.contact_authorized} onChange={(event) => setProfile({ ...profile, contact_authorized: event.target.checked })} /> 授权展示联系方式</label>
                <div className="gy-form-grid">
                  <div className="gy-input-card"><label>微信</label><input value={profile.contact_wechat} onChange={(event) => setProfile({ ...profile, contact_wechat: event.target.value })} /></div>
                  <div className="gy-input-card"><label>邮箱</label><input value={profile.contact_email} onChange={(event) => setProfile({ ...profile, contact_email: event.target.value })} /></div>
                  <div className="gy-input-card"><label>QQ</label><input value={profile.contact_qq} onChange={(event) => setProfile({ ...profile, contact_qq: event.target.value })} /></div>
                </div>
              </div>
              <div className="gy-work-submit-actions">
                <button type="submit" className="gy-primary-button" disabled={isSaving}>{isSaving ? "保存中..." : "保存摄影师主页"}</button>
                <Link href="/photographers" className="gy-secondary-button">查看摄影者目录</Link>
              </div>
            </form>

            <aside className="gy-panel gy-dashboard-side">
              {renderSubmissionList("我的作品投稿", workSubmissions)}
              {renderSubmissionList("我的机位投稿", spotSubmissions)}
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
