"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import spotsData from "@/data/spots.json";
import routesData from "@/data/routes.json";
import type { Route } from "@/types/route";
import type { Spot } from "@/types/spot";
import { Eyebrow, Field, Pill, TopNav } from "@/components/guangying-ui";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="gy-map-loading">地图加载中...</div>,
});

const spots = spotsData as Spot[];
const routes = routesData as Route[];

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const routeSlug = searchParams.get("route") || "classic-graduation";
  const spotParam = searchParams.get("spot");
  const generatedSpotIds = searchParams.get("spots");
  const generatedStyle = searchParams.get("style");

  const route = useMemo<Route>(() => {
    const validIds = (generatedSpotIds || "").split(",").filter((id) => spots.some((spot) => spot.id === id));
    if (validIds.length >= 2) {
      return {
        id: "generated-plan",
        slug: "generated-plan",
        name: generatedStyle ? `${generatedStyle}企划路线` : "我的毕业影像路线",
        subtitle: "根据拍摄需求从真实点位库生成",
        duration: `约 ${validIds.length * 35} 分钟`,
        walkingDistance: "Demo估算 · 约 2.6 km",
        recommendedTime: "以企划选择时间为准",
        spots: validIds,
      };
    }
    return routes.find((item) => item.slug === routeSlug) || routes[0];
  }, [generatedSpotIds, generatedStyle, routeSlug]);

  const routeSpots = useMemo(() => route.spots.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean) as Spot[], [route]);
  const initialId = spotParam && routeSpots.some((spot) => spot.id === spotParam) ? spotParam : routeSpots[0]?.id || null;
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(initialId);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const selectedSpot = routeSpots.find((spot) => spot.id === selectedSpotId) || routeSpots[0];
  const selectedIndex = Math.max(0, routeSpots.findIndex((spot) => spot.id === selectedSpot?.id));

  useEffect(() => {
    setSelectedSpotId(initialId);
    setIsPlaying(false);
    setSheetExpanded(false);
  }, [initialId]);

  useEffect(() => {
    if (selectedSpotId) cardRefs.current[selectedSpotId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedSpotId]);

  useEffect(() => {
    if (!isPlaying || !routeSpots.length) return;
    const timer = window.setTimeout(() => {
      const nextIndex = selectedIndex + 1;
      if (nextIndex >= routeSpots.length) {
        setIsPlaying(false);
        return;
      }
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

  function restartRoute() {
    setSelectedSpotId(routeSpots[0]?.id || null);
    setIsPlaying(true);
    setSheetExpanded(true);
  }

  return (
    <main className="gy-page">
      <div className="gy-container gy-map-container">
        <TopNav active="地图" actionLabel="生成路线" actionHref="/planner" />
        <section className="gy-map-page-head">
          <div>
            <Eyebrow muted>CAMPUS IMAGE MAP</Eyebrow>
            <h1 className="gy-page-title">校园影像地图</h1>
            <p className="gy-body-copy">接回学长的 Leaflet 地图模块：真实瓦片、路线折线、点位 marker 和详情联动。</p>
          </div>
          <div className="gy-map-actions">
            <button type="button" onClick={isPlaying ? () => setIsPlaying(false) : playRoute} className="gy-primary-button">
              {isPlaying ? "暂停路线" : "播放路线"}
            </button>
            <button type="button" onClick={restartRoute} className="gy-secondary-button">
              重新开始
            </button>
          </div>
        </section>

        <section className="gy-live-map-layout">
          <div className="gy-live-map-shell">
            <MapView
              spots={spots}
              route={route}
              selectedSpotId={selectedSpot?.id || null}
              sheetExpanded={sheetExpanded}
              onSelect={(id) => {
                setSelectedSpotId(id);
                setSheetExpanded(true);
              }}
            />
          </div>

          {selectedSpot ? (
            <aside className="gy-panel gy-live-map-panel">
              <div className="gy-map-summary-top">
                <img src={selectedSpot.referenceImages[0]} alt={`${selectedSpot.name}参考成片`} />
                <div>
                  <Eyebrow>SELECTED SPOT</Eyebrow>
                  <h2>{selectedSpot.name}</h2>
                  <p>{selectedSpot.area}</p>
                </div>
              </div>
              <p className="gy-body-copy">{selectedSpot.description}</p>
              <div className="gy-field-grid gy-field-grid-compact">
                <Field label="建议时间" value={selectedSpot.bestTime} />
                <Field label="太阳方向" value={selectedSpot.sunDirection} />
                <Field label="推荐焦段" value={selectedSpot.focalLength} />
                <Field label="机位位置" value={selectedSpot.cameraPosition} />
                <Field label="动作建议" value={selectedSpot.actionSuggestion} />
                <Field label="拥挤度" value={selectedSpot.crowdLevel} />
              </div>
              <div className="gy-map-detail-actions">
                <Link href={`/spot/${selectedSpot.slug}`} className="gy-primary-button">
                  查看详情
                </Link>
                <Link href={`/route/${route.slug === "generated-plan" ? "classic-graduation" : route.slug}`} className="gy-secondary-button">
                  路线详情
                </Link>
                <Link href="/photographers" className="gy-secondary-button">
                  查看摄影者
                </Link>
              </div>
              <div className="gy-spot-list">
                {routeSpots.map((spot, index) => (
                  <a
                    key={spot.id}
                    ref={(node) => {
                      cardRefs.current[spot.id] = node;
                    }}
                    href={`#${spot.slug}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setSelectedSpotId(spot.id);
                      setSheetExpanded(true);
                    }}
                    className={spot.id === selectedSpot.id ? "gy-card-link is-active" : "gy-card-link"}
                  >
                    <span style={{ color: "var(--teal)", fontSize: 13 }}>{String(index + 1).padStart(2, "0")} / {routeSpots.length}</span>
                    <h3>{spot.name}</h3>
                    <p>{spot.routeRole} · {spot.bestTime}</p>
                  </a>
                ))}
              </div>
            </aside>
          ) : null}
        </section>
      </div>
    </main>
  );
}
