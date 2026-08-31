"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import spotsData from "@/data/map-spots.json";
import routesData from "@/data/map-routes.json";
import mapPointsData from "@/data/map-points.json";
import type { MapSpot as Spot } from "@/types/map-spot";
import type { MapPoint } from "@/types/map-point";
import type { Route } from "@/types/route";
import SpotCard from "@/components/MapSpotCard";
import CustomRoutePlanner from "@/components/CustomRoutePlanner";
import { TopNav } from "@/components/guangying-ui";
import { getSpotNavigationUrl } from "@/lib/navigation";
import { listApprovedMapSpots } from "@/lib/supabase/backend";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="gy-map-loading">地图加载中...</div>,
});
const spots = spotsData as Spot[];
const routes = routesData as Route[];
const mapPoints = mapPointsData as MapPoint[];
const routeMenuItems = [
  { label: "经典路线", slug: "classic-graduation", aliases: [] },
  { label: "西部路线", slug: "west-route", aliases: [] },
  { label: "建筑路线", slug: "architecture-route", aliases: ["campus-architecture"] },
  { label: "日落路线", slug: "sunset-route", aliases: ["lingshui-sunset", "campus-couple-walk"] },
];

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const routeSlug = searchParams.get("route") || "campus-highlights";
  const spotParam = searchParams.get("spot");
  const generatedSpotIds = searchParams.get("spots");
  const generatedStyle = searchParams.get("style");
  const [customRouteIds, setCustomRouteIds] = useState<string[]>([]);
  const [customRoutePolyline, setCustomRoutePolyline] = useState("");
  const [approvedSpots, setApprovedSpots] = useState<Spot[]>([]);
  const [approvedSpotMessage, setApprovedSpotMessage] = useState("");
  const allSpots = useMemo(() => {
    const seen = new Set(spots.map((spot) => spot.id));
    return [...spots, ...approvedSpots.filter((spot) => {
      if (seen.has(spot.id)) return false;
      seen.add(spot.id);
      return true;
    })];
  }, [approvedSpots]);
  const isCustomMode = routeSlug === "custom";
  const customPlannerPoints = useMemo(() => {
    const validIds = new Set(allSpots.map((spot) => spot.id));
    return mapPoints.filter((point) => validIds.has(point.id));
  }, [allSpots]);
  const route = useMemo<Route>(() => {
    const validIds = (generatedSpotIds || "").split(",").filter((id) => allSpots.some((spot) => spot.id === id));
    if (validIds.length >= 2) return {
      id: "generated-plan",
      slug: "generated-plan",
      name: generatedStyle ? `${generatedStyle}企划路线` : "我的毕业影像路线",
      subtitle: "根据人数、时间、风格和步行接受度生成",
      duration: `约 ${validIds.length * 25} 分钟`,
      walkingDistance: "按点位顺序估算",
      recommendedTime: "以企划选择时间为准",
      spots: validIds,
    };
    if (isCustomMode) return {
      id: "custom-route",
      slug: "custom-route",
      name: "定制拍摄路线",
      subtitle: customRouteIds.length >= 2 ? "选择机位后，系统按校园道路网络估算顺序和距离。" : "选择 2 到 8 个机位，生成一条自己的校园拍摄路线。",
      duration: customRouteIds.length >= 2 ? `约 ${Math.max(35, customRouteIds.length * 18)} 分钟` : "待生成",
      walkingDistance: customRouteIds.length >= 2 ? "按道路网络估算" : "待生成",
      recommendedTime: "按天气与拍摄需求调整",
      spots: customRouteIds,
    };
    const baseRoute = routes.find((item) => item.slug === routeSlug) || routes[0];
    if (baseRoute.id !== "campus-highlights" || approvedSpots.length === 0) return baseRoute;
    return {
      ...baseRoute,
      subtitle: `${baseRoute.subtitle}，并展示管理员审核通过的共建点位`,
      spots: [...baseRoute.spots, ...approvedSpots.map((spot) => spot.id)],
    };
  }, [allSpots, approvedSpots, customRouteIds, generatedSpotIds, generatedStyle, isCustomMode, routeSlug]);
  const isGeneratedRoute = route.id === "generated-plan";
  const isExploreMode = route.id === "campus-highlights";
  const routeModeLabel = isGeneratedRoute ? "PLAN / 企划路线" : isCustomMode ? "CUSTOM / 定制路线" : isExploreMode ? "MAP / 特色地标" : "ROUTE / 经典毕业线";
  const activeRouteItem = routeMenuItems.find((item) => item.slug === routeSlug || item.aliases.includes(routeSlug));
  const routeButtonLabel = isGeneratedRoute || isCustomMode ? "定制路线" : activeRouteItem?.label || "路线";
  const routeSpots = useMemo(() => route.spots.map((id) => allSpots.find((spot) => spot.id === id)).filter(Boolean) as Spot[], [allSpots, route]);
  const initialId = spotParam && allSpots.some((spot) => spot.id === spotParam) ? spotParam : routeSpots[0]?.id || null;
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(initialId);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [routeMenuOpen, setRouteMenuOpen] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const selectedSpot = allSpots.find((spot) => spot.id === selectedSpotId) || routeSpots[0];
  const selectedIndex = Math.max(0, routeSpots.findIndex((spot) => spot.id === selectedSpotId));
  const selectedNavigationUrl = selectedSpot ? getSpotNavigationUrl(selectedSpot) : "";

  useEffect(() => {
    listApprovedMapSpots().then((result) => {
      setApprovedSpots(result.spots);
      setApprovedSpotMessage(result.message || "");
    });
  }, []);
  useEffect(() => { setSelectedSpotId(initialId); setIsPlaying(false); setSheetExpanded(false); }, [initialId]);
  useEffect(() => { if (selectedSpotId) cardRefs.current[selectedSpotId]?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [selectedSpotId]);
  useEffect(() => {
    if (!isPlaying || !routeSpots.length) return;
    const timer = window.setTimeout(() => {
      const nextIndex = selectedIndex + 1;
      if (nextIndex >= routeSpots.length) { setIsPlaying(false); return; }
      setSelectedSpotId(routeSpots[nextIndex].id);
      setSheetExpanded(true);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [isPlaying, routeSpots, selectedIndex]);

  function playRoute() {
    if (selectedIndex >= routeSpots.length - 1) setSelectedSpotId(routeSpots[0]?.id || null);
    setIsPlaying(true);
    setSheetExpanded(true);
  }
  function restartRoute() { setSelectedSpotId(routeSpots[0]?.id || null); setIsPlaying(true); setSheetExpanded(true); }
  function updateCustomRoute(ids: string[], waypointPolyline: string) {
    setCustomRouteIds(ids);
    setCustomRoutePolyline(waypointPolyline);
    if (ids[0]) {
      setSelectedSpotId(ids[0]);
      setSheetExpanded(true);
    }
  }

  const controls = (
    <div className="gy-map-control-buttons">
      <button type="button" onClick={isPlaying ? () => setIsPlaying(false) : playRoute} className="is-primary">
        {isPlaying ? "暂停" : isExploreMode ? "依次认识" : isCustomMode ? "预览顺序" : "播放路线"}
      </button>
      <button type="button" onClick={restartRoute}>
        重新开始
      </button>
    </div>
  );

  return (
    <main className="gy-page">
      <div className="gy-container gy-live-campus-container">
        <TopNav active="地图" actionLabel="生成路线" actionHref="/planner" />

        <section className="gy-live-campus-head">
          <div>
            <p className="gy-eyebrow">{routeModeLabel}</p>
            <h1 className="gy-page-title">{route.name}</h1>
            <span className="gy-coral-rule" aria-hidden />
            <p className="gy-body-copy">{route.subtitle}</p>
          </div>
          <div className="gy-live-campus-meta" aria-label="路线概览">
            <span>◷ {route.duration}</span>
            <span>⌁ {route.walkingDistance}</span>
            <span>◎ {routeSpots.length} 个摄影点</span>
          </div>
        </section>

        <section className="gy-live-campus-workspace">
          <div className={`gy-live-map-shell map-shell ${sheetExpanded ? "is-sheet-expanded" : "is-sheet-collapsed"}`}>
            <div className="gy-map-toolbar">
              <div className="gy-map-route-menu">
                <button type="button" onClick={() => setRouteMenuOpen((open) => !open)} aria-expanded={routeMenuOpen}>
                  <span className="gy-map-route-icon" aria-hidden>⌁</span>
                  {routeButtonLabel}
                  <span className={routeMenuOpen ? "is-open" : ""} aria-hidden>⌃</span>
                </button>
                {routeMenuOpen ? (
                  <div className="gy-map-route-popover">
                    {routeMenuItems.map((item) => {
                      const active = item.slug === routeSlug || item.aliases.includes(routeSlug);
                      return (
                        <Link key={item.slug} href={`/map?route=${item.slug}`} className={active ? "is-active" : ""}>
                          {item.label}
                        </Link>
                      );
                    })}
                    {isGeneratedRoute ? (
                      <Link href={`/map?${searchParams.toString()}`} className="is-active">定制路线</Link>
                    ) : (
                      <Link href="/planner">＋ 定制路线</Link>
                    )}
                    <Link href="/map?route=campus-highlights" className="is-muted">清除路线</Link>
                  </div>
                ) : null}
              </div>
              <Link href="/map-editor" className="gy-map-editor-link">编辑点位</Link>
            </div>

            <MapView
              spots={allSpots}
              route={route}
              selectedSpotId={selectedSpotId}
              sheetExpanded={sheetExpanded}
              onSelect={(id) => { setSelectedSpotId(id); setSheetExpanded(true); }}
              markerSpots={isCustomMode ? allSpots : undefined}
              routeSpotIds={isCustomMode ? customRouteIds : undefined}
              routePolyline={isCustomMode ? customRoutePolyline : undefined}
            />

            <div className="gy-map-note">
              <p>{isExploreMode ? "校园地标" : "路线顺序"}</p>
              <span>{approvedSpotMessage || (isCustomMode ? "在右侧选择机位，地图会预览定制路线。" : isExploreMode ? "点击点位查看样片与拍摄提示。" : "虚线路线为摄影顺序示意，具体步行请打开导航。")}</span>
            </div>

            {selectedSpot && (
              <div className={`spot-sheet gy-mobile-spot-sheet ${sheetExpanded ? "is-expanded" : ""}`}>
                <button type="button" className="gy-mobile-sheet-handle" onClick={() => setSheetExpanded((value) => !value)} aria-label={sheetExpanded ? "收起点位信息" : "展开点位信息"}><span /></button>
                <div className="gy-mobile-spot-head">
                  <div>
                    <p>{selectedSpot.featured ? "★ 推荐地标" : `${String(selectedIndex + 1).padStart(2, "0")} / ${routeSpots.length}`}</p>
                    <h2>{selectedSpot.name}</h2>
                    <span>最佳时间 {selectedSpot.bestTime}</span>
                  </div>
                  <button type="button" onClick={() => setSheetExpanded((value) => !value)}>{sheetExpanded ? "收起" : "展开"}</button>
                </div>
                {sheetExpanded && (
                  <div className="gy-mobile-spot-body">
                    {selectedSpot.images?.[0] && <img src={selectedSpot.images[0].src} alt={selectedSpot.images[0].alt} />}
                    <p>{selectedSpot.description}</p>
                    {selectedSpot.seasonNote && <strong>推荐：{selectedSpot.seasonNote}</strong>}
                    <p><b>拍摄建议：</b>{selectedSpot.shootingTips}</p>
                    <div>
                      <a href={selectedNavigationUrl} target="_blank" rel="noreferrer">打开地图导航到这里 ↗</a>
                      <Link href={`/map/spot/${selectedSpot.slug}`}>完整摄影攻略</Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="gy-panel gy-map-side-panel">
            <div className="gy-map-side-head">
              <div>
                <p className="gy-eyebrow muted">{isExploreMode ? "LANDMARKS" : "SEQUENCE"}</p>
                <h2>{isExploreMode ? "点位知识摘要" : "路线点位顺序"}</h2>
              </div>
              {routeSpots.length > 0 ? controls : null}
            </div>
            {isCustomMode ? (
              <div className="gy-custom-route-box">
                <CustomRoutePlanner allPoints={customPlannerPoints} onRouteChange={updateCustomRoute} initialSelectedIds={customRouteIds} />
              </div>
            ) : null}
            <div className="gy-map-side-list">
              {routeSpots.map((spot, index) => {
                const navigationUrl = getSpotNavigationUrl(spot);
                return (
                  <div key={spot.id} ref={(node) => { cardRefs.current[spot.id] = node; }}>
                    <SpotCard spot={spot} index={index} selected={selectedSpotId === spot.id} onSelect={() => { setSelectedSpotId(spot.id); setSheetExpanded(true); }} />
                    <a href={navigationUrl} target="_blank" rel="noreferrer" className="gy-map-nav-link">打开地图导航到这里 ↗</a>
                  </div>
                );
              })}
              {routeSpots.length === 0 ? (
                <div className="gy-map-empty-route">
                  <strong>还没有选择机位</strong>
                  <span>从上面的定制路线面板中选 2 个以上点位，路线会立即显示在地图上。</span>
                </div>
              ) : null}
            </div>
            <p className="gy-map-side-footnote">完整校园图用于发现点位与展示摄影顺序；精确步行请以地图导航应用为准。</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
