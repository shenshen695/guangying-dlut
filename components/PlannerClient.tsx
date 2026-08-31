"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import spotsData from "@/data/spots.json";
import routesData from "@/data/routes.json";
import WeatherRecommend from "@/components/WeatherRecommend";
import PlannerMapPreview from "@/components/PlannerMapPreview";
import { buildShootingPlan } from "@/lib/planner/buildPlan";
import { parsePeopleCount } from "@/lib/planner/people";
import type { PlannerInput, SeasonPreference, ShootingPlan, StyleReference, TimeSlot, WalkingTolerance } from "@/types/planner";
import type { Route } from "@/types/route";
import type { Spot } from "@/types/spot";
import { CoralRule, Eyebrow, Field, Pill, TopNav } from "@/components/guangying-ui";

const spots = spotsData as Spot[];
const routes = routesData as Route[];
const styles: StyleReference[] = ["清透自然", "学院纪实", "复古胶片", "电影氛围", "低饱和", "新中式", "Citywalk感", "多巴胺轻彩"];
const supportedStyles: StyleReference[] = ["海风清透", ...styles];
const seasons: SeasonPreference[] = ["春", "夏", "秋", "冬"];

const fallbackPlan: ShootingPlan = {
  style: "学院纪实",
  styleReason: "已加载春日花阶备用企划，路线点位均来自已收录的校园机位。",
  selectedSpotIds: ["south-gate", "bochuan", "main-building", "ling-shui-lake"],
  colorPalette: ["米白", "浅青", "低饱和蓝"],
  outfit: {
    inner: "白色或浅色内搭",
    shoes: "便于步行的浅色鞋",
    accessory: "花束、校牌或学位帽",
  },
  actions: ["南门开场全景", "伯川台阶回望", "主楼正式毕业照", "凌水湖湖畔收尾"],
  avoid: ["不生成不存在点位", "不使用未经授权图片", "不在高峰期长时间占路"],
  notice: "备用企划会保留完整路线、拍摄节奏和造型建议。",
};

