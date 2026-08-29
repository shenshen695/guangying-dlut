import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export type NavKey = "主页" | "风格" | "企划" | "地图" | "摄影者" | "共建";

export const routeStops = [
  {
    id: "south-gate",
    slug: "south-gate",
    name: "南门",
    time: "08:00",
    light: "柔光",
    lens: "35mm",
    action: "开场全景",
    area: "南门广场",
    bestTime: "08:00-09:30",
    sun: "东南侧光",
    camera: "广场入口偏右",
    crowd: "中",
    description: "从南门走进校园，也走进毕业照的第一幕。开阔入口适合作为路线开场。",
    tips: "先拍正面合影，再沿入口道路向内走，保留队伍向前的动势。",
    photo: "/assets/ui/season-spring.png",
    position: { left: "9%", top: "78%" },
  },
  {
    id: "bochuan",
    slug: "bochuan",
    name: "伯川",
    time: "08:35",
    light: "自然光",
    lens: "35mm",
    action: "台阶回望",
    area: "伯川图书馆周边",
    bestTime: "08:30-09:20",
    sun: "东南侧光",
    camera: "台阶下方偏左",
    crowd: "低",
    description: "伯川周边有清晰建筑线条和安静步行空间，适合拍自然交流与回望镜头。",
    tips: "利用台阶和长廊形成纵深，人物从台阶中段回头看镜头。",
    photo: "/assets/ui/season-summer.png",
    position: { left: "42%", top: "50%" },
  },
  {
    id: "main-building",
    slug: "main-building",
    name: "主楼",
    time: "09:20",
    light: "斜光",
    lens: "50mm",
    action: "正式毕业照",
    area: "主楼前广场",
    bestTime: "09:10-10:00",
    sun: "侧前光",
    camera: "广场中轴偏低",
    crowd: "高",
    description: "主楼是毕业路线中的校园记忆核心，适合个人肖像、班级合影和建筑纪念照。",
    tips: "建议穿学士服，先拍建筑全景，再靠近台阶补拍半身和学位帽动作。",
    photo: "/assets/ui/season-autumn.png",
    position: { left: "62%", top: "24%" },
  },
  {
    id: "ling-shui-lake",
    slug: "ling-shui-lake",
    name: "凌水湖",
    time: "10:10",
    light: "逆光",
    lens: "85mm",
    action: "湖畔收尾",
    area: "凌水湖畔",
    bestTime: "16:30-18:30",
    sun: "西侧逆光",
    camera: "湖边木桥外侧",
    crowd: "中",
    description: "湖面把校园天空和树影收进画面，适合在路线后半段放慢节奏拍自然侧影。",
    tips: "利用湖面反光和树影层次，人物动作保持松弛，适合拍背影与侧脸。",
    photo: "/assets/ui/season-winter.png",
    position: { left: "88%", top: "58%" },
  },
];

export const seasons = [
  { name: "春", badge: "推荐", time: "08:00", light: "柔光", lens: "35mm", image: "/assets/ui/season-spring.png" },
  { name: "夏", badge: "", time: "12:30", light: "自然光", lens: "35mm", image: "/assets/ui/season-summer.png" },
  { name: "秋", badge: "", time: "16:30", light: "斜光", lens: "50mm", image: "/assets/ui/season-autumn.png" },
  { name: "冬", badge: "", time: "18:30", light: "逆光", lens: "85mm", image: "/assets/ui/season-winter.png" },
];

export const photographers = [
  { name: "若水", meta: "摄影社 · 清透 / 学院", route: "春日花阶线", status: "可互勉", image: "/assets/ui/season-spring.png" },
  { name: "Ming", meta: "校友 · 胶片 / 建筑", route: "经典毕业线", status: "可约拍", image: "/assets/ui/season-autumn.png" },
  { name: "林同学", meta: "爱好者 · 湖畔 / 人像", route: "凌水湖", status: "互勉", image: "/assets/ui/season-summer.png" },
  { name: "Yu", meta: "学生 · 冬季 / 室内", route: "主楼", status: "授权", image: "/assets/ui/season-winter.png" },
  { name: "阿澈", meta: "摄影社 · 花墙 / 双人", route: "花墙线", status: "可约拍", image: "/assets/ui/season-spring.png" },
  { name: "北辰", meta: "校友 · 胶片 / 夜景", route: "校园夜线", status: "授权", image: "/assets/ui/season-autumn.png" },
];

