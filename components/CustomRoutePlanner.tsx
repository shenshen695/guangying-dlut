"use client";

import { useCallback, useMemo, useState } from "react";
import type { MapPoint } from "@/types/map-point";
import { nearestNeighborRoute, routeStats, pathToPolyline, shortestPath, GRAPH_NODES } from "@/lib/campusGraph";

type Props = {
  allPoints: MapPoint[];
  onRouteChange: (ids: string[], waypointPolyline: string) => void;
  initialSelectedIds?: string[];
};

function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function buildFullWaypoints(orderedIds: string[]): string {
  if (orderedIds.length < 2) return "";
  const allPathNodes: string[] = [orderedIds[0]];
  for (let i = 0; i < orderedIds.length - 1; i++) {
    const { path } = shortestPath(orderedIds[i], orderedIds[i + 1]);
    // skip first node (already added), append rest
    allPathNodes.push(...path.slice(1));
  }
  return pathToPolyline(allPathNodes);
}

export default function CustomRoutePlanner({ allPoints, onRouteChange, initialSelectedIds = [] }: Props) {
  const [selected, setSelected] = useState<string[]>(() => initialSelectedIds.slice(0, 8));
  const [startId, setStartId] = useState<string>("");
  const [endId, setEndId] = useState<string>("");
  const [planned, setPlanned] = useState<string[]>([]);
  const [showPlan, setShowPlan] = useState(false);

  const MAX_SPOTS = 8;
  const MIN_SPOTS = 2;

  // Toggle spot selection
  const toggleSpot = useCallback(
    (id: string) => {
      setSelected((prev) => {
        let next: string[];
        if (prev.includes(id)) {
          next = prev.filter((s) => s !== id);
        } else if (prev.length >= MAX_SPOTS) {
          return prev; // limit reached
        } else {
          next = [...prev, id];
        }
        setShowPlan(false);
        const waypoints = buildFullWaypoints(next);
        onRouteChange(next, waypoints);
        return next;
      });
    },
    [onRouteChange]
  );

  // Move item in list
  function moveItem(idx: number, dir: -1 | 1) {
    const next = [...selected];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setSelected(next);
    setShowPlan(false);
    onRouteChange(next, buildFullWaypoints(next));
  }

  // Remove item
  function removeItem(id: string) {
    const next = selected.filter((s) => s !== id);
    setSelected(next);
    setShowPlan(false);
    onRouteChange(next, buildFullWaypoints(next));
  }

  // Auto plan
  function autoPlan() {
    if (selected.length < MIN_SPOTS) return;
    const ordered = nearestNeighborRoute(
      selected,
      startId || undefined,
      endId || undefined
    );
    setPlanned(ordered);
    setSelected(ordered);
    setShowPlan(true);
    onRouteChange(ordered, buildFullWaypoints(ordered));
  }

  const stats = useMemo(() => {
    if (!showPlan || planned.length < 2) return null;
    return routeStats(planned);
  }, [planned, showPlan]);

  const nameOf = (id: string) => allPoints.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="custom-planner">
      {/* ── Spot picker ──────────────────────────────────────────── */}
      <div className="custom-planner-section">
        <p className="custom-planner-label">
          选择机位
          <span className="custom-planner-count">
            {selected.length}/{MAX_SPOTS}
          </span>
        </p>
        <div className="custom-spot-grid">
          {allPoints.map((pt) => {
            const inList = selected.includes(pt.id);
            return (
              <button
                key={pt.id}
                type="button"
                className={`custom-spot-chip ${inList ? "is-selected" : ""}`}
                onClick={() => toggleSpot(pt.id)}
                disabled={!inList && selected.length >= MAX_SPOTS}
                aria-pressed={inList}
              >
                {pt.name}
              </button>
            );
          })}
        </div>
        {selected.length >= MAX_SPOTS && (
          <p className="custom-planner-hint">最多选择 {MAX_SPOTS} 个机位</p>
        )}
      </div>

      {/* ── Selected list ──────────────────────────────────────── */}
      {selected.length > 0 && (
        <div className="custom-planner-section">
          <p className="custom-planner-label">已选机位清单</p>
          <ol className="custom-spot-list">
            {selected.map((id, idx) => (
              <li key={id} className="custom-spot-item">
                <span className="custom-spot-num">{idx + 1}</span>
                <span className="custom-spot-name">{nameOf(id)}</span>
                <div className="custom-spot-actions">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    aria-label="上移"
                    className="custom-spot-btn"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === selected.length - 1}
                    aria-label="下移"
                    className="custom-spot-btn"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(id)}
                    aria-label="移除"
                    className="custom-spot-btn custom-spot-btn-remove"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ol>

          {/* Start / End picker */}
          {selected.length >= MIN_SPOTS && (
            <div className="custom-endpoint-row">
              <label className="custom-endpoint-field">
                <span>起点</span>
                <select
                  value={startId}
                  onChange={(e) => setStartId(e.target.value)}
                  className="custom-endpoint-select"
                >
                  <option value="">自动</option>
                  {selected.map((id) => (
                    <option key={id} value={id}>{nameOf(id)}</option>
                  ))}
                </select>
              </label>
              <label className="custom-endpoint-field">
                <span>终点</span>
                <select
                  value={endId}
                  onChange={(e) => setEndId(e.target.value)}
                  className="custom-endpoint-select"
                >
                  <option value="">自动</option>
                  {selected.map((id) => (
                    <option key={id} value={id}>{nameOf(id)}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <button
            type="button"
            className="custom-autoplan-btn"
            disabled={selected.length < MIN_SPOTS}
            onClick={autoPlan}
          >
            ✦ 自动规划最优路线
          </button>
        </div>
      )}

      {/* ── Plan result ────────────────────────────────────────── */}
      {showPlan && stats && (
        <div className="custom-planner-result">
          <div className="custom-result-summary">
            <span>总步行距离</span>
            <strong>{formatDist(stats.totalDistM)}</strong>
            <span>预计时间</span>
            <strong>约 {stats.estimatedMinutes} 分钟</strong>
          </div>
          <ol className="custom-result-stops">
            {planned.map((id, idx) => {
              const seg = stats.segments[idx];
              return (
                <li key={id} className="custom-result-stop">
                  <span className="custom-result-num">{idx + 1}</span>
                  <div className="custom-result-info">
                    <span className="custom-result-name">{nameOf(id)}</span>
                    {seg && (
                      <span className="custom-result-dist">
                        → {nameOf(planned[idx + 1])} · {formatDist(seg.distM)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="custom-planner-hint">
            距离基于校园道路网络估算，不代表精确导航，实际步行请结合现场路况。
          </p>
        </div>
      )}

      {selected.length === 0 && (
        <p className="custom-planner-hint">
          在上方选择 2～8 个机位，即可规划专属路线并在地图上预览。
        </p>
      )}
    </div>
  );
}
