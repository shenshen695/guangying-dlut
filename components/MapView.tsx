"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapPoint } from "@/types/map-point";
import pointsData from "@/data/map-points.json";

type Props = {
  /** All points to render on the map */
  points: MapPoint[];
  /** IDs in route order — if provided, draw route line + numbered markers */
  routeSpotIds?: string[];
  /** IDs of the road-graph waypoints forming the actual walking path */
  routeWaypoints?: string[];
  selectedId: string | null;
  /** Highlight these IDs (custom selected spots) */
  customSelectedIds?: string[];
  onSelect: (id: string) => void;
};

// ── coordinate lookup from unified map-points.json ───────────────
const coordMap = Object.fromEntries(
  (pointsData as MapPoint[]).map(({ id, x, y }) => [id, { x, y }])
) as Record<string, { x: number; y: number }>;

// ── Touch helpers ────────────────────────────────────────────────
function touchDist(a: React.Touch, b: React.Touch) {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}
function touchMid(a: React.Touch, b: React.Touch) {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export default function MapView({
  points,
  routeSpotIds,
  routeWaypoints,
  selectedId,
  customSelectedIds = [],
  onSelect,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const viewportRef = useRef<HTMLDivElement>(null);

  // ── Clamp pan ────────────────────────────────────────────────────
  const clampPan = useCallback((x: number, y: number, z: number) => {
    if (!viewportRef.current) return { x, y };
    const vw = viewportRef.current.offsetWidth;
    const vh = viewportRef.current.offsetHeight;
    const stageW = vw * z;
    const stageH = stageW * (2603 / 3227);
    const maxX = Math.max(0, (stageW - vw) / 2);
    const maxY = Math.max(0, (stageH - vh) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  function applyZoom(delta: number) {
    setZoom((z) => {
      const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta));
      setPan((p) => clampPan(p.x, p.y, nz));
      return nz;
    });
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  // ── Touch state ──────────────────────────────────────────────────
  const touchState = useRef<{
    mode: "none" | "pan" | "pinch";
    startPan: { x: number; y: number };
    startOffset: { x: number; y: number };
    startDist: number;
    startZoom: number;
    startMid: { x: number; y: number };
  }>({
    mode: "none",
    startPan: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 },
    startDist: 0,
    startZoom: 1,
    startMid: { x: 0, y: 0 },
  });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        touchState.current = {
          ...touchState.current,
          mode: "pan",
          startPan: { x: e.touches[0].clientX, y: e.touches[0].clientY },
          startOffset: pan,
        };
      } else if (e.touches.length === 2) {
        const d = touchDist(e.touches[0], e.touches[1]);
        const mid = touchMid(e.touches[0], e.touches[1]);
        touchState.current = {
          mode: "pinch",
          startPan: mid,
          startOffset: pan,
          startDist: d,
          startZoom: zoom,
          startMid: mid,
        };
      }
    },
    [pan, zoom]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const ts = touchState.current;
      if (ts.mode === "pan" && e.touches.length === 1) {
        const dx = e.touches[0].clientX - ts.startPan.x;
        const dy = e.touches[0].clientY - ts.startPan.y;
        setPan(clampPan(ts.startOffset.x + dx, ts.startOffset.y + dy, zoom));
      } else if (ts.mode === "pinch" && e.touches.length === 2) {
        const d = touchDist(e.touches[0], e.touches[1]);
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, ts.startZoom * (d / ts.startDist)));
        const mid = touchMid(e.touches[0], e.touches[1]);
        setZoom(nz);
        setPan(clampPan(ts.startOffset.x + mid.x - ts.startMid.x, ts.startOffset.y + mid.y - ts.startMid.y, nz));
      }
    },
    [zoom, clampPan]
  );

  const handleTouchEnd = useCallback(() => {
    touchState.current.mode = "none";
  }, []);

  // ── Mouse wheel zoom ─────────────────────────────────────────────
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => {
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z - e.deltaY * 0.001));
        setPan((p) => clampPan(p.x, p.y, nz));
        return nz;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clampPan]);

  // ── Mouse drag ───────────────────────────────────────────────────
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let dragging = false;
    let startX = 0, startY = 0, startPanX = 0, startPanY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      setPan((p) => { startPanX = p.x; startPanY = p.y; return p; });
      el.style.cursor = "grabbing";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      setPan(clampPan(startPanX + (e.clientX - startX), startPanY + (e.clientY - startY), zoom));
    };
    const onMouseUp = () => { dragging = false; el.style.cursor = "grab"; };

    el.style.cursor = "grab";
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [zoom, clampPan]);

  // ── Route polyline points ────────────────────────────────────────
  const routePolyline = useMemo(() => {
    const ids = routeWaypoints && routeWaypoints.length > 0 ? routeWaypoints : (routeSpotIds ?? []);
    return ids.map((id) => coordMap[id]).filter(Boolean).map((c) => `${c.x},${c.y}`).join(" ");
  }, [routeSpotIds, routeWaypoints]);

  const showRoute = !!(routeSpotIds && routeSpotIds.length > 0);
  const showAllLabels = zoom >= 1.8;

  return (
    <div
      ref={viewportRef}
      className="qmap-viewport"
      aria-label="大工校园机位地图"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="qmap-stage"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        <img
          className="qmap-art"
          src="/images/map/campus-screenshot-mosaic.jpg"
          alt="大连理工大学凌水校区校园地图"
          draggable={false}
        />

        {/* Route polyline — only when a route is active */}
        {showRoute && routePolyline && (
          <svg className="qmap-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={routePolyline} />
          </svg>
        )}

        {/* Markers */}
        {points.map((pt) => {
          const coord = coordMap[pt.id];
          if (!coord) return null;
          const isSelected = selectedId === pt.id;
          const isCustom = customSelectedIds.includes(pt.id);
          const routeIndex = routeSpotIds ? routeSpotIds.indexOf(pt.id) : -1;
          const inRoute = routeIndex >= 0;
          const labelVisible = showAllLabels || isSelected || isCustom || (showRoute && inRoute);

          return (
            <button
              key={pt.id}
              type="button"
              className={[
                "qmap-marker",
                isSelected ? "is-selected" : "",
                isCustom ? "is-custom" : "",
                showRoute && inRoute ? "is-route" : "",
                !labelVisible ? "label-hidden" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              onClick={() => onSelect(pt.id)}
              aria-pressed={isSelected}
              aria-label={pt.name}
            >
              <span className="qmap-marker-dot">
                {showRoute && inRoute
                  ? String(routeIndex + 1)
                  : isCustom
                  ? customSelectedIds.indexOf(pt.id) + 1
                  : ""}
              </span>
              <span className="qmap-marker-label">{pt.name}</span>
            </button>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div className="qmap-controls" aria-label="地图缩放">
        <button type="button" onClick={() => applyZoom(0.5)} aria-label="放大">＋</button>
        <button type="button" onClick={() => applyZoom(-0.5)} aria-label="缩小">−</button>
      </div>
      <button type="button" className="qmap-reset" onClick={resetView}>
        全景
      </button>
    </div>
  );
}
