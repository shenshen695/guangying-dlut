"use client";

import { useEffect, useMemo, useState } from "react";
import type { Spot } from "@/types/spot";
import type { Route } from "@/types/route";
import mapPointsData from "@/data/map-points.json";

type Props = { spots: Spot[]; route: Route; selectedSpotId: string | null; sheetExpanded: boolean; onSelect: (id: string) => void };

const anchors = Object.fromEntries((mapPointsData as Array<{ id: string; x: number; y: number }>).map(({ id, x, y }) => [id, { x, y }])) as Record<string, { x: number; y: number }>;

export default function MapView({ spots, route, selectedSpotId, onSelect }: Props) {
  const [zoom, setZoom] = useState(1);
  const orderedSpots = useMemo(() => route.spots.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean) as Spot[], [route, spots]);
  const selectedAnchor = (selectedSpotId && anchors[selectedSpotId]) || { x: 50, y: 50 };
  const routePoints = orderedSpots.map((spot) => anchors[spot.id]).filter(Boolean).map((point) => `${point.x},${point.y}`).join(" ");

  useEffect(() => { if (selectedSpotId) setZoom((value) => Math.max(value, 1.08)); }, [selectedSpotId]);

  return <div className="qmap-viewport" aria-label="Q版校园摄影地图"><div className="qmap-stage" style={{ transform: `scale(${zoom})`, transformOrigin: `${selectedAnchor.x}% ${selectedAnchor.y}%` }}>
    <img className="qmap-art" src="/images/map/campus-q-map.jpg" alt="手绘Q版大连理工大学凌水校区地图" draggable={false} />
    {route.id !== "campus-highlights" && <svg className="qmap-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={routePoints} /></svg>}
    {orderedSpots.map((spot, index) => { const anchor = anchors[spot.id]; if (!anchor) return null; const selected = selectedSpotId === spot.id; return <button key={spot.id} type="button" className={`qmap-marker ${spot.featured ? "is-featured" : ""} ${selected ? "is-selected" : ""}`} style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }} onClick={() => onSelect(spot.id)} aria-pressed={selected} aria-label={`${spot.featured ? "推荐地标" : `第 ${index + 1} 站`}：${spot.name}`}><span className="qmap-marker-number">{spot.featured ? "★" : String(index + 1).padStart(2, "0")}</span><span className="qmap-marker-label">{spot.shortName}</span></button>; })}
  </div><div className="qmap-controls" aria-label="地图缩放"><button type="button" onClick={() => setZoom((value) => Math.min(1.6, value + 0.16))} aria-label="放大地图">＋</button><button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.16))} aria-label="缩小地图">−</button></div><button type="button" className="qmap-reset" onClick={() => setZoom(1)}>查看全景</button></div>;
}
