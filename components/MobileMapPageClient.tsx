"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppIcon from "@/components/AppIcon";
import PrimaryHeader from "@/components/PrimaryHeader";
import spotsData from "@/data/map-spots.json";
import routesData from "@/data/map-routes.json";
import { getCampusMedia, spotMedia } from "@/data/media";
import type { MapSpot as Spot } from "@/types/map-spot";
import type { Route } from "@/types/route";

const MobileLeafletMapView = dynamic(() => import("@/components/MobileLeafletMapView"), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-[390px] place-items-center bg-[#e7ece9] text-sm text-slate-500">地图加载中...</div>,
});
const spots = spotsData as Spot[];
const routes = routesData as Route[];
const baseRoute = routes.find((route) => route.slug === "classic-graduation") || routes[0];

const routePresets: { id: string; label: string; route: Route }[] = [
  { id: "classic-graduation", label: "经典路线", route: routes.find((route) => route.slug === "classic-graduation") || baseRoute },
  { id: "west-route", label: "西部路线", route: routes.find((route) => route.slug === "west-route") || baseRoute },
  { id: "architecture-route", label: "建筑路线", route: routes.find((route) => route.slug === "architecture-route") || routes.find((route) => route.slug === "campus-architecture") || baseRoute },
  { id: "sunset-route", label: "日落路线", route: routes.find((route) => route.slug === "sunset-route") || routes.find((route) => route.slug === "lingshui-sunset") || baseRoute },
];

