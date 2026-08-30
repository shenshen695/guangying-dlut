"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import pointsData from "@/data/map-points.json";
import routesData from "@/data/map-routes.json";
import type { MapPoint } from "@/types/map-point";
import type { Route } from "@/types/route";
import WeatherRecommend from "@/components/WeatherRecommend";
import CustomRoutePlanner from "@/components/CustomRoutePlanner";
import { shortestPath, pathToPolyline } from "@/lib/campusGraph";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[390px] place-items-center bg-[#e7ece9] text-sm text-slate-500">
      地图加载中…
    </div>
  ),
});

const ALL_POINTS = pointsData as MapPoint[];
const ROUTES = routesData as unknown as Route[];

const WEATHER_POINT_ALIASES: Record<string, string> = {
  "综合一号楼门厅": "comprehensive-one",
  "大活前廊": "student-center",
  "令希图书馆": "first-building",
};

function pointIdForWeatherName(name: string): string | undefined {
  const alias = WEATHER_POINT_ALIASES[name];
  if (alias) return alias;
  return ALL_POINTS.find((point) => name.includes(point.name) || point.name.includes(name))?.id;
}

type Mode = "explore" | "classic-graduation" | "west-campus" | "custom";

function buildRouteWaypoints(spotIds: string[]): string {
  if (spotIds.length < 2) return "";
  const allPathNodes: string[] = [spotIds[0]];
  for (let i = 0; i < spotIds.length - 1; i++) {
    const { path } = shortestPath(spotIds[i], spotIds[i + 1]);
    allPathNodes.push(...path.slice(1));
  }
  return pathToPolyline(allPathNodes);
}

// ── Season badge ─────────────────────────────────────────────────
function SeasonBadge({ seasons }: { seasons: MapPoint["seasons"] }) {
  if (!seasons?.length) return null;
  const now = new Date().getMonth() + 1;
  const current = seasons.find((s) => s.months.includes(now));
  const highlight = current ?? seasons[0];
  return (
    <div className="spot-season-badge">
      <span className="spot-season-icon">🌿</span>
      <span>{highlight.season}季 · {highlight.highlight}</span>
    </div>
  );
}

