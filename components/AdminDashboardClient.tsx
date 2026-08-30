"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CoralRule, Eyebrow, TopNav } from "@/components/guangying-ui";
import {
  getAdminDashboard,
  statusLabel,
  updatePublishedContentStatus,
  type AdminContentItem,
  type AdminDashboardData,
  type AdminQualityIssue,
  type AdminReviewLog,
} from "@/lib/supabase/backend";

type TabKey = "photographer" | "work" | "spot" | "quality";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "photographer", label: "摄影师管理" },
  { key: "work", label: "作品管理" },
  { key: "spot", label: "点位管理" },
  { key: "quality", label: "数据质量" },
];

const emptyDashboard: AdminDashboardData = {
  photographers: [],
  works: [],
  spots: [],
  qualityIssues: [],
  reviewLogs: [],
  stats: { photographers: 0, works: 0, spots: 0, pending: 0 },
};

const seasons = ["全部", "春", "夏", "秋", "冬"];
const styles = ["全部", "清透自然", "学院纪实", "复古胶片", "电影氛围", "低饱和", "新中式"];

function actionLabel(log: AdminReviewLog) {
  if (log.action === "approve") return "通过";
  if (log.action === "request_revision") return "需补充";
  return "拒绝";
}

function readDetail(item: AdminContentItem, label: string) {
  return item.details.find((detail) => detail.label === label)?.value || "";
}

function applyLocalPatch(data: AdminDashboardData, item: AdminContentItem, patch: { featured?: boolean; isPublic?: boolean; latitude?: number | null; longitude?: number | null }) {
  const update = (entry: AdminContentItem) => {
    if (entry.id !== item.id) return entry;
    const next = { ...entry };
    if (typeof patch.featured === "boolean") next.featured = patch.featured;
    if (typeof patch.isPublic === "boolean") next.isPublic = patch.isPublic;
    if (patch.latitude !== undefined) next.latitude = patch.latitude;
    if (patch.longitude !== undefined) next.longitude = patch.longitude;
    next.details = next.details.map((detail) => {
      if (detail.label === "公开状态" && typeof patch.isPublic === "boolean") {
        return { ...detail, value: patch.isPublic ? "公开展示" : "已下架" };
      }
      if ((detail.label === "推荐状态" || detail.label === "精选状态") && typeof patch.featured === "boolean") {
        return { ...detail, value: patch.featured ? (next.type === "work" ? "已精选" : next.type === "spot" ? "地图推荐" : "已推荐") : "未推荐" };
      }
      if (detail.label === "坐标" && (patch.latitude !== undefined || patch.longitude !== undefined)) {
        return { ...detail, value: next.latitude && next.longitude ? `${next.latitude}, ${next.longitude}` : "坐标待补充" };
      }
      return detail;
    });
    return next;
  };

  const next: AdminDashboardData = {
    ...data,
    photographers: data.photographers.map(update),
    works: data.works.map(update),
    spots: data.spots.map(update),
  };
  next.stats = {
    ...next.stats,
    photographers: next.photographers.filter((entry) => entry.status === "approved" && entry.isPublic).length,
    works: next.works.filter((entry) => entry.status === "approved" && entry.isPublic).length,
    spots: next.spots.filter((entry) => entry.status === "approved" && entry.isPublic).length,
  };
  return next;
}

