"use client";

import Link from "next/link";
import { useState } from "react";

type Role = "visitor" | "photographer";

export default function WelcomeClient() {
  const [hovered, setHovered] = useState<Role | null>(null);

  return (
    <main className="gy-welcome-page">
      {/* Brand */}
      <header className="gy-welcome-header">
        <span className="gy-brand" aria-label="光影大工">
          光影大工<span className="gy-seal">印</span>
        </span>
      </header>

      {/* Hero */}
      <section className="gy-welcome-hero">
        <p className="gy-eyebrow">GUANGYING DLUT</p>
        <h1 className="gy-welcome-title">
          校内机位共享平台
        </h1>
        <p className="gy-welcome-sub">
          自由探索校内美景 · 定制毕业季路线 · 连接真实摄影者
        </p>
      </section>

      {/* Role cards */}
      <section className="gy-role-row" aria-label="选择你的身份">
        {/* Visitor card */}
        <Link
          href="/styles"
          className={`gy-role-card gy-role-visitor${hovered === "visitor" ? " is-hovered" : ""}`}
          onMouseEnter={() => setHovered("visitor")}
          onMouseLeave={() => setHovered(null)}
          aria-label="我是用户，探索校园与定制路线"
        >
          <div className="gy-role-icon" aria-hidden>
            {/* Camera + person SVG */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" fill="rgba(22,123,117,.08)" stroke="rgba(22,123,117,.25)" strokeWidth="1.5" />
              <path d="M16 30 Q18 26 24 26 Q30 26 32 30" stroke="#167b75" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <circle cx="24" cy="20" r="4" fill="#167b75" fillOpacity=".18" stroke="#167b75" strokeWidth="1.8" />
              <rect x="13" y="32" width="22" height="3" rx="1.5" fill="#167b75" fillOpacity=".12" />
            </svg>
          </div>
          <div className="gy-role-body">
            <p className="gy-role-eyebrow">FOR STUDENTS</p>
            <h2 className="gy-role-title">我是用户</h2>
            <p className="gy-role-desc">
              规划定制拍摄路线
            </p>
            <ul className="gy-role-perks">
              <li>🗺 校园实景地图探索</li>
              <li>📅 毕业季路线定制</li>
              <li>✨ AI 风格与机位推荐</li>
            </ul>
          </div>
          <div className="gy-role-cta">
            开始探索 <span aria-hidden>→</span>
          </div>
        </Link>

        {/* Divider */}
        <div className="gy-role-divider" aria-hidden>
          <span>或</span>
        </div>

        {/* Photographer card */}
        <Link
          href="/map?route=campus-highlights"
          className={`gy-role-card gy-role-photographer${hovered === "photographer" ? " is-hovered" : ""}`}
          onMouseEnter={() => setHovered("photographer")}
          onMouseLeave={() => setHovered(null)}
          aria-label="我是摄影师，查看机位地图"
        >
          <div className="gy-role-icon" aria-hidden>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" fill="rgba(220,111,91,.06)" stroke="rgba(220,111,91,.22)" strokeWidth="1.5" />
              {/* Camera body */}
              <rect x="12" y="19" width="24" height="16" rx="3.5" fill="rgba(220,111,91,.12)" stroke="#dc6f5b" strokeWidth="1.8" />
              <circle cx="24" cy="27" r="5" fill="none" stroke="#dc6f5b" strokeWidth="1.8" />
              <circle cx="24" cy="27" r="2.5" fill="#dc6f5b" fillOpacity=".22" />
              <path d="M18 19 L20 14 H28 L30 19" stroke="#dc6f5b" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
              <rect x="32" y="21" width="3" height="2.5" rx="1" fill="#dc6f5b" fillOpacity=".4" />
            </svg>
          </div>
          <div className="gy-role-body">
            <p className="gy-role-eyebrow">FOR PHOTOGRAPHERS</p>
            <h2 className="gy-role-title">我是摄影师</h2>
            <p className="gy-role-desc">
              查看精细机位地图，了解各点位最佳拍摄条件，参与校园摄影共建。
            </p>
            <ul className="gy-role-perks">
              <li>📍 精细机位地图</li>
              <li>💬 共建讨论区</li>
              <li>📸 上传机位样片</li>
            </ul>
          </div>
          <div className="gy-role-cta gy-role-cta-coral">
            查看机位地图 <span aria-hidden>→</span>
          </div>
        </Link>
      </section>

      <footer className="gy-welcome-footer">
        <p>路线与机位来自学生共建贡献　<Link href="/contribute" className="gy-teal-link">了解共建计划 ↗</Link></p>
      </footer>
    </main>
  );
}
