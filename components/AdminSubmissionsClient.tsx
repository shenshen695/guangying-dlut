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
  { key: "photographer", label: "摄影师申请" },
  { key: "spot", label: "点位投稿" },
  { key: "work", label: "作品投稿" },
];

export default function AdminSubmissionsClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("photographer");
  const [items, setItems] = useState<Record<TabKey, AdminSubmission[]>>({ spot: [], work: [], photographer: [] });
  const [allowed, setAllowed] = useState(true);
  const [message, setMessage] = useState("审核数据加载中...");
  const [reviewNote, setReviewNote] = useState("信息已核验，允许进入展示队列。");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");

  async function loadData() {
    setIsLoading(true);
    const result = await listAdminSubmissions();
    setItems({ spot: result.spots, work: result.works, photographer: result.photographers });
    setAllowed(result.allowed);
    setMessage(result.message || (result.mode === "demo" ? "当前为演示模式，后端未连接。" : "已连接 Supabase 审核队列。"));
    setSelectedId(result.photographers[0]?.id || result.spots[0]?.id || result.works[0]?.id || "");
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const currentItems = useMemo(() => items[activeTab], [activeTab, items]);
  const selectedItem = useMemo(() => currentItems.find((item) => item.id === selectedId) || currentItems[0] || null, [currentItems, selectedId]);
  const allItems = useMemo(() => [...items.photographer, ...items.spot, ...items.work], [items]);
  const stats = useMemo(() => ({
    pending: allItems.filter((item) => item.status === "pending").length,
    needs_revision: allItems.filter((item) => item.status === "needs_revision").length,
    approved: allItems.filter((item) => item.status === "approved").length,
  }), [allItems]);

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
            <h1 className="gy-page-title">共建审核工作台</h1>
            <CoralRule />
            <p className="gy-body-copy">管理员集中审核摄影师申请、点位投稿和作品投稿，通过后再进入公开展示流程。</p>
            <p className="gy-backend-note">{message} {!allowed ? <Link href="/login">去登录</Link> : null}</p>
          </div>
          <div className="gy-admin-stats" aria-label="审核统计">
            <article><span>待审核</span><strong>{stats.pending}</strong></article>
            <article><span>需补充</span><strong>{stats.needs_revision}</strong></article>
            <article><span>已通过</span><strong>{stats.approved}</strong></article>
          </div>
        </section>

        {!allowed ? (
          <section className="gy-panel gy-admin-empty">
            <h2>无权限访问</h2>
            <p className="gy-body-copy">当前账号不是管理员。请使用 role=admin 的账号登录，或在演示模式下查看审核流程。</p>
          </section>
        ) : (
          <section className="gy-admin-workbench">
            <div className="gy-panel gy-admin-queue">
              <div className="gy-admin-tabs">
                {tabs.map((tab) => (
                  <button key={tab.key} type="button" className={activeTab === tab.key ? "is-active" : ""} onClick={() => {
                    setActiveTab(tab.key);
                    setSelectedId(items[tab.key][0]?.id || "");
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="gy-admin-queue-list">
                {isLoading ? <p className="gy-body-copy">正在读取审核队列...</p> : null}
                {!isLoading && currentItems.length === 0 ? <p className="gy-body-copy">当前没有待展示内容。</p> : null}
                {currentItems.map((item) => (
                  <button
                    type="button"
                    className={selectedItem?.id === item.id ? "gy-admin-queue-item is-active" : "gy-admin-queue-item"}
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                  >
                    {item.imageUrls[0] ? <img src={item.imageUrls[0]} alt={`${item.title}投稿图片`} /> : <span className="gy-admin-image-empty">暂无图片</span>}
                    <span>
                      <strong>{item.title}</strong>
                      <em>{item.summary}</em>
                      <small>{item.createdAt} · {item.submittedBy || "未知提交人"}</small>
                    </span>
                    <i className={`gy-status gy-status-${statusLabel[item.status]}`}>{statusLabel[item.status]}</i>
                  </button>
                ))}
              </div>
            </div>

            <aside className="gy-panel gy-admin-detail-panel">
              {selectedItem ? (
                <>
                  <div className="gy-review-title">
                    <strong>{selectedItem.title}</strong>
                    <span className={`gy-status gy-status-${statusLabel[selectedItem.status]}`}>{statusLabel[selectedItem.status]}</span>
                  </div>
                  <p className="gy-admin-meta">提交人：{selectedItem.submittedBy || "未知"} · 提交时间：{selectedItem.createdAt}</p>
                  <p className="gy-body-copy">{selectedItem.summary}</p>
                  <div className="gy-admin-detail-images">
                    {selectedItem.imageUrls.length > 0
                      ? selectedItem.imageUrls.slice(0, 3).map((image) => <img key={image} src={image} alt={`${selectedItem.title}审核图片`} />)
                      : <div className="gy-admin-image-empty">暂无图片</div>}
                  </div>
                  <div className="gy-admin-detail-grid">
                    {(selectedItem.details || []).map((detail) => (
                      <div key={detail.label}>
                        <span>{detail.label}</span>
                        <strong>{detail.value}</strong>
                      </div>
                    ))}
                  </div>
                  {selectedItem.reviewNote ? <p className="gy-admin-note">历史备注：{selectedItem.reviewNote}</p> : null}
                  <label className="gy-textarea-card">
                    <span>审核备注</span>
                    <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
                  </label>
                  <div className="gy-admin-review-actions">
                    <button type="button" className="gy-primary-button" onClick={() => handleReview(selectedItem, "approve")}>通过</button>
                    <button type="button" className="gy-secondary-button" onClick={() => handleReview(selectedItem, "request_revision")}>需补充</button>
                    <button type="button" className="gy-secondary-button" onClick={() => handleReview(selectedItem, "reject")}>拒绝</button>
                  </div>
                  <p className="gy-body-copy">真实模式下，审核操作会更新对应投稿状态，并写入 `review_logs`。</p>
                </>
              ) : (
                <p className="gy-body-copy">请选择左侧一条投稿查看详情。</p>
              )}
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