export default function PlannerClient() {
  const searchParams = useSearchParams();
  const initialSeason = (seasons.includes(searchParams.get("season") as SeasonPreference) ? searchParams.get("season") : "春") as SeasonPreference;
  const initialStyle = (supportedStyles.includes(searchParams.get("style") as StyleReference) ? searchParams.get("style") : null) as StyleReference | null;
  const [input, setInput] = useState<PlannerInput>({
    styleReference: initialStyle,
    season: initialSeason,
    peopleCount: 1,
    shootDate: "",
    timeSlot: "morning",
    hasAcademicGown: true,
    dressingColor: "白色内搭",
    indoorBackupNeeded: false,
    walkingTolerance: "medium",
  });
  const [peopleDraft, setPeopleDraft] = useState("1");
  const [plan, setPlan] = useState<ShootingPlan | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const selectedSpots = useMemo(() => {
    const ids = plan?.selectedSpotIds || fallbackPlan.selectedSpotIds;
    return ids.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean) as Spot[];
  }, [plan]);
  const resultPlan = plan || fallbackPlan;
  const mapHref = `/map?spots=${encodeURIComponent(selectedSpots.map((spot) => spot.id).join(","))}&style=${encodeURIComponent(resultPlan.style)}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const generated = buildShootingPlan(input, spots);
      if (!generated.selectedSpotIds.every((id) => spots.some((spot) => spot.id === id))) throw new Error("generated unknown spot");
      setPlan(generated);
      setUsedFallback(false);
    } catch {
      setPlan(fallbackPlan);
      setUsedFallback(true);
    }
  }

  function updatePeopleCount(value: string) {
    setPeopleDraft(value);
    const parsed = parsePeopleCount(value);
    const numeric = Number(value);
    const nextCount = parsed ?? (Number.isFinite(numeric) && numeric > 0 ? numeric : null);
    if (nextCount) {
      setInput((current) => ({ ...current, peopleCount: Math.max(1, Math.min(20, Math.round(nextCount))) }));
    }
  }

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="企划" actionLabel="查看地图" actionHref="/map?route=campus-highlights" />
        <section className="gy-planner-live-layout">
          <div>
            <Eyebrow>SHOOTING PLANNER</Eyebrow>
            <h1 className="gy-page-title">填写拍摄需求，生成毕业路线</h1>
            <CoralRule />
            <p className="gy-body-copy">填写人数、时间、季节和风格后，系统会从已收录的校园机位中生成一条可执行路线。</p>
            <div className="gy-source-strip">
              <Pill active>当前季节：{input.season}</Pill>
              <Pill>{input.styleReference ? `当前风格：${input.styleReference}` : "当前风格：系统推断"}</Pill>
              <Pill>{initialStyle ? "来源：风格参考库" : "来源：主页 / 手动填写"}</Pill>
            </div>
            <Link href="/agent" className="gy-agent-inline-link">
              还没想好风格？先和 Agent 聊一下 ↗
            </Link>

            <form onSubmit={submit} className="gy-panel gy-planner-form">
              <div>
                <span className="gy-form-label">参考季节</span>
                <div className="gy-choice-row">
                  {seasons.map((season) => (
                    <button key={season} type="button" className={input.season === season ? "gy-choice is-active" : "gy-choice"} onClick={() => setInput({ ...input, season })}>
                      {season}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="gy-form-label">成片风格</span>
                <div className="gy-choice-row">
                  {styles.map((style) => (
                    <button key={style} type="button" className={input.styleReference === style ? "gy-choice is-active" : "gy-choice"} onClick={() => setInput({ ...input, styleReference: input.styleReference === style ? null : style })}>
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gy-form-grid">
                <div className="gy-input-card">
                  <label>拍摄人数</label>
                  <input type="text" inputMode="text" value={peopleDraft} onChange={(event) => updatePeopleCount(event.target.value)} placeholder="例如：3 / 三个人 / 我和两个朋友" />
                </div>
                <div className="gy-input-card">
                  <label>拍摄日期</label>
                  <input type="date" value={input.shootDate} onChange={(event) => setInput({ ...input, shootDate: event.target.value })} />
                </div>
                <div className="gy-input-card">
                  <label>时间段</label>
                  <select value={input.timeSlot} onChange={(event) => setInput({ ...input, timeSlot: event.target.value as TimeSlot })}>
                    <option value="morning">上午</option>
                    <option value="afternoon">下午</option>
                    <option value="golden_hour">黄金时刻</option>
                    <option value="evening">傍晚</option>
                  </select>
                </div>
                <div className="gy-input-card">
                  <label>步行接受度</label>
                  <select value={input.walkingTolerance} onChange={(event) => setInput({ ...input, walkingTolerance: event.target.value as WalkingTolerance })}>
                    <option value="short">短距离</option>
                    <option value="medium">中等</option>
                    <option value="long">可以多走</option>
                  </select>
                </div>
                <div className="gy-input-card">
                  <label>服装主色</label>
                  <input value={input.dressingColor} onChange={(event) => setInput({ ...input, dressingColor: event.target.value })} />
                </div>
                <div className="gy-input-card">
                  <label>学士服 / 室内备选</label>
                  <div className="gy-checkbox-stack">
                    <label><input type="checkbox" checked={input.hasAcademicGown} onChange={(event) => setInput({ ...input, hasAcademicGown: event.target.checked })} /> 穿学士服</label>
                    <label><input type="checkbox" checked={input.indoorBackupNeeded} onChange={(event) => setInput({ ...input, indoorBackupNeeded: event.target.checked })} /> 需要室内备选</label>
                  </div>
                </div>
              </div>

              <button type="submit" className="gy-primary-button" style={{ width: "100%", marginTop: 22 }}>
                生成我的毕业影像路线
              </button>
            </form>
          </div>

          <aside className="gy-panel gy-generated-panel">
            {usedFallback ? <p className="gy-fallback-note">生成服务暂时不可用，已加载春日花阶备用企划。</p> : null}
            <Eyebrow>{plan ? "ROUTE GENERATED" : "DEFAULT PREVIEW"}</Eyebrow>
            <h2>{plan ? `${resultPlan.style}企划路线` : "等待生成路线"}</h2>
            <p className="gy-body-copy">{resultPlan.styleReason}</p>
            <div className="gy-pill-row">
              <Pill active>{input.season}</Pill>
              <Pill>{selectedSpots.length} 个点位</Pill>
              <Pill>{input.walkingTolerance === "short" ? "短距离" : input.walkingTolerance === "medium" ? "中等步行" : "完整路线"}</Pill>
            </div>
            <PlannerMapPreview spotIds={selectedSpots.map((spot) => spot.id)} title={resultPlan.style} />
            <div className="gy-field-grid gy-field-grid-compact">
              {selectedSpots.slice(0, 4).map((spot) => (
                <Field key={spot.id} label={spot.name} value={`${spot.bestTime} · ${spot.actionSuggestion}`} />
              ))}
            </div>
            <section className="gy-plan-mini">
              <div>
                <h3>造型建议</h3>
                <p>{resultPlan.colorPalette.join(" / ")}；{resultPlan.outfit.inner}；{resultPlan.outfit.accessory}</p>
              </div>
              <div>
                <h3>Shot List</h3>
                <ul>{resultPlan.actions.map((action) => <li key={action}>{action}</li>)}</ul>
              </div>
            </section>
            <WeatherRecommend />
            <div className="gy-map-detail-actions">
              <Link href={mapHref} className="gy-primary-button">在地图中查看路线</Link>
              <Link href="/route/classic-graduation" className="gy-secondary-button">查看路线详情</Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
