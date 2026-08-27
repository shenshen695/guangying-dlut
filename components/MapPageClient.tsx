"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import spotsData from "@/data/map-spots.json";
import routesData from "@/data/map-routes.json";
import type { MapSpot as Spot } from "@/types/map-spot";
import type { Route } from "@/types/route";
import SpotCard from "@/components/MapSpotCard";
import { TopNav } from "@/components/guangying-ui";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="gy-map-loading">地图加载中...</div>,
});
const spots = spotsData as Spot[];
const routes = routesData as Route[];

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const routeSlug = searchParams.get("route") || "campus-highlights";
  const spotParam = searchParams.get("spot");
  const generatedSpotIds = searchParams.get("spots");
  const generatedStyle = searchParams.get("style");
  const route = useMemo<Route>(() => {
    const validIds = (generatedSpotIds || "").split(",").filter((id) => spots.some((spot) => spot.id === id));
    if (validIds.length >= 2) return {
      id: "generated-plan",
      slug: "generated-plan",
      name: generatedStyle ? `${generatedStyle}企划路线` : "我的毕业影像路线",
      subtitle: "根据人数、时间、风格和步行接受度生成",
      duration: `约 ${validIds.length * 25} 分钟`,
      walkingDistance: "演示估算",
      recommendedTime: "以企划选择时间为准",
      spots: validIds,
    };
    return routes.find((item) => item.slug === routeSlug) || routes[0];
  }, [generatedSpotIds, generatedStyle, routeSlug]);
  const isGeneratedRoute = route.id === "generated-plan";
  const isExploreMode = route.id === "campus-highlights";
  const routeSpots = useMemo(() => route.spots.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean) as Spot[], [route]);
  const initialId = spotParam && routeSpots.some((spot) => spot.id === spotParam) ? spotParam : routeSpots[0]?.id || null;
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(initialId);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const selectedSpot = routeSpots.find((spot) => spot.id === selectedSpotId) || routeSpots[0];
  const selectedIndex = Math.max(0, routeSpots.findIndex((spot) => spot.id === selectedSpotId));

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

  const controls = (
    <div className="gy-map-control-buttons">
      <button type="button" onClick={isPlaying ? () => setIsPlaying(false) : playRoute} className="is-primary">
        {isPlaying ? "暂停" : isExploreMode ? "依次认识" : "播放路线"}
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
            <p className="gy-eyebrow">{isGeneratedRoute ? "PLAN / 企划路线" : isExploreMode ? "MAP / 特色地标" : "ROUTE / 经典毕业线"}</p>
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
              <nav className="gy-map-mode-tabs" aria-label="地图模式">
                <Link href="/map?route=campus-highlights" className={isExploreMode ? "is-active" : ""}>地标探索</Link>
                <Link href="/map?route=classic-graduation" className={!isExploreMode ? "is-active" : ""}>经典路线</Link>
              </nav>
              <Link href="/map-editor" className="gy-map-editor-link">编辑点位</Link>
            </div>

            <MapView spots={spots} route={route} selectedSpotId={selectedSpotId} sheetExpanded={sheetExpanded} onSelect={(id) => { setSelectedSpotId(id); setSheetExpanded(true); }} />

            <div className="gy-map-note">
              <p>{isExploreMode ? "校园地标" : "路线顺序"}</p>
              <span>{isExploreMode ? "点击点位查看样片与拍摄提示。" : "虚线路线为摄影顺序示意，具体步行请打开导航。"}</span>
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
                      {selectedSpot.navigationUrl && <a href={selectedSpot.navigationUrl} target="_blank" rel="noreferrer">打开导航 ↗</a>}
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
              {controls}
            </div>
            <div className="gy-map-side-list">
              {routeSpots.map((spot, index) => (
                <div key={spot.id} ref={(node) => { cardRefs.current[spot.id] = node; }}>
                  <SpotCard spot={spot} index={index} selected={selectedSpotId === spot.id} onSelect={() => { setSelectedSpotId(spot.id); setSheetExpanded(true); }} />
                  {spot.navigationUrl && <a href={spot.navigationUrl} target="_blank" rel="noreferrer" className="gy-map-nav-link">打开地图导航到这里 ↗</a>}
                </div>
              ))}
            </div>
            <p className="gy-map-side-footnote">完整校园图用于发现点位与展示摄影顺序；精确步行请以地图导航应用为准。</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