export default function AdminDashboardClient() {
  const [data, setData] = useState<AdminDashboardData>(emptyDashboard);
  const [allowed, setAllowed] = useState(true);
  const [message, setMessage] = useState("正在读取管理员工作台...");
  const [activeTab, setActiveTab] = useState<TabKey>("photographer");
  const [selectedId, setSelectedId] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("全部");
  const [styleFilter, setStyleFilter] = useState("全部");
  const [latitudeDraft, setLatitudeDraft] = useState("");
  const [longitudeDraft, setLongitudeDraft] = useState("");

  async function loadData(nextTab = activeTab) {
    const result = await getAdminDashboard();
    setData(result.data);
    setAllowed(result.allowed);
    setMessage(result.message || (result.mode === "demo" ? "当前为演示模式。" : "已连接管理员工作台。"));
    const nextItems = nextTab === "photographer"
      ? result.data.photographers
      : nextTab === "work"
        ? result.data.works
        : nextTab === "spot"
          ? result.data.spots
          : result.data.qualityIssues;
    setSelectedId(nextItems[0]?.id || "");
  }

  useEffect(() => {
    loadData();
  }, []);

  const workItems = useMemo(() => data.works.filter((item) => {
    const season = readDetail(item, "季节");
    const style = readDetail(item, "风格标签");
    if (seasonFilter !== "全部" && season !== seasonFilter) return false;
    if (styleFilter !== "全部" && !style.includes(styleFilter)) return false;
    return true;
  }), [data.works, seasonFilter, styleFilter]);

  const currentItems = useMemo(() => {
    if (activeTab === "photographer") return data.photographers;
    if (activeTab === "work") return workItems;
    if (activeTab === "spot") return data.spots;
    return [];
  }, [activeTab, data.photographers, data.spots, workItems]);

  const currentIssues = activeTab === "quality" ? data.qualityIssues : [];
  const selectedItem = currentItems.find((item) => item.id === selectedId) || currentItems[0] || null;
  const selectedIssue = currentIssues.find((issue) => issue.id === selectedId) || currentIssues[0] || null;
  const relatedLogs = selectedItem
    ? data.reviewLogs.filter((log) => log.targetId === selectedItem.id || log.targetId === selectedItem.sourceId).slice(0, 5)
    : [];

  useEffect(() => {
    if (!selectedItem || selectedItem.type !== "spot") return;
    setLatitudeDraft(selectedItem.latitude ? String(selectedItem.latitude) : "");
    setLongitudeDraft(selectedItem.longitude ? String(selectedItem.longitude) : "");
  }, [selectedItem]);

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    const firstId = tab === "photographer"
      ? data.photographers[0]?.id
      : tab === "work"
        ? workItems[0]?.id
        : tab === "spot"
          ? data.spots[0]?.id
          : data.qualityIssues[0]?.id;
    setSelectedId(firstId || "");
  }

  async function updateItem(item: AdminContentItem, patch: { featured?: boolean; isPublic?: boolean; latitude?: number | null; longitude?: number | null }) {
    setMessage("正在保存管理员设置...");
    const result = await updatePublishedContentStatus(item.type, item.id, patch);
    setMessage(result.message);
    if (!result.ok) return;
    if ("demo" in result && result.demo) {
      setData((current) => applyLocalPatch(current, item, patch));
      return;
    }
    setData((current) => applyLocalPatch(current, item, patch));
  }

  async function saveCoordinates(item: AdminContentItem) {
    const latitude = Number(latitudeDraft);
    const longitude = Number(longitudeDraft);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setMessage("请填写有效的经纬度，例如 38.881 和 121.526。");
      return;
    }
    await updateItem(item, { latitude, longitude });
  }

  function renderQueueItem(item: AdminContentItem) {
    return (
      <button
        key={item.id}
        type="button"
        className={selectedItem?.id === item.id ? "gy-admin-queue-item is-active" : "gy-admin-queue-item"}
        onClick={() => setSelectedId(item.id)}
      >
        {item.imageUrls[0] ? <img src={item.imageUrls[0]} alt={`${item.title}管理图片`} /> : <span className="gy-admin-image-empty">暂无图片</span>}
        <span>
          <strong>{item.title}</strong>
          <em>{item.summary}</em>
          <small>{item.createdAt} · {item.isPublic ? "公开" : "已下架"} · {item.featured ? "推荐" : "未推荐"}</small>
        </span>
        <i className={`gy-status gy-status-${statusLabel[item.status]}`}>{statusLabel[item.status]}</i>
      </button>
    );
  }

  function renderIssueItem(issue: AdminQualityIssue) {
    return (
      <button
        key={issue.id}
        type="button"
        className={selectedIssue?.id === issue.id ? "gy-admin-queue-item is-active" : "gy-admin-queue-item"}
        onClick={() => setSelectedId(issue.id)}
      >
        <span className="gy-admin-quality-mark">{issue.severity === "warning" ? "!" : "i"}</span>
        <span>
          <strong>{issue.title}</strong>
          <em>{issue.summary}</em>
          <small>{issue.targetType === "photographer" ? "摄影师" : issue.targetType === "work" ? "作品" : "点位"} · 需要后续补充</small>
        </span>
      </button>
    );
  }

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="共建" actionLabel="审核队列" actionHref="/admin/submissions" />

        <section className="gy-admin-head">
          <div>
            <Eyebrow muted>ADMIN DASHBOARD</Eyebrow>
            <h1 className="gy-page-title">管理员工作台</h1>
            <CoralRule />
            <p className="gy-body-copy">管理已经进入公开展示流程的摄影师、作品与共建点位，保留审核后的下架和推荐能力。</p>
            <p className="gy-backend-note">{message} {!allowed ? <Link href="/login">去登录</Link> : null}</p>
          </div>
          <div className="gy-admin-dashboard-stats">
            <article><span>已认证摄影师</span><strong>{data.stats.photographers}</strong></article>
            <article><span>已公开作品</span><strong>{data.stats.works}</strong></article>
            <article><span>已公开点位</span><strong>{data.stats.spots}</strong></article>
            <article><span>待处理审核</span><strong>{data.stats.pending}</strong></article>
          </div>
        </section>

        {!allowed ? (
          <section className="gy-panel gy-admin-empty">
            <h2>无权限访问</h2>
            <p className="gy-body-copy">只有管理员账号可以进入内容管理工作台。请先登录 role=admin 的账号。</p>
            <div className="gy-admin-actions">
              <Link href="/login" className="gy-primary-button">去登录</Link>
              <Link href="/" className="gy-secondary-button">返回首页</Link>
            </div>
          </section>
        ) : (
          <section className="gy-admin-workbench gy-admin-dashboard-workbench">
            <div className="gy-panel gy-admin-queue">
              <div className="gy-admin-tabs">
                {tabs.map((tab) => (
                  <button key={tab.key} type="button" className={activeTab === tab.key ? "is-active" : ""} onClick={() => switchTab(tab.key)}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "work" ? (
                <div className="gy-admin-dashboard-filters">
                  <select value={seasonFilter} onChange={(event) => setSeasonFilter(event.target.value)}>
                    {seasons.map((season) => <option key={season}>{season}</option>)}
                  </select>
                  <select value={styleFilter} onChange={(event) => setStyleFilter(event.target.value)}>
                    {styles.map((style) => <option key={style}>{style}</option>)}
                  </select>
                </div>
              ) : null}

              <div className="gy-admin-queue-list">
                {activeTab === "quality"
                  ? currentIssues.map(renderIssueItem)
                  : currentItems.map(renderQueueItem)}
                {activeTab !== "quality" && currentItems.length === 0 ? <p className="gy-body-copy">当前没有可管理内容。</p> : null}
                {activeTab === "quality" && currentIssues.length === 0 ? <p className="gy-body-copy">目前没有明显的数据质量问题。</p> : null}
              </div>
            </div>

            <aside className="gy-panel gy-admin-detail-panel">
              {selectedIssue ? (
                <>
                  <Eyebrow muted>DATA QUALITY</Eyebrow>
                  <h2>{selectedIssue.title}</h2>
                  <p className="gy-body-copy">{selectedIssue.summary}</p>
                  <div className="gy-admin-review-actions">
                    <button type="button" className="gy-primary-button" onClick={() => {
                      const tab = selectedIssue.targetType === "photographer" ? "photographer" : selectedIssue.targetType === "work" ? "work" : "spot";
                      setActiveTab(tab);
                      setSelectedId(selectedIssue.targetId);
                    }}>查看对应内容</button>
                    {selectedIssue.href ? <Link href={selectedIssue.href} className="gy-secondary-button">查看前台</Link> : null}
                  </div>
                </>
              ) : selectedItem ? (
                <>
                  <div className="gy-review-title">
                    <strong>{selectedItem.title}</strong>
                    <span className={`gy-status gy-status-${statusLabel[selectedItem.status]}`}>{statusLabel[selectedItem.status]}</span>
                  </div>
                  <p className="gy-admin-meta">{selectedItem.createdAt} · {selectedItem.submittedBy || "未知提交人"}</p>
                  <p className="gy-body-copy">{selectedItem.summary}</p>

                  <div className="gy-admin-detail-images">
                    {selectedItem.imageUrls.length
                      ? selectedItem.imageUrls.slice(0, 3).map((image) => <img key={image} src={image} alt={`${selectedItem.title}图片`} />)
                      : <div className="gy-admin-image-empty">暂无图片</div>}
                  </div>

                  <div className="gy-admin-detail-grid">
                    {selectedItem.details.map((detail) => (
                      <div key={detail.label}>
                        <span>{detail.label}</span>
                        <strong>{detail.value}</strong>
                      </div>
                    ))}
                  </div>

                  {selectedItem.qualityIssues.length ? (
                    <div className="gy-admin-quality-box">
                      <span>数据提醒</span>
                      {selectedItem.qualityIssues.map((issue) => <p key={issue}>{issue}</p>)}
                    </div>
                  ) : null}

                  {selectedItem.status !== "approved" ? (
                    <div className="gy-admin-quality-box">
                      <span>审核提示</span>
                      <p>该内容还没有通过审核，请先到审核队列处理。</p>
                      <Link href="/admin/submissions">进入审核队列 →</Link>
                    </div>
                  ) : (
                    <>
                      {selectedItem.type === "spot" ? (
                        <div className="gy-admin-coordinate-editor">
                          <div className="gy-input-card">
                            <label>纬度 latitude</label>
                            <input value={latitudeDraft} onChange={(event) => setLatitudeDraft(event.target.value)} placeholder="38.881" />
                          </div>
                          <div className="gy-input-card">
                            <label>经度 longitude</label>
                            <input value={longitudeDraft} onChange={(event) => setLongitudeDraft(event.target.value)} placeholder="121.526" />
                          </div>
                          <button type="button" className="gy-secondary-button" onClick={() => saveCoordinates(selectedItem)}>保存坐标</button>
                        </div>
                      ) : null}

                      <div className="gy-admin-review-actions">
                        <button type="button" className="gy-primary-button" onClick={() => updateItem(selectedItem, { isPublic: !selectedItem.isPublic })}>
                          {selectedItem.isPublic ? selectedItem.type === "photographer" ? "下架主页" : selectedItem.type === "work" ? "下架作品" : "下架点位" : "恢复公开"}
                        </button>
                        <button type="button" className="gy-secondary-button" onClick={() => updateItem(selectedItem, { featured: !selectedItem.featured })}>
                          {selectedItem.featured ? selectedItem.type === "work" ? "取消精选" : "取消推荐" : selectedItem.type === "work" ? "设为精选" : "设为推荐"}
                        </button>
                        {selectedItem.href ? <Link href={selectedItem.href} className="gy-secondary-button">查看前台</Link> : null}
                      </div>
                    </>
                  )}

                  <div className="gy-admin-log-list">
                    <h3>最近审核记录</h3>
                    {relatedLogs.length ? relatedLogs.map((log) => (
                      <article key={log.id}>
                        <strong>{actionLabel(log)}</strong>
                        <span>{log.createdAt}</span>
                        <p>{log.note}</p>
                      </article>
                    )) : <p className="gy-body-copy">暂无审核记录。</p>}
                  </div>
                </>
              ) : (
                <p className="gy-body-copy">请选择左侧内容查看详情。</p>
              )}
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