// ── Bottom spot card ──────────────────────────────────────────────
function SpotCard({
  point,
  routeIndex,
  totalInRoute,
  onClose,
  onAddToCustom,
  mode,
  isInCustom,
}: {
  point: MapPoint;
  routeIndex?: number;
  totalInRoute?: number;
  onClose: () => void;
  onAddToCustom?: (id: string) => void;
  mode: Mode;
  isInCustom?: boolean;
}) {
  return (
    <div className="spot-card">
      {/* Handle */}
      <div className="spot-card-handle-row">
        <span className="spot-card-handle" />
        <button type="button" onClick={onClose} className="spot-card-close" aria-label="关闭">✕</button>
      </div>

      {/* Header */}
      <div className="spot-card-header">
        {routeIndex !== undefined && totalInRoute !== undefined ? (
          <span className="spot-card-badge">
            {String(routeIndex + 1).padStart(2, "0")} / {String(totalInRoute).padStart(2, "0")}
          </span>
        ) : (
          <span className="spot-card-badge">机位</span>
        )}
        <h2 className="spot-card-name">{point.name}</h2>
        {point.bestTime && (
          <p className="spot-card-meta">最佳时间 · {point.bestTime}</p>
        )}
      </div>

      {/* Image */}
      {point.imageSrc ? (
        <img src={point.imageSrc} alt={point.name} className="spot-card-img" />
      ) : (
        <div className="spot-card-img-placeholder">暂无实景图 · 欢迎投稿</div>
      )}

      {/* Description */}
      <p className="spot-card-desc">{point.description}</p>

      {/* Season highlights */}
      <SeasonBadge seasons={point.seasons} />

      {/* Actions */}
      <div className="spot-card-actions">
        {point.navigationUrl && (
          <a
            href={point.navigationUrl}
            target="_blank"
            rel="noreferrer"
            className="spot-card-btn spot-card-btn-primary"
          >
            打开导航 ↗
          </a>
        )}
        {mode === "custom" && onAddToCustom && (
          <button
            type="button"
            className={`spot-card-btn ${isInCustom ? "spot-card-btn-outline-active" : "spot-card-btn-outline"}`}
            onClick={() => onAddToCustom(point.id)}
          >
            {isInCustom ? "✓ 已加入路线" : "＋ 加入路线"}
          </button>
        )}
        {mode !== "custom" && (
          <Link
            href={`/map/spot/${point.id}`}
            className="spot-card-btn spot-card-btn-outline"
          >
            查看详情
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Route info strip ──────────────────────────────────────────────
function RouteInfoStrip({ route }: { route: Route }) {
  return (
    <div className="route-strip">
      <p className="route-strip-name">{route.name}</p>
      <div className="route-strip-meta">
        <span>◷ {route.duration}</span>
        <span>⌁ {route.walkingDistance}</span>
        <span>◎ {route.spots.length} 站</span>
      </div>
      <p className="route-strip-subtitle">{route.subtitle}</p>
    </div>
  );
}

// ── Route stop list (desktop sidebar) ───────────────────────────
function RouteStopList({
  route,
  points,
  selectedId,
  onSelect,
}: {
  route: Route;
  points: MapPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const pointMap = useMemo(
    () => Object.fromEntries(points.map((p) => [p.id, p])),
    [points]
  );
  return (
    <ol className="route-stop-list">
      {route.spots.map((id, idx) => {
        const pt = pointMap[id];
        if (!pt) return null;
        const isSelected = selectedId === id;
        const intro = route.stopIntros?.[id];
        return (
          <li key={id}>
            <button
              type="button"
              className={`route-stop-item ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelect(id)}
            >
              <span className="route-stop-num">{String(idx + 1).padStart(2, "0")}</span>
              <div className="route-stop-body">
                <span className="route-stop-name">{pt.name}</span>
                {intro && <span className="route-stop-intro">{intro}</span>}
              </div>
              {pt.imageSrc && (
                <img src={pt.imageSrc} alt={pt.name} className="route-stop-thumb" />
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function MapPageClient() {
  const searchParams = useSearchParams();
  const initialCustomIds = searchParams
    .get("spots")
    ?.split(",")
    .filter((id) => ALL_POINTS.some((point) => point.id === id))
    .slice(0, 8) ?? [];
  const initMode = (searchParams.get("route") === "west-campus"
    ? "west-campus"
    : searchParams.get("route") === "custom"
    ? "custom"
    : "explore") as Mode;

  const [mode, setMode] = useState<Mode>(initMode);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // custom route state lifted from planner
  const [customIds, setCustomIds] = useState<string[]>(initialCustomIds);
  const [customWaypoints, setCustomWaypoints] = useState<string>(() => buildRouteWaypoints(initialCustomIds));

  const activeRoute = useMemo(() => {
    if (mode === "classic-graduation") return ROUTES.find((r) => r.id === "classic-graduation") ?? null;
    if (mode === "west-campus") return ROUTES.find((r) => r.id === "west-campus") ?? null;
    return null;
  }, [mode]);

  const routeWaypoints = useMemo(() => {
    if (!activeRoute) return "";
    return buildRouteWaypoints(activeRoute.spots);
  }, [activeRoute]);

  const selectedPoint = useMemo(
    () => ALL_POINTS.find((p) => p.id === selectedId) ?? null,
    [selectedId]
  );

  const routeSpotIndex = useMemo(() => {
    if (!activeRoute || !selectedId) return undefined;
    const idx = activeRoute.spots.indexOf(selectedId);
    return idx >= 0 ? idx : undefined;
  }, [activeRoute, selectedId]);

  function handleSelect(id: string) {
    if (mode === "custom") {
      // In custom mode, tapping a spot in the map adds/removes from custom list
      // but also shows the card
      setSelectedId(id);
      setSheetOpen(true);
    } else {
      setSelectedId(id);
      setSheetOpen(true);
    }
  }

  function handleCustomRouteChange(ids: string[], waypoints: string) {
    setCustomIds(ids);
    setCustomWaypoints(waypoints);
  }

  function handleAddToCustom(id: string) {
    setCustomIds((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 8) return prev;
      const next = [...prev, id];
      setCustomWaypoints(buildRouteWaypoints(next));
      return next;
    });
  }

  const modeTabClass = (m: Mode) =>
    `map-mode-tab ${mode === m ? "is-active" : ""}`;

  // ── Sidebar content (desktop) ─────────────────────────────────
  function SidebarContent() {
    if (mode === "custom") {
      return (
        <div className="map-sidebar-scroll">
          <p className="map-sidebar-eyebrow">定制路线</p>
          <h2 className="map-sidebar-title">规划你的机位路线</h2>
          <p className="map-sidebar-desc">选择 2～8 个机位，自动计算最优步行顺序和距离。</p>
          <div className="map-sidebar-divider" />
          <CustomRoutePlanner
            allPoints={ALL_POINTS}
            onRouteChange={handleCustomRouteChange}
            initialSelectedIds={customIds}
          />
        </div>
      );
    }
    if (activeRoute) {
      return (
        <div className="map-sidebar-scroll">
          <p className="map-sidebar-eyebrow">路线</p>
          <h2 className="map-sidebar-title">{activeRoute.name}</h2>
          <p className="map-sidebar-desc">{activeRoute.subtitle}</p>
          <div className="map-sidebar-meta">
            <span>◷ {activeRoute.duration}</span>
            <span>⌁ {activeRoute.walkingDistance}</span>
            <span>◎ {activeRoute.spots.length} 站</span>
          </div>
          <div className="map-sidebar-divider" />
          <RouteStopList
            route={activeRoute}
            points={ALL_POINTS}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); }}
          />
        </div>
      );
    }
    // explore mode
    return (
      <div className="map-sidebar-scroll">
        <p className="map-sidebar-eyebrow">探索机位</p>
        <h2 className="map-sidebar-title">校内机位共享平台</h2>
        <p className="map-sidebar-desc">点击地图上的图标了解各机位介绍、季节亮点和实景图片。</p>
        <div className="map-sidebar-divider" />
        <WeatherRecommend
          onAddSpot={(name) => {
            const id = pointIdForWeatherName(name);
            if (!id) return;
            setSelectedId(id);
            setSheetOpen(true);
          }}
        />
      </div>
    );
  }

  return (
    <main className="map-page">
      <div className="map-page-layout">
        {/* ── Map section ────────────────────────────────────────── */}
        <section className={`map-shell ${sheetOpen ? "sheet-open" : ""}`}>
          {/* Top bar */}
          <div className="map-topbar">
            <Link href="/" className="map-brand">光影大工</Link>
            <span className="map-brand-sep" />
            <span className="map-brand-subtitle">
              {mode === "classic-graduation"
                ? "经典毕业路线"
                : mode === "west-campus"
                ? "西部校园路线"
                : mode === "custom"
                ? "定制路线"
                : "校内机位地图"}
            </span>
          </div>

          {/* Mode tabs */}
          <nav className="map-mode-tabs" aria-label="地图模式">
            <button type="button" className={modeTabClass("explore")} onClick={() => { setMode("explore"); setSelectedId(null); setSheetOpen(false); }}>
              探索
            </button>
            <button type="button" className={modeTabClass("classic-graduation")} onClick={() => { setMode("classic-graduation"); setSelectedId(null); setSheetOpen(false); }}>
              经典路线
            </button>
            <button type="button" className={modeTabClass("west-campus")} onClick={() => { setMode("west-campus"); setSelectedId(null); setSheetOpen(false); }}>
              西部路线
            </button>
            <button type="button" className={modeTabClass("custom")} onClick={() => { setMode("custom"); setSelectedId(null); setSheetOpen(false); }}>
              定制路线
            </button>
          </nav>

          {/* Map canvas */}
          <MapView
            points={ALL_POINTS}
            routeSpotIds={
              mode === "classic-graduation"
                ? ROUTES.find((r) => r.id === "classic-graduation")?.spots
                : mode === "west-campus"
                ? ROUTES.find((r) => r.id === "west-campus")?.spots
                : mode === "custom" && customIds.length >= 2
                ? customIds
                : undefined
            }
            routeWaypoints={
              mode === "custom" && customIds.length >= 2
                ? customWaypoints.split(" ")
                : mode !== "explore"
                ? routeWaypoints.split(" ").filter(Boolean)
                : undefined
            }
            selectedId={selectedId}
            customSelectedIds={mode === "custom" ? customIds : []}
            onSelect={handleSelect}
          />

          {/* Route info strip (mobile, shown when route selected) */}
          {activeRoute && (
            <div className="map-route-strip-mobile">
              <RouteInfoStrip route={activeRoute} />
            </div>
          )}

          {/* ── Mobile bottom sheet ─────────────────────────── */}
          {selectedPoint && sheetOpen && (
            <div className={`map-bottom-sheet ${sheetOpen ? "is-open" : ""}`}>
              <SpotCard
                point={selectedPoint}
                routeIndex={routeSpotIndex}
                totalInRoute={activeRoute?.spots.length}
                onClose={() => setSheetOpen(false)}
                onAddToCustom={mode === "custom" ? handleAddToCustom : undefined}
                mode={mode}
                isInCustom={customIds.includes(selectedPoint.id)}
              />
            </div>
          )}

          {/* Desktop hint */}
          <div className="map-desktop-hint">
            <p>
              {mode === "explore"
                ? "点击图标查看机位介绍 · 放大显示更多名称"
                : mode === "custom"
                ? "点击图标加入路线 · 或在右侧面板选择机位"
                : "路线为摄影顺序示意 · 步行请使用手机导航"}
            </p>
          </div>
        </section>

        {/* ── Desktop sidebar ──────────────────────────────────────── */}
        <aside className="map-sidebar">
          <SidebarContent />

          {/* Spot detail panel (desktop) */}
          {selectedPoint && (
            <div className="map-sidebar-spot">
              <SpotCard
                point={selectedPoint}
                routeIndex={routeSpotIndex}
                totalInRoute={activeRoute?.spots.length}
                onClose={() => setSelectedId(null)}
                onAddToCustom={mode === "custom" ? handleAddToCustom : undefined}
                mode={mode}
                isInCustom={customIds.includes(selectedPoint.id)}
              />
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
