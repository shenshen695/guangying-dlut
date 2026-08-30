"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WheelEvent } from "react";
import type { MapSpot as Spot } from "@/types/map-spot";
import type { Route } from "@/types/route";
import mapPointsData from "@/data/map-points.json";

type Props = { spots: Spot[]; route: Route; selectedSpotId: string | null; sheetExpanded: boolean; onSelect: (id: string) => void };

const anchors = Object.fromEntries((mapPointsData as Array<{ id: string; x: number; y: number; name: string }>).map(({ id, x, y, name }) => [id, { x, y, name }])) as Record<string, { x: number; y: number; name: string }>;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const clampZoom = (value: number) => clamp(Number(value.toFixed(2)), 1, 1.8);
const campusBounds = {
  minLatitude: 38.875,
  maxLatitude: 38.884,
  minLongitude: 121.518,
  maxLongitude: 121.537,
};

function getSpotAnchor(spot: Spot, index: number) {
  const fixedAnchor = anchors[spot.id];
  if (fixedAnchor) return fixedAnchor;

  const latitude = Number(spot.latitude);
  const longitude = Number(spot.longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude) && !spot.coordinatesPending) {
    const x = clamp(((longitude - campusBounds.minLongitude) / (campusBounds.maxLongitude - campusBounds.minLongitude)) * 100, 7, 93);
    const y = clamp((1 - ((latitude - campusBounds.minLatitude) / (campusBounds.maxLatitude - campusBounds.minLatitude))) * 100, 7, 93);
    return { x, y, name: spot.name };
  }

  return {
    x: clamp(70 + (index % 4) * 5, 70, 91),
    y: clamp(72 + Math.floor(index / 4) * 5, 72, 91),
    name: spot.name,
  };
}

export default function MapView({ spots, route, selectedSpotId, onSelect }: Props) {
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const showMarkerLabel = zoom >= 1.25;
  const orderedSpots = useMemo(() => route.spots.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean) as Spot[], [route, spots]);
  const routePoints = orderedSpots.map((spot, index) => getSpotAnchor(spot, index)).map((point) => `${point.x},${point.y}`).join(" ");
  const changeZoom = useCallback((delta: number) => {
    setZoom((value) => clampZoom(value + delta));
  }, []);

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const stage = stageRef.current;
    if (stage) {
      const rect = stage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setOrigin({
          x: clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96),
          y: clamp(((event.clientY - rect.top) / rect.height) * 100, 4, 96),
        });
      }
    }

    changeZoom(event.deltaY < 0 ? 0.12 : -0.12);
  }, [changeZoom]);

  useEffect(() => {
    if (!selectedSpotId) return;
    const selectedSpot = orderedSpots.find((spot) => spot.id === selectedSpotId);
    if (!selectedSpot) return;
    const anchor = getSpotAnchor(selectedSpot, orderedSpots.indexOf(selectedSpot));
    setOrigin({ x: anchor.x, y: anchor.y });
    setZoom((value) => Math.max(value, 1.08));
  }, [orderedSpots, selectedSpotId]);

  return (
    <div className={showMarkerLabel ? "qmap-viewport is-zoomed" : "qmap-viewport"} aria-label="完整校园摄影地图" onWheel={handleWheel}>
      <div
        ref={stageRef}
        className={showMarkerLabel ? "qmap-stage is-zoomed" : "qmap-stage"}
        style={{ transform: `scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%` }}
      >
        <img className="qmap-art" src="/images/map/campus-screenshot-mosaic.jpg" alt="大工凌水校区完整校园图" draggable={false} />
        {route.id !== "campus-highlights" && <svg className="qmap-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={routePoints} /></svg>}
        {orderedSpots.map((spot, index) => {
          const anchor = getSpotAnchor(spot, index);
          const selected = selectedSpotId === spot.id;
          const markerText = showMarkerLabel && !spot.featured ? String(index + 1).padStart(2, "0") : "★";
          return (
            <button key={spot.id} type="button" className={`qmap-marker ${spot.featured ? "is-featured" : ""} ${selected ? "is-selected" : ""} ${showMarkerLabel ? "is-zoomed" : "is-compact"}`} style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }} onClick={() => onSelect(spot.id)} aria-pressed={selected} aria-label={`${spot.featured ? "推荐地标" : `第 ${index + 1} 站`}：${anchor.name}`}>
              <span className="qmap-marker-number">{markerText}</span>
              {showMarkerLabel && <span className="qmap-marker-label">{anchor.name}</span>}
            </button>
          );
        })}
      </div>
      <div className="qmap-controls" aria-label="地图缩放">
        <button type="button" onClick={() => changeZoom(0.16)} aria-label="放大地图">＋</button>
        <button type="button" onClick={() => changeZoom(-0.16)} aria-label="缩小地图">−</button>
      </div>
      <button type="button" className="qmap-reset" onClick={() => { setZoom(1); setOrigin({ x: 50, y: 50 }); }}>查看全景</button>
    </div>
  );
}
