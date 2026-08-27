"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Eyebrow, TopNav } from "@/components/guangying-ui";

type ReviewStatus = "待审核" | "已通过" | "需补充";
type ReviewItem = { name: string; status: ReviewStatus; note: string };

const initialReviews: ReviewItem[] = [
  { name: "花墙侧逆光机位", status: "待审核", note: "需要确认坐标和图片授权。" },
  { name: "凌水湖木桥侧影", status: "已通过", note: "已进入春季路线候选点位。" },
  { name: "伯川台阶低机位", status: "需补充", note: "缺少第二张参考成片。" },
];

export default function ContributeClient() {
  const [form, setForm] = useState({
    name: "伯川侧边柱廊",
    location: "伯川图书馆东侧台阶下方",
    time: "08:30-09:30",
    sun: "东南侧光",
    lens: "50mm",
    season: "春 / 秋",
    tips: "摄影者站在台阶下方偏左，人物从柱廊侧边慢走或回望。",
  });
  const [reviews, setReviews] = useState(initialReviews);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newItem = { name: form.name.trim() || "未命名机位", status: "待审核" as const, note: "刚刚提交，等待确认坐标、图片与技巧。" };
    setReviews((items) => [newItem, ...items.filter((item) => item.name !== newItem.name)]);
    setSubmittedName(newItem.name);
  }

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="共建" actionLabel="返回地图" actionHref="/map" />
        <section style={{ paddingTop: 42 }}>
          <Eyebrow muted>CO-BUILD SPOTS</Eyebrow>
          <h1 className="gy-page-title">把你发现的机位，加入光影大工</h1>
          <p className="gy-body-copy" style={{ marginTop: 16 }}>摄影社、摄影者和同学可以提交坐标、图片与技巧，进入待审核队列后再展示到地图。</p>
        </section>

        <section className="gy-contribute-layout">
          <form className="gy-panel gy-side-panel" onSubmit={submit}>
            <h2>提交机位</h2>
            {submittedName ? <p className="gy-submit-note">“{submittedName}” 已提交，当前状态：待审核。</p> : null}
            <div className="gy-form-grid">
              <div className="gy-input-card"><label>点位名称</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
              <div className="gy-input-card"><label>位置描述</label><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div>
              <div className="gy-input-card"><label>推荐时间</label><input value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></div>
              <div className="gy-input-card"><label>太阳方向</label><input value={form.sun} onChange={(event) => setForm({ ...form, sun: event.target.value })} /></div>
              <div className="gy-input-card"><label>推荐焦段</label><input value={form.lens} onChange={(event) => setForm({ ...form, lens: event.target.value })} /></div>
              <div className="gy-input-card"><label>适合季节</label><input value={form.season} onChange={(event) => setForm({ ...form, season: event.target.value })} /></div>
            </div>
            <label className="gy-textarea-card">
              <span>技巧说明</span>
              <textarea value={form.tips} onChange={(event) => setForm({ ...form, tips: event.target.value })} />
            </label>
            <label className="gy-upload-box">
              <input type="file" accept="image/*" multiple />
              <span>图片上传区域：参考成片、机位示意、技巧说明</span>
            </label>
            <div style={{ display: "flex", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
              <button type="submit" className="gy-primary-button">提交并进入待审核</button>
              <Link href="/map" className="gy-secondary-button">返回地图</Link>
            </div>
          </form>

          <aside id="review" className="gy-panel gy-side-panel">
            <h2>审核状态演示</h2>
            <div style={{ marginTop: 22 }}>
              {reviews.map((item) => (
                <div className="gy-review-item" key={`${item.name}-${item.status}`}>
                  <div className="gy-review-title">
                    <strong>{item.name}</strong>
                    <span className={`gy-status gy-status-${item.status}`}>{item.status}</span>
                  </div>
                  <p className="gy-body-copy" style={{ fontSize: 13 }}>{item.note}</p>
                </div>
              ))}
            </div>
            <p className="gy-body-copy" style={{ marginTop: 28, fontSize: 13 }}>审核通过后，新机位会进入点位库，并可在校园影像地图和点位知识卡中展示。</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