export function PageShell({
  active,
  actionLabel = "生成路线",
  actionHref = "/planner",
  containerClassName = "",
  children,
}: {
  active: NavKey;
  actionLabel?: string;
  actionHref?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  return (
    <main className="gy-page">
      <div className={containerClassName ? `gy-container ${containerClassName}` : "gy-container"}>
        <TopNav active={active} actionLabel={actionLabel} actionHref={actionHref} />
        {children}
      </div>
    </main>
  );
}

export function TopNav({ active, actionLabel, actionHref }: { active: NavKey; actionLabel: string; actionHref: string }) {
  const nav: Array<{ label: NavKey; href: string }> = [
    { label: "主页", href: "/" },
    { label: "风格", href: "/styles" },
    { label: "企划", href: "/planner" },
    { label: "地图", href: "/map" },
    { label: "摄影者", href: "/photographers" },
    { label: "共建", href: "/contribute" },
  ];

  return (
    <header className="gy-nav">
      <Link href="/" className="gy-brand" aria-label="光影大工首页">
        光影大工<span className="gy-seal">印</span>
      </Link>
      <nav className="gy-nav-links" aria-label="主导航">
        {nav.map((item) => (
          <Link key={item.label} className={item.label === active ? "is-active" : ""} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="gy-nav-actions">
        <Link href={actionHref} className="gy-outline-button">
          {actionLabel} <span aria-hidden>↗</span>
        </Link>
        <Link href="/login" className="gy-outline-button gy-login-button">
          登录
        </Link>
      </div>
    </header>
  );
}

export function Eyebrow({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <p className={muted ? "gy-eyebrow muted" : "gy-eyebrow"}>{children}</p>;
}

export function CoralRule() {
  return <span className="gy-coral-rule" aria-hidden />;
}

export function Pill({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return <span className={active ? "gy-pill is-active" : "gy-pill"}>{children}</span>;
}

export function SeasonCard({ season, active = false }: { season: (typeof seasons)[number]; active?: boolean }) {
  return (
    <Link href={`/planner?season=${encodeURIComponent(season.name)}`} className={active ? "gy-season-card is-active" : "gy-season-card"}>
      <div className="gy-season-card-head">
        <h3>{season.name}</h3>
        {season.badge ? <span>{season.badge}</span> : null}
      </div>
      <img src={season.image} alt={`${season.name}季毕业成片参考`} />
      <div className="gy-season-meta">
        <span>{season.time}</span>
        <span>{season.light}</span>
        <span>{season.lens}</span>
      </div>
    </Link>
  );
}

export function IllustratedMap({
  selectedSlug = "south-gate",
  compact = false,
}: {
  selectedSlug?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "gy-map is-compact" : "gy-map"}>
      <svg viewBox="0 0 760 430" role="img" aria-label="春日花阶毕业线校园地图">
        <path className="gy-map-road" d="M42 91 C142 54 241 78 337 70 C452 60 573 44 724 76" />
        <path className="gy-map-road thin" d="M76 344 C164 288 244 252 326 225 C430 190 511 151 600 90" />
        <ellipse className="gy-map-lake" cx="598" cy="246" rx="134" ry="91" />
        <ellipse className="gy-map-island" cx="609" cy="253" rx="32" ry="20" />
        <g className="gy-map-buildings">
          <rect x="94" y="110" width="142" height="46" rx="5" />
          <rect x="250" y="88" width="142" height="52" rx="5" />
          <rect x="405" y="74" width="146" height="47" rx="5" />
          <rect x="157" y="213" width="147" height="47" rx="5" />
          <rect x="354" y="305" width="123" height="40" rx="5" />
        </g>
        <g className="gy-map-trees">
          <ellipse cx="594" cy="53" rx="42" ry="16" />
          <ellipse cx="482" cy="173" rx="26" ry="12" />
          <ellipse cx="394" cy="216" rx="28" ry="11" />
          <ellipse cx="666" cy="337" rx="33" ry="13" />
          <ellipse cx="556" cy="361" rx="25" ry="11" />
        </g>
        <path className="gy-map-route" d="M79 342 C154 290 238 252 320 226 C426 190 520 129 599 92 C636 130 679 179 707 243 C681 294 638 327 584 330 C531 331 492 305 471 271" />
      </svg>
      <div className="gy-map-distance">
        <span>路线总长</span>
        <strong>约2.6km</strong>
      </div>
      {routeStops.map((spot, index) => {
        const style = spot.position as CSSProperties;
        return (
          <Link
            href={`/spot/${spot.slug}`}
            key={spot.slug}
            className={selectedSlug === spot.slug ? "gy-map-pin is-selected" : "gy-map-pin"}
            style={style}
          >
            <span>{index + 1}</span>
            <em>{spot.name}</em>
          </Link>
        );
      })}
    </div>
  );
}

export function RouteSummaryStrip({ title = "春日花阶企划" }: { title?: string }) {
  return (
    <section className="gy-plan-strip">
      <img className="gy-plan-cover" src="/assets/ui/route-cover-spring.png" alt="春日花阶路线参考成片" />
      <div className="gy-plan-main">
        <div className="gy-plan-title">
          <h2>{title}</h2>
          <span>已生成</span>
        </div>
        <div className="gy-route-chain">
          {routeStops.map((spot, index) => (
            <span key={spot.slug}>
              <Link href={`/spot/${spot.slug}`}>{spot.name}</Link>
              {index < routeStops.length - 1 ? <b>→</b> : null}
            </span>
          ))}
        </div>
        <p>清晨薄风与校园的干净色调，适合轻松、自然的毕业影像。</p>
        <div className="gy-plan-meta">
          <span>☼ 08:00 开始</span>
          <span>⌁ 约2.6km</span>
          <span>◷ 预计 2.5 小时</span>
        </div>
      </div>
      <div className="gy-plan-column">
        <h3>造型建议</h3>
        <p>浅色系 / 白衬衫</p>
        <p>牛仔 / 卡其</p>
        <p>学士服（可选）</p>
      </div>
      <div className="gy-plan-column">
        <h3>拍摄清单</h3>
        <p>01 南门广场全景</p>
        <p>02 伯川阶梯回望</p>
        <p>03 主楼仰拍 + 人像</p>
        <p>04 凌水湖侧影剪影</p>
      </div>
      <div className="gy-plan-column">
        <h3>AI 建议</h3>
        <p>清晨光线柔和，顺光为主，利用湖面与建筑的对称构图。</p>
        <Link href="/route/classic-graduation">查看完整路线 →</Link>
      </div>
    </section>
  );
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="gy-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
