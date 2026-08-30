"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import spotsData from "@/data/spots.json";
import routesData from "@/data/routes.json";
import mapPointsData from "@/data/map-points.json";
import { buildShootingPlan } from "@/lib/planner/buildPlan";
import type { PlannerInput, SeasonPreference, ShootingPlan, StyleReference, TimeSlot, WalkingTolerance } from "@/types/planner";
import type { Route } from "@/types/route";
import type { MapPoint } from "@/types/map-point";
import type { Spot } from "@/types/spot";
import { CoralRule, Eyebrow, Field, IllustratedMap, Pill, TopNav } from "@/components/guangying-ui";
import WeatherRecommend from "@/components/WeatherRecommend";

const spots = spotsData as Spot[];
const routes = routesData as Route[];
const mapPoints = mapPointsData as MapPoint[];

const styles: StyleReference[] = ["清透自然", "学院纪实", "复古胶片", "电影氛围", "低饱和", "新中式", "Citywalk感", "多巴胺轻彩"];
const supportedStyles: StyleReference[] = ["海风清透", ...styles];
const seasons: SeasonPreference[] = ["春", "夏", "秋", "冬"];

type SeasonCategory = "春" | "夏" | "秋" | "冬" | "四季经典";

type ClassicSpot = {
  id: string;
  name: string;
  intro: string;
};

const SEASON_CLASSICS: Record<SeasonCategory, ClassicSpot[]> = {
  春: [
    { id: "bochuan", name: "伯川玉兰", intro: "四月开放，花期约一周，白色玉兰与图书馆台阶相映。" },
    { id: "bochuan", name: "伯川二月兰", intro: "四月开放，花期约三周，紫色花带适合低机位拍摄。" },
    { id: "second-building", name: "二馆玉兰", intro: "四月馆前玉兰开放，建筑线条与花枝层次清晰。" },
  ],
  夏: [
    { id: "lover-road", name: "情人路", intro: "林荫浓密、绿意充足，上午和傍晚都有柔和光斑。" },
    { id: "lover-slope", name: "情人坡", intro: "绿树与草坡适合清新自然的人像和集体照。" },
    { id: "ling-shui-lake", name: "凌水湖", intro: "湖畔层次丰富，傍晚逆光和倒影尤其适合收尾。" },
  ],
  秋: [
    { id: "second-building", name: "二馆与建艺银杏", intro: "银杏转黄后层次丰富，晴天上午色彩最通透。" },
    { id: "first-building", name: "一馆银杏林道", intro: "金色林道适合行走抓拍和纵深构图。" },
    { id: "lover-road", name: "情人路", intro: "暖色树叶与林荫路形成安静的校园秋景。" },
  ],
  冬: [
    { id: "lover-slope", name: "情人坡雪景", intro: "雪后草坡白雪皑皑，建议在积雪未被踩乱前拍摄。" },
  ],
  四季经典: [
    { id: "south-gate", name: "南门", intro: "辨识度最高的校园入口，适合作为路线开场。" },
    { id: "chairman-statue", name: "主席像", intro: "庄重经典的毕业纪念机位，适合正式合影。" },
    { id: "music-fountain", name: "音乐喷泉", intro: "广场开阔，适合多人合影与校园氛围照。" },
    { id: "ling-shui-lake", name: "凌水湖", intro: "四季景观各有变化，适合安排在路线后半段。" },
    { id: "flower-wall", name: "花墙", intro: "色彩明亮，适合作为毕业路线的轻快收尾。" },
  ],
};

const SEASON_TABS: SeasonCategory[] = ["春", "夏", "秋", "冬", "四季经典"];

