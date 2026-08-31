"use client";

import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/AppIcon";
import PhotographySelections from "@/components/PhotographySelections";
import { getCampusMedia } from "@/data/media";

const weekly = [
  { title: "凌水湖", detail: "日落倒影 / 湖边人像", media: "lake-golden", href: "/spot/ling-shui-lake", featured: true },
  { title: "主楼广场", detail: "建筑全景 / 对称构图", media: "main-building", href: "/spot/main-building" },
  { title: "伯川", detail: "静谧阅读 / 建筑线条", media: "autumn-light", href: "/spot/bochuan" },
];

const shortcuts: Array<{ label: string; icon: AppIconName; href: string }> = [
  { label: "凌水湖", icon: "location", href: "/map?spot=ling-shui-lake" },
  { label: "毕业照", icon: "graduation", href: "/planner?style=学院纪实" },
  { label: "日落", icon: "sun", href: "/planner?style=电影氛围" },
  { label: "建筑", icon: "building", href: "/styles?style=学院纪实" },
  { label: "夜景", icon: "moon", href: "/styles?style=电影氛围" },
];

const guides = [
  { title: "毕业路线怎么排", subtitle: "南门 / 伯川 / 主楼 / 凌水湖", href: "/route/classic-graduation" },
  { title: "凌水湖机位", subtitle: "实景位置 / 方向 / 时间", href: "/spot/ling-shui-lake/view" },
  { title: "上传你的作品", subtitle: "照片 / 机位 / 审核", href: "/submit" },
];

export default function MobileHomeSections() {
  const atmosphere = getCampusMedia("autumn-walk");

  return (
    <main className="gy-mobile-home">
      <header className="gy-mobile-hero">
        <img src={atmosphere.src} alt="" />
        <div>
          <h1>光影大工</h1>
          <p><AppIcon name="sun" /> 今日推荐 · 凌水湖适合拍倒影</p>
        </div>
      </header>

      <section className="gy-mobile-search-card">
        <form action="/map">
          <AppIcon name="search" />
          <input name="search" aria-label="搜索地点、机位、拍摄主题" placeholder="搜索地点、机位、拍摄主题" />
          <button type="submit">搜索</button>
        </form>
        <div className="gy-mobile-shortcuts">
          {shortcuts.map((item) => (
            <Link key={item.label} href={item.href}>
              <AppIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <MobileSection title="本周值得拍" action="地图探索" href="/map">
        <div className="gy-mobile-weekly-grid">
          {weekly.map((item) => {
            const media = getCampusMedia(item.media);
            return (
              <Link key={item.title} href={item.href} className={item.featured ? "is-featured" : ""}>
                <img src={media.src} alt={media.alt} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
              </Link>
            );
          })}
        </div>
      </MobileSection>

      <MobileSection title="大工摄影精选" action="上传作品" href="/submit">
        <PhotographySelections />
      </MobileSection>

      <MobileSection title="摄影攻略" action="查看更多" href="/map">
        <div className="gy-mobile-guide-list">
          {guides.map((guide) => (
            <Link key={guide.title} href={guide.href}>
              <span>
                <strong>{guide.title}</strong>
                <small>{guide.subtitle}</small>
              </span>
              <AppIcon name="arrow" />
            </Link>
          ))}
        </div>
      </MobileSection>

      <Link href="/planner" className="gy-mobile-plan-entry">
        <span><AppIcon name="sparkles" /></span>
        <strong>为我规划一次拍摄</strong>
        <small>时间、地点与光线安排</small>
        <AppIcon name="arrow" />
      </Link>
    </main>
  );
}

function MobileSection({ title, action, href, children }: { title: string; action: string; href: string; children: React.ReactNode }) {
  return (
    <section className="gy-mobile-section">
      <div className="gy-mobile-section-head">
        <h2>{title}</h2>
        <Link href={href}>{action}<AppIcon name="arrow" /></Link>
      </div>
      {children}
    </section>
  );
}