export default function MobileMapPageClient() {
  const searchParams = useSearchParams();
  const routeParam = searchParams.get("route");
  const spotParam = searchParams.get("spot");
  const searchTerm = searchParams.get("search")?.trim() || "";
  const generatedIds = (searchParams.get("spots") || "").split(",").filter((id) => spots.some((spot) => spot.id === id));
  const routeParamMatch = routePresets.find((item) => item.id === routeParam || item.route.slug === routeParam);
  const initialRouteId = generatedIds.length ? "custom" : routeParamMatch?.id || null;
  const [activeRouteId, setActiveRouteId] = useState<string | null>(initialRouteId);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(spotParam && spots.some((spot) => spot.id === spotParam) ? spotParam : null);
  const [routeMenuOpen, setRouteMenuOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchTerm) return spots;
    if (searchTerm.includes("日落") || searchTerm.includes("夜景")) return spots.filter((spot) => ["ling-shui-lake", "flower-wall", "main-building"].includes(spot.id));
    if (searchTerm.includes("毕业")) return spots;
    return spots.filter((spot) => `${spot.name}${spot.area}${spot.description}${spot.tags.join("")}`.includes(searchTerm));
  }, [searchTerm]);

  const customRoute = useMemo<Route | null>(() => generatedIds.length ? {
    ...baseRoute,
    id: "custom-route",
    slug: "custom-route",
    name: searchParams.get("style") || "我的定制路线",
    subtitle: "已生成的拍摄顺序",
    duration: `约 ${generatedIds.length * 30} 分钟`,
    walkingDistance: "按点位顺序估算",
    recommendedTime: "以企划选择时间为准",
    spots: generatedIds,
  } : null, [generatedIds, searchParams]);

  const activeRoute = activeRouteId === "custom" ? customRoute : routePresets.find((item) => item.id === activeRouteId)?.route || null;
  const visibleSpots = activeRoute ? spots : searchTerm ? (searchResults.length ? searchResults : spots) : spots;
  const selectedSpot = selectedSpotId ? spots.find((spot) => spot.id === selectedSpotId) || null : null;
  const selectedMedia = selectedSpot ? getCampusMedia(spotMedia[selectedSpot.id]) : null;

  function selectRoute(id: string) {
    setActiveRouteId((current) => current === id ? null : id);
    setSelectedSpotId(null);
    setRouteMenuOpen(false);
  }

  const routeButtonLabel = activeRouteId === "custom" ? "定制路线" : routePresets.find((item) => item.id === activeRouteId)?.label || "路线";

  return (
    <main className={`gy-kelvin-mobile-map map-shell relative h-[100dvh] overflow-hidden bg-[#e7ece9] ${selectedSpot ? "is-sheet-expanded" : "is-sheet-collapsed"}`}>
      <MobileLeafletMapView spots={visibleSpots} route={activeRoute} selectedSpotId={selectedSpotId} sheetExpanded={Boolean(selectedSpot)} onSelect={setSelectedSpotId} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] pt-[max(.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto relative mx-3">
          <PrimaryHeader
            className="bg-[#f3f7f7]/95"
            right={
              <button type="button" onClick={() => setRouteMenuOpen((open) => !open)} aria-expanded={routeMenuOpen} className="flex h-8 items-center gap-1.5 rounded-md bg-white px-2.5 text-[13px] font-semibold text-sea">
                <AppIcon name="route" className="h-4 w-4" />
                {routeButtonLabel}
                <AppIcon name="chevronDown" className={`h-3.5 w-3.5 transition ${routeMenuOpen ? "rotate-180" : ""}`} />
              </button>
            }
          />
          {routeMenuOpen ? (
            <div className="absolute right-0 top-[calc(100%+.4rem)] w-44 border border-ink/10 bg-white p-1.5 shadow-[0_12px_30px_rgba(17,36,47,.18)]">
              {routePresets.map((item) => <RouteOption key={item.id} active={activeRouteId === item.id} onClick={() => selectRoute(item.id)}>{item.label}</RouteOption>)}
              {customRoute ? <RouteOption active={activeRouteId === "custom"} onClick={() => selectRoute("custom")}>定制路线</RouteOption> : <Link href="/planner/" className="flex h-10 items-center gap-2 px-3 text-sm text-slate-600"><AppIcon name="plus" className="h-4 w-4" />定制路线</Link>}
              <div className="mt-1 border-t border-ink/8 pt-1"><button type="button" onClick={() => { setActiveRouteId(null); setSelectedSpotId(null); setRouteMenuOpen(false); }} className="h-10 w-full px-3 text-left text-sm font-medium text-slate-500">清除路线</button></div>
            </div>
          ) : null}
        </div>
        {searchTerm ? <div className="pointer-events-auto mx-3 mt-2 inline-flex bg-white/95 px-3 py-2 text-xs text-slate-500">“{searchTerm}” · {searchResults.length || spots.length} 个地点</div> : null}
      </div>

      {activeRoute ? (
        <div className="absolute left-3 top-[calc(max(.75rem,env(safe-area-inset-top))+3.35rem)] z-[450] flex items-center gap-2 rounded-full bg-ink/88 px-3 py-2 text-xs text-white shadow-lg">
          <AppIcon name="route" className="h-4 w-4 text-[#8ed0d7]" />
          <span>{activeRoute.name}</span>
          <button type="button" onClick={() => selectRoute(activeRouteId!)} aria-label="清除路线"><AppIcon name="close" className="h-3.5 w-3.5 text-white/70" /></button>
        </div>
      ) : null}

      {selectedSpot && selectedMedia ? (
        <section className="spot-sheet absolute inset-x-3 z-[650] mx-auto max-w-md overflow-hidden bg-white shadow-[0_10px_34px_rgba(17,36,47,.22)]">
          <button type="button" onClick={() => setSelectedSpotId(null)} aria-label="关闭地点卡片" className="absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white"><AppIcon name="close" className="h-4 w-4" /></button>
          <div className="flex gap-3 p-3">
            <img src={selectedMedia.src} alt={selectedMedia.alt} className="h-28 w-[38%] shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1 py-1">
              <h2 className="text-xl font-semibold text-ink">{selectedSpot.name}</h2>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{selectedSpot.shootingTips}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-sea"><AppIcon name="clock" className="h-3.5 w-3.5" />{selectedSpot.bestTime}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-ink/8 text-xs">
            <Link href={`/spot/${selectedSpot.slug}/`} className="flex flex-col items-center justify-center gap-1 py-3 font-semibold text-ink"><AppIcon name="camera" className="h-[17px] w-[17px]" />查看攻略</Link>
            {selectedSpot.id === "ling-shui-lake" ? <Link href="/spot/ling-shui-lake/view/" className="flex flex-col items-center justify-center gap-1 border-x border-ink/8 py-3 font-semibold text-sea"><AppIcon name="location" className="h-[17px] w-[17px]" />实景机位</Link> : <span className="flex flex-col items-center justify-center gap-1 border-x border-ink/8 py-3 text-slate-300"><AppIcon name="location" className="h-[17px] w-[17px]" />机位待上线</span>}
            <Link href={`/spot/${selectedSpot.slug}/submit/`} className="flex flex-col items-center justify-center gap-1 bg-sea py-3 font-semibold text-white"><AppIcon name="upload" className="h-[17px] w-[17px]" />上传作品</Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function RouteOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`flex h-10 w-full items-center justify-between px-3 text-left text-sm ${active ? "bg-[#e8f2f3] font-semibold text-sea" : "text-slate-600"}`}>
      <span>{children}</span>
      {active ? <span className="h-2 w-2 rounded-full bg-sea" /> : null}
    </button>
  );
}
