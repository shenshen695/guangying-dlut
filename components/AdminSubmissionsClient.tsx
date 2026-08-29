"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CoralRule, Eyebrow, TopNav } from "@/components/guangying-ui";
import {
  listAdminSubmissions,
  reviewSubmission,
  statusLabel,
  type AdminSubmission,
  type ReviewAction,
  type ReviewTargetType,
  type SubmissionStatus,
} from "@/lib/supabase/backend";

type TabKey = "spot" | "work" | "photographer";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "spot", label: "点位投稿" },
  { key: "work", label: "作品投稿" },
  { key: "photographer", label: "摄影师主页" },
];

export default function AdminSubmissionsClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("spot");
  const [items, setItems] = useState<Record<TabKey, AdminSubmission[]>>({ spot: [], work: [], photographer: [] });
  const [allowed, setAllowed] = useState(true);
  const [message, setMessage] = useState("审核数据加载中...");
  const [reviewNote, setReviewNote] = useState("信息已核验，允许进入展示队列。");
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    setIsLoading(true);
    const result = await listAdminSubmissions();
    setItems({ spot: result.spots, work: result.works, photographer: result.photographers });
    setAllowed(result.allowed);
    setMessage(result.message || (result.mode === "demo" ? "当前为演示模式，后端未连接。" : "已连接 Supabase 审核队列。"));
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const currentItems = useMemo(() => items[activeTab], [activeTab, items]);

  async function handleReview(item: AdminSubmission, action: ReviewAction) {
    const result = await reviewSubmission(item.type, item.id, action, reviewNote);
    setMessage(result.message);
    if (!result.ok) return;
    const nextStatus = (result.status || "pending") as SubmissionStatus;
    setItems((current) => ({
      ...current,
      [item.type]: current[item.type].map((entry) => entry.id === item.id ? { ...entry, status: nextStatus, reviewNote } : entry),
    }));
  }

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="共建" actionLabel="返回共建" actionHref="/contribute" />

        <section className="gy-admin-head">
          <div>
            <Eyebrow muted>ADMIN REVIEW</Eyebrow>
            <h1 className="gy-page-title">审核投稿内容</h1>
            <CoralRule />
            <p className="gy-body-copy">管理员集中审核点位投稿、作品投稿和摄影师主页，通过后再进入公开展示流程。</p>
            <p className="gy-backend-note">{message} {!allowed ? <Link href="/login">去登录</Link> : null}</p>
          </div>
          <div className="gy-admin-tabs">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" className={activeTab === tab.key ? "is-active" : ""} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {!allowed ? (
          <section className="gy-panel gy-admin-empty">
            <h2>无权限访问</h2>
            <p className="gy-body-copy">当前账号不是管理员。请使用 role=admin 的账号登录，或在演示模式下查看审核流程。</p>
          </section>
        ) : (
          <section className="gy-admin-layout">
            <div className="gy-panel gy-admin-list">
              {isLoading ? <p className="gy-body-copy">正在读取审核队列...</p> : null}
              {!isLoading && currentItems.length === 0 ? <p className="gy-body-copy">当前没有待展示内容。</p> : null}
              {currentItems.map((item) => (
                <article className="gy-admin-item" key={item.id}>
                  <div className="gy-admin-item-main">
                    {item.imageUrls[0] ? <img src={item.imageUrls[0]} alt={`${item.title}投稿图片`} /> : <div className="gy-admin-image-empty">暂无图片</div>}
                    <div>
                      <div className="gy-review-title">
                        <strong>{item.title}</strong>
                        <span className={`gy-status gy-status-${statusLabel[item.status]}`}>{statusLabel[item.status]}</span>
                      </div>
                      <p className="gy-body-copy">{item.summary}</p>
                      <p className="gy-admin-meta">提交人：{item.submittedBy || "未知"} · 提交时间：{item.createdAt}</p>
                      {item.reviewNote ? <p className="gy-admin-note">备注：{item.reviewNote}</p> : null}
                    </div>
                  </div>
                  <div className="gy-admin-actions">
                    <button type="button" className="gy-primary-button" onClick={() => handleReview(item, "approve")}>通过</button>
                    <button type="button" className="gy-secondary-button" onClick={() => handleReview(item, "request_revision")}>需补充</button>
                    <button type="button" className="gy-secondary-button" onClick={() => handleReview(item, "reject")}>拒绝</button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="gy-panel gy-admin-note-panel">
              <h2>审核备注</h2>
              <label className="gy-textarea-card">
                <span>本次操作说明</span>
                <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
              </label>
              <p className="gy-body-copy">真实模式下，审核操作会更新对应投稿状态，并写入 `review_logs`。演示模式只更新当前页面状态。</p>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
