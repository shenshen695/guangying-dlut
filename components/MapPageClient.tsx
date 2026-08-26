"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import spotsData from "@/data/spots.json";
import routesData from "@/data/routes.json";
import type { Spot } from "@/types/spot";
import type { Route } from "@/types/route";
import SpotCard from "@/components/SpotCard";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false, loading: () => <div className="grid h-full min-h-[390px] place-items-center bg-[#e7ece9] text-sm text-slate-500">地图加载中…</div> });
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

  const controls = <div className="flex items-center gap-2"><button type="button" onClick={isPlaying ? () => setIsPlaying(false) : playRoute} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-sea">{isPlaying ? "暂停" : "播放路线"}</button><button type="button" onClick={restartRoute} className="rounded-full border border-ink/15 bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-coral hover:text-coral">重新开始</button></div>;

  return <main className="min-h-[100dvh] bg-mist lg:min-h-screen"><div className="flex min-h-[100dvh] flex-col lg:min-h-screen lg:flex-row">
    <section className={`map-shell relative h-[100dvh] min-h-0 w-full overflow-hidden bg-[#e7ece9] lg:h-screen lg:w-[64%] ${sheetExpanded ? "is-sheet-expanded" : "is-sheet-collapsed"}`}><div className="absolute left-4 top-4 z-[500] flex items-center gap-3 rounded-full border border-ink/10 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur sm:left-8 sm:top-8"><Link href="/" className="text-sm font-bold tracking-[.18em] text-ink">光影大工</Link><span className="h-1 w-1 rounded-full bg-coral" /><span className="text-xs text-slate-500">{route.name}</span></div><MapView spots={spots} route={route} selectedSpotId={selectedSpotId} sheetExpanded={sheetExpanded} onSelect={(id) => { setSelectedSpotId(id); setSheetExpanded(true); }} />
      <div className="absolute bottom-5 left-4 z-[500] hidden rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm backdrop-blur sm:left-8 sm:block"><p className="text-[10px] tracking-[.18em] text-slate-400">PHOTOGRAPHY SEQUENCE</p><p className="mt-1 text-xs text-slate-600">路线为摄影顺序示意，不代表精确步行导航。</p></div>
      {selectedSpot && <div className={`spot-sheet absolute inset-x-3 z-[600] rounded-[1.35rem] border border-ink/10 bg-white/95 p-4 shadow-[0_12px_36px_rgba(22,32,42,.18)] backdrop-blur transition-all duration-300 lg:hidden ${sheetExpanded ? "max-h-[62%]" : "max-h-[150px]"}`}><button type="button" className="mb-3 flex w-full justify-center" onClick={() => setSheetExpanded((value) => !value)} aria-label={sheetExpanded ? "收起点位信息" : "展开点位信息"}><span className="h-1 w-10 rounded-full bg-ink/20" /></button><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold tracking-[.2em] text-sea">{String(selectedIndex + 1).padStart(2, "0")} / {routeSpots.length}</p><h2 className="mt-1 text-xl font-semibold text-ink">{selectedSpot.name}</h2><p className="mt-1 text-xs text-slate-500">最佳时间 {selectedSpot.bestTime}</p></div><button type="button" onClick={() => setSheetExpanded((value) => !value)} className="rounded-full border border-ink/10 px-3 py-1.5 text-xs text-slate-500">{sheetExpanded ? "收起" : "展开"}</button></div>{sheetExpanded && <div className="mt-4 space-y-3 border-t border-ink/8 pt-4 text-sm"><div className="flex items-center justify-between"><p className="text-xs text-slate-500">路线演示</p>{controls}</div><p className="leading-6 text-slate-600">{selectedSpot.description}</p><p className="leading-6 text-slate-600"><span className="font-semibold text-ink">拍摄建议：</span>{selectedSpot.shootingTips}</p><div className="flex items-center justify-between text-xs text-slate-500"><span>人流 {selectedSpot.crowdLevel}</span><span>{selectedIndex < routeSpots.length - 1 ? `下一站：${routeSpots[selectedIndex + 1].name}` : "路线终点"}</span></div><Link href={`/spot/${selectedSpot.slug}`} className="inline-flex text-xs font-semibold text-coral">查看摄影攻略 →</Link></div>}</div>}
    </section>
    <section className="hidden w-full flex-1 overflow-y-auto bg-mist px-5 pb-10 pt-8 sm:px-8 lg:block lg:w-[36%] lg:px-9 lg:pt-12"><div className="mx-auto max-w-xl"><Link href={isGeneratedRoute ? "/planner" : "/route/classic-graduation"} className="text-[11px] font-semibold tracking-[.2em] text-sea">{isGeneratedRoute ? "PLAN / 返回企划" : "ROUTE / 经典毕业线"}</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{route.name}</h1><p className="mt-2 text-sm text-slate-500">{route.subtitle}</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span>◷ {route.duration}</span><span>⌁ {route.walkingDistance}</span><span>◎ {routeSpots.length} 个摄影点</span></div><div className="mt-6 flex items-center justify-between rounded-2xl border border-ink/8 bg-white/60 p-3"><p className="text-xs text-slate-500">轻量路线演示</p>{controls}</div><div className="my-6 h-px bg-black/10" /><div className="space-y-3">{routeSpots.map((spot, index) => <div key={spot.id} ref={(node) => { cardRefs.current[spot.id] = node; }}><SpotCard spot={spot} index={index} selected={selectedSpotId === spot.id} onSelect={() => { setSelectedSpotId(spot.id); setSheetExpanded(true); }} /></div>)}</div><p className="mt-6 text-xs leading-5 text-slate-400">路线为摄影顺序示意，不代表精确步行导航。</p></div></section>
  </div></main>;
}
