"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import mapSpotsData from "@/data/map-spots.json";
import type { MapSpot } from "@/types/map-spot";
import type { Route } from "@/types/route";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="gy-map-loading">地图加载中...</div>,
});

const mapSpots = mapSpotsData as MapSpot[];

export default function PlannerMapPreview({ spotIds, title }: { spotIds: string[]; title: string }) {
  const validSpotIds = useMemo(() => spotIds.filter((id) => mapSpots.some((spot) => spot.id === id)), [spotIds]);
  const [selectedSpotId, setSelectedSpotId] = useState(validSpotIds[0] || null);
  const route = useMemo<Route>(() => ({
    id: "planner-preview-route",
    slug: "planner-preview-route",
    name: title,
    subtitle: "企划结果里的真实点位路线预览",
    duration: `约 ${Math.max(45, validSpotIds.length * 25)} 分钟`,
    walkingDistance: "按点位顺序预览",
    recommendedTime: "以左侧表单时间为准",
    spots: validSpotIds,
  }), [title, validSpotIds]);

  return (
    <div className="gy-planner-map-preview gy-live-campus-workspace">
      <div className="gy-live-map-shell map-shell">
        <MapView
          spots={mapSpots}
          route={route}
          selectedSpotId={selectedSpotId}
          sheetExpanded={false}
          onSelect={setSelectedSpotId}
        />
      </div>
    </div>
  );
}
