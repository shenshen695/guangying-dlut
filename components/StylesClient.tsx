"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CoralRule, Eyebrow, Pill, TopNav } from "@/components/guangying-ui";
import type { SeasonPreference, StyleReference } from "@/types/planner";

type StyleCategory = "全部" | Exclude<StyleReference, "海风清透">;

type StyleCard = {
  name: Exclude<StyleReference, "海风清透">;
  category: StyleCategory;
  image: string;
  seasons: SeasonPreference[];
  spots: string[];
  colors: string[];
  mood: string;
};

const categories: StyleCategory[] = ["全部", "清透自然", "学院纪实", "复古胶片", "电影氛围", "低饱和", "新中式", "Citywalk感", "多巴胺轻彩"];

const styleCards: StyleCard[] = [
  { name: "清透自然", category: "清透自然", image: "/campus-v2/lingshui-lake-wide.jpg", seasons: ["春", "夏"], spots: ["南门", "凌水湖"], colors: ["米白", "浅蓝", "薄荷绿"], mood: "适合想要干净、轻松、不强摆拍的毕业照。" },
  { name: "学院纪实", category: "学院纪实", image: "/images/spot-library/南大门连理.jpg", seasons: ["春", "秋"], spots: ["伯川", "主楼"], colors: ["白色", "牛仔蓝", "卡其"], mood: "适合同学同行、课堂感和正式毕业纪念。" },
  { name: "复古胶片", category: "复古胶片", image: "/campus-v2/campus-autumn-light.jpg", seasons: ["秋", "冬"], spots: ["伯川", "一馆"], colors: ["暖棕", "褪色红", "墨绿"], mood: "适合老建筑、树影和带故事感的安静画面。" },
  { name: "电影氛围", category: "电影氛围", image: "/campus-v2/lingshui-golden.jpg", seasons: ["秋", "冬"], spots: ["主楼", "凌水湖"], colors: ["深蓝", "金色", "雾灰"], mood: "适合黄昏、逆光、远景和剪影收尾。" },
  { name: "低饱和", category: "低饱和", image: "/images/spot-library/凌水湖.jpg", seasons: ["春", "冬"], spots: ["凌水湖", "主楼"], colors: ["灰白", "雾蓝", "浅灰绿"], mood: "适合阴天、湖边和建筑线条，画面更安静。" },
  { name: "新中式", category: "新中式", image: "/images/spot-library/伯川图书馆内.jpg", seasons: ["春", "秋"], spots: ["伯川", "一馆"], colors: ["月白", "墨绿", "黛灰"], mood: "适合石阶、门廊、树荫和克制的毕业纪念。" },
  { name: "Citywalk感", category: "Citywalk感", image: "/campus-v2/campus-shuyang-road.jpg", seasons: ["夏", "秋"], spots: ["南门", "一馆"], colors: ["白色", "牛仔蓝", "浅卡其"], mood: "适合校园漫步、朋友同行和抓拍式叙事。" },
  { name: "多巴胺轻彩", category: "多巴胺轻彩", image: "/images/spot-library/花墙.jpg", seasons: ["夏"], spots: ["花墙", "凌水湖"], colors: ["浅黄", "天空蓝", "草绿"], mood: "适合多人、活泼场景和轻量彩色道具。" },
];

const trendItems = [
  { name: "清冷低饱和", keywords: "雾蓝 / 灰白 / 留白", spots: "湖边、阴天、建筑线条", time: "上午或阴天", note: "压低颜色，让人物和校园空间都更安静。" },
  { name: "松弛感纪实", keywords: "抓拍 / 漫步 / 同行", spots: "南门、一馆、校园路", time: "上午", note: "像真实的一天，而不是一组刻意摆拍。" },
  { name: "胶片颗粒感", keywords: "暖棕 / 树影 / 老建筑", spots: "伯川、一馆、长廊", time: "傍晚", note: "适合把毕业照拍成有时间感的相册页。" },
  { name: "新中式校园感", keywords: "月白 / 墨绿 / 石阶", spots: "伯川、门廊、树荫", time: "清晨", note: "用校园建筑秩序承接更含蓄的毕业纪念。" },
  { name: "电影感逆光", keywords: "黄昏 / 剪影 / 远景", spots: "主楼、凌水湖", time: "黄金时刻", note: "把路线最后一站做成情绪收尾。" },
  { name: "多巴胺轻彩", keywords: "浅黄 / 蓝绿 / 小道具", spots: "花墙、草坪、湖边", time: "夏日下午", note: "只用少量亮色，保留轻快但不杂乱。" },
];

export default function StylesClient() {
  const [active, setActive] = useState<StyleCategory>("全部");
  const filtered = useMemo(() => active === "全部" ? styleCards : styleCards.filter((card) => card.category === active), [active]);

  return (
    <main className="gy-page">
      <div className="gy-container gy-styles-container">
        <TopNav active="风格" actionLabel="生成路线" actionHref="/planner" />
        <section className="gy-styles-head">
          <div>
            <Eyebrow muted>STYLE REFERENCES</Eyebrow>
            <h1 className="gy-page-title">毕业影像风格参考</h1>
            <CoralRule />
            <p className="gy-body-copy">从参考成片理解风格，再让光影大工生成适合的校园路线。</p>
          </div>
          <div className="gy-style-tabs" role="tablist" aria-label="风格分类筛选">
            {categories.map((category) => (
              <button key={category} type="button" className={active === category ? "is-active" : ""} onClick={() => setActive(category)}>
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="gy-agent-entry-band gy-panel" id="style-agent-entry">
          <div>
            <Eyebrow>STYLE AGENT</Eyebrow>
            <h2>还没定风格？先和 Agent 聊出风格。</h2>
            <p>确认人数、穿搭、偏好和避开方向后，再进入路线生成。</p>
          </div>
          <Link href="/agent" className="gy-primary-button">
            打开 Agent
          </Link>
        </section>

        <section className="gy-style-library-layout">
          <div className="gy-style-card-grid">
            {filtered.map((card) => {
              const href = `/planner?style=${encodeURIComponent(card.name)}&season=${encodeURIComponent(card.seasons[0])}`;
              return (
                <article key={card.name} className="gy-panel gy-style-card">
                  <img src={card.image} alt={`${card.name}参考成片`} />
                  <div className="gy-style-card-content">
                    <div className="gy-style-card-title">
                      <h2>{card.name}</h2>
                      <Pill active>{card.seasons.join(" / ")}</Pill>
                    </div>
                    <p>{card.mood}</p>
                    <div className="gy-style-meta">
                      <span>点位：{card.spots.join("、")}</span>
                      <span>色彩：{card.colors.join(" / ")}</span>
                    </div>
                    <Link href={href} className="gy-secondary-button">用这个风格生成路线</Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="gy-style-aside-stack">
            <aside className="gy-panel gy-style-trend-panel">
              <Eyebrow>NEW TREND</Eyebrow>
              <h2>新兴风格推荐</h2>
              <div className="gy-style-trend-list">
                {trendItems.map((item) => (
                  <Link key={item.name} href={`/planner?style=${encodeURIComponent(item.name === "清冷低饱和" ? "低饱和" : item.name === "松弛感纪实" ? "Citywalk感" : item.name === "胶片颗粒感" ? "复古胶片" : item.name === "新中式校园感" ? "新中式" : item.name === "电影感逆光" ? "电影氛围" : "多巴胺轻彩")}`}>
                    <strong>{item.name}</strong>
                    <span>{item.keywords}</span>
                    <p>{item.spots} · {item.time}</p>
                    <em>{item.note}</em>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