function currentSeason(): SeasonCategory {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

const WEATHER_SPOT_ALIASES: Record<string, string> = {
  伯川玉兰: "bochuan",
  伯川二月兰: "bochuan",
  伯川台阶: "bochuan",
  伯川: "bochuan",
  "伯川台阶（有屋檐遮挡）": "bochuan",
  伯川图书馆内廊: "bochuan",
  二馆玉兰: "second-building",
  二馆与建艺银杏: "second-building",
  一馆银杏林道: "first-building",
  情人路: "lover-road",
  情人坡: "lover-slope",
  情人坡雪景: "lover-slope",
  凌水湖: "ling-shui-lake",
  南门: "south-gate",
  主席像: "chairman-statue",
  音乐喷泉: "music-fountain",
  花墙: "flower-wall",
  令希图书馆: "first-building",
  综合一号楼门厅: "comprehensive-one",
  主楼: "main-building",
  大活前廊: "student-center",
};

// ── Fixed preset routes ──────────────────────────────────────────────────────
const PRESET_ROUTES = [
  {
    id: "classic-graduation",
    name: "经典毕业线",
    desc: "南门 → 伯川 → 主楼 → 凌水湖 · 覆盖最受欢迎的四个地标，约 2.6km",
    duration: "约 150 分钟",
    season: "全年",
    spotIds: ["south-gate", "bochuan", "main-building", "ling-shui-lake"],
    label: "毕业纪念",
  },
  {
    id: "west-campus",
    name: "西部校园路线",
    desc: "情人路 → 伯川 → 令希图书馆 → 二馆 → 综一 · 探索西部建筑群",
    duration: "约 90 分钟",
    season: "全年",
    spotIds: ["lover-road", "bochuan", "first-building", "second-building", "comprehensive-one"],
    label: "建筑探索",
  },
] as const;

const fallbackPlan: ShootingPlan = {
  style: "学院纪实",
  styleReason: "大部分同学拍学院纪实，建筑线条稳、光线要求不高，成片很耐看。",
  selectedSpotIds: routes[0].spots.slice(0, 4),
  colorPalette: ["米白", "浅青", "低饱和蓝"],
  outfit: { inner: "白色或浅色内搭", shoes: "便于步行的浅色鞋", accessory: "花束、校牌或学位帽" },
  actions: ["南门开场全景", "伯川台阶回望", "主楼正式毕业照", "凌水湖湖畔收尾"],
  avoid: ["不生成不存在点位", "不使用未经授权图片", "不在高峰期长时间占路"],
  notice: "路线来自已录入的真实候选点位，具体机位请以现场安全和授权情况为准。",
};

type Tab = "preset" | "custom";

export default function PlannerClient() {
  const searchParams = useSearchParams();
  const initialSeason = (seasons.includes(searchParams.get("season") as SeasonPreference)
    ? searchParams.get("season")
    : "春") as SeasonPreference;
  const initialStyle = (supportedStyles.includes(searchParams.get("style") as StyleReference)
    ? searchParams.get("style")
    : null) as StyleReference | null;

  const [tab, setTab] = useState<Tab>("preset");
  const [activeSeason, setActiveSeason] = useState<SeasonCategory>(currentSeason);
  const [selectedClassicSpotIds, setSelectedClassicSpotIds] = useState<string[]>([]);

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

  const [plan, setPlan] = useState<ShootingPlan | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  // For custom tab: derive spots from generated plan
  const customSelectedSpots = useMemo(() => {
    const ids = plan?.selectedSpotIds || fallbackPlan.selectedSpotIds;
    return ids.map((id) => spots.find((s) => s.id === id)).filter(Boolean) as Spot[];
  }, [plan]);

  const resultPlan = plan || fallbackPlan;
  const customMapHref = `/map?route=custom&spots=${encodeURIComponent(customSelectedSpots.map((s) => s.id).join(","))}&style=${encodeURIComponent(resultPlan.style)}`;
  const selectedClassicMapHref = `/map?route=custom&spots=${encodeURIComponent(selectedClassicSpotIds.join(","))}`;

  function toggleClassicSpot(id: string) {
    setSelectedClassicSpotIds((current) =>
      current.includes(id) ? current.filter((spotId) => spotId !== id) : [...current, id]
    );
  }

  function addWeatherSpot(name: string) {
    const directMatch = mapPoints.find((point) => point.name === name)?.id;
    const id = directMatch || WEATHER_SPOT_ALIASES[name];
    if (!id) return;
    setSelectedClassicSpotIds((current) => (current.includes(id) ? current : [...current, id]));
  }

  function submitCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const generated = buildShootingPlan(input, spots);
      if (!generated.selectedSpotIds.every((id) => spots.some((s) => s.id === id))) throw new Error("unknown spot");
      setPlan(generated);
      setUsedFallback(false);
    } catch {
      setPlan(fallbackPlan);
      setUsedFallback(true);
    }
  }

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="企划" actionLabel="查看地图" actionHref="/map" />

        <div className="gy-planner-head">
          <Eyebrow>ROUTE PLANNER</Eyebrow>
          <h1 className="gy-page-title">选择或定制你的毕业路线</h1>
          <CoralRule />
          <p className="gy-body-copy">选一条经典路线直接上手，或者填几个问题让我们帮你配。</p>
        </div>

        {/* Tab switcher */}
        <div className="gy-planner-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "preset"}
            className={tab === "preset" ? "is-active" : ""}
            onClick={() => setTab("preset")}
          >
            经典地点
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "custom"}
            className={tab === "custom" ? "is-active" : ""}
            onClick={() => setTab("custom")}
          >
            定制路线
          </button>
        </div>

        {/* ── PRESET TAB ─────────────────────────────────── */}
        {tab === "preset" && (
          <section className="gy-planner-discovery">
            <WeatherRecommend onAddSpot={addWeatherSpot} />

            <section className="gy-classic-section" aria-labelledby="classic-spots-title">
              <div className="gy-classic-heading">
                <div>
                  <Eyebrow>SEASONAL PICKS</Eyebrow>
                  <h2 id="classic-spots-title">经典打卡地点</h2>
                </div>
                <p>当前默认显示{currentSeason()}季，也可以切换查看其他季节。</p>
              </div>

              <div className="gy-season-tabs" role="tablist" aria-label="按季节查看经典地点">
                {SEASON_TABS.map((season) => (
                  <button
                    key={season}
                    type="button"
                    role="tab"
                    aria-selected={activeSeason === season}
                    className={activeSeason === season ? "is-active" : ""}
                    onClick={() => setActiveSeason(season)}
                  >
                    {season === "四季经典" ? season : `${season}季`}
                  </button>
                ))}
              </div>

              <div className="gy-classic-spot-list">
                {SEASON_CLASSICS[activeSeason].map((spot) => {
                  const isAdded = selectedClassicSpotIds.includes(spot.id);
                  return (
                    <article key={`${activeSeason}-${spot.name}`} className="gy-classic-spot-row">
                      <div>
                        <h3>{spot.name}</h3>
                        <p>{spot.intro}</p>
                      </div>
                      <button
                        type="button"
                        className={isAdded ? "is-added" : ""}
                        onClick={() => toggleClassicSpot(spot.id)}
                      >
                        {isAdded ? "✓ 已加入" : "＋ 加入路线"}
                      </button>
                    </article>
                  );
                })}
              </div>

              {selectedClassicSpotIds.length > 0 && (
                <div className="gy-selected-route-bar">
                  <span>已选 {selectedClassicSpotIds.length} 个机位</span>
                  <div>
                    <button type="button" onClick={() => setSelectedClassicSpotIds([])}>清空</button>
                    <Link href={selectedClassicMapHref}>在地图中自动规划 →</Link>
                  </div>
                </div>
              )}
            </section>

            <section className="gy-route-text-section" aria-labelledby="preset-route-title">
              <div className="gy-classic-heading">
                <div>
                  <Eyebrow>READY-MADE ROUTES</Eyebrow>
                  <h2 id="preset-route-title">直接使用推荐路线</h2>
                </div>
                <p>不想逐个选择时，可以直接从两条校园路线开始。</p>
              </div>
              <div className="gy-route-text-grid">
                {PRESET_ROUTES.map((preset) => (
                  <article key={preset.id} className="gy-route-text-card">
                    <span className="gy-route-label">{preset.label}</span>
                    <h3>{preset.name}</h3>
                    <p>{preset.desc}</p>
                    <div className="gy-route-text-meta">
                      <span>{preset.duration}</span>
                      <span>{preset.spotIds.length} 个点位</span>
                      <span>{preset.season}</span>
                    </div>
                    <Link href={`/map?route=${preset.id}`}>在地图中查看路线 →</Link>
                  </article>
                ))}
              </div>
            </section>
          </section>
        )}

        {/* ── CUSTOM TAB ─────────────────────────────────── */}
        {tab === "custom" && (
          <section className="gy-planner-live-layout">
            <div>
              <p className="gy-body-copy">
                填写几个问题，帮你从真实点位里找到合适的路线。
              </p>

              <form onSubmit={submitCustom} className="gy-panel gy-planner-form">
                <div>
                  <span className="gy-form-label">参考季节</span>
                  <div className="gy-choice-row">
                    {seasons.map((season) => (
                      <button
                        key={season}
                        type="button"
                        className={input.season === season ? "gy-choice is-active" : "gy-choice"}
                        onClick={() => setInput({ ...input, season })}
                      >
                        {season}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="gy-form-label">成片风格</span>
                  <div className="gy-choice-row">
                    {styles.map((style) => (
                      <button
                        key={style}
                        type="button"
                        className={input.styleReference === style ? "gy-choice is-active" : "gy-choice"}
                        onClick={() => setInput({ ...input, styleReference: input.styleReference === style ? null : style })}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gy-form-grid">
                  <div className="gy-input-card">
                    <label>拍摄人数</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={input.peopleCount}
                      onChange={(e) => setInput({ ...input, peopleCount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="gy-input-card">
                    <label>拍摄日期</label>
                    <input
                      type="date"
                      value={input.shootDate}
                      onChange={(e) => setInput({ ...input, shootDate: e.target.value })}
                    />
                  </div>
                  <div className="gy-input-card">
                    <label>时间段</label>
                    <select
                      value={input.timeSlot}
                      onChange={(e) => setInput({ ...input, timeSlot: e.target.value as TimeSlot })}
                    >
                      <option value="morning">上午</option>
                      <option value="afternoon">下午</option>
                      <option value="golden_hour">黄金时刻</option>
                      <option value="evening">傍晚</option>
                    </select>
                  </div>
                  <div className="gy-input-card">
                    <label>步行接受度</label>
                    <select
                      value={input.walkingTolerance}
                      onChange={(e) => setInput({ ...input, walkingTolerance: e.target.value as WalkingTolerance })}
                    >
                      <option value="short">短距离</option>
                      <option value="medium">中等</option>
                      <option value="long">可以多走</option>
                    </select>
                  </div>
                  <div className="gy-input-card">
                    <label>服装主色</label>
                    <input
                      value={input.dressingColor}
                      onChange={(e) => setInput({ ...input, dressingColor: e.target.value })}
                    />
                  </div>
                  <div className="gy-input-card">
                    <label>学士服 / 室内备选</label>
                    <div className="gy-checkbox-stack">
                      <label>
                        <input
                          type="checkbox"
                          checked={input.hasAcademicGown}
                          onChange={(e) => setInput({ ...input, hasAcademicGown: e.target.checked })}
                        />{" "}
                        穿学士服
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={input.indoorBackupNeeded}
                          onChange={(e) => setInput({ ...input, indoorBackupNeeded: e.target.checked })}
                        />{" "}
                        需要室内备选
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="gy-primary-button"
                  style={{ width: "100%", marginTop: 22 }}
                >
                  生成我的毕业影像路线
                </button>
              </form>
            </div>

            <aside className="gy-panel gy-generated-panel">
              {usedFallback && (
                <p className="gy-fallback-note">生成逻辑暂时不可用，已加载缓存企划。</p>
              )}
              <Eyebrow>{plan ? "ROUTE GENERATED" : "DEFAULT PREVIEW"}</Eyebrow>
              <h2>{plan ? `${resultPlan.style}企划路线` : "等待生成路线"}</h2>
              <p className="gy-body-copy">{resultPlan.styleReason}</p>
              <div className="gy-pill-row">
                <Pill active>{input.season}</Pill>
                <Pill>{customSelectedSpots.length} 个点位</Pill>
                <Pill>
                  {input.walkingTolerance === "short"
                    ? "短距离"
                    : input.walkingTolerance === "medium"
                    ? "中等步行"
                    : "完整路线"}
                </Pill>
              </div>
              <IllustratedMap selectedSlug={customSelectedSpots[0]?.slug || "south-gate"} compact />
              <div className="gy-field-grid gy-field-grid-compact">
                {customSelectedSpots.slice(0, 4).map((spot) => (
                  <Field key={spot.id} label={spot.name} value={`${spot.bestTime} · ${spot.actionSuggestion}`} />
                ))}
              </div>
              <section className="gy-plan-mini">
                <div>
                  <h3>造型建议</h3>
                  <p>
                    {resultPlan.colorPalette.join(" / ")}；{resultPlan.outfit.inner}；{resultPlan.outfit.accessory}
                  </p>
                </div>
                <div>
                  <h3>Shot List</h3>
                  <ul>
                    {resultPlan.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              </section>
              <div className="gy-map-detail-actions">
                <Link href={customMapHref} className="gy-primary-button">
                  在地图中查看路线
                </Link>
                <Link href="/route/classic-graduation" className="gy-secondary-button">
                  查看路线详情
                </Link>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
