"use client";

import Link from "next/link";
import { PointerEvent, useEffect, useRef, useState } from "react";
import AppIcon from "@/components/AppIcon";
import { lingshuiCameraPositions } from "@/data/cameraPositions";
import { lingshuiPhotoViews } from "@/data/lingshuiViews";

type ViewMode = "photo" | "diagram";

export default function LingshuiViewClient() {
  const [selectedId, setSelectedId] = useState(lingshuiCameraPositions[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>("photo");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [bearing, setBearing] = useState(-8);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const drag = useRef<{ pointerId: number; x: number; bearing: number } | null>(null);

  useEffect(() => {
    const position = new URLSearchParams(window.location.search).get("position");
    if (lingshuiCameraPositions.some((item) => item.id === position)) setSelectedId(position!);
  }, []);

  useEffect(() => {
    if (!lightboxId) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setLightboxId(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [lightboxId]);

  const selected = lingshuiCameraPositions.find((item) => item.id === selectedId) || lingshuiCameraPositions[0];
  const photoView = lingshuiPhotoViews[photoIndex];
  const activePlacement = photoView.markers[selected.id];
  const lightboxPhoto = lingshuiPhotoViews.find((item) => item.id === lightboxId) || null;

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    drag.current = { pointerId: event.pointerId, x: event.clientX, bearing };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    setBearing(drag.current.bearing + (event.clientX - drag.current.x) * .35);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  function rememberPosition() {
    window.localStorage.setItem("guangying-planner-camera", JSON.stringify({ spotId: selected.spotId, cameraPositionId: selected.id, cameraPositionName: selected.name }));
  }

  function nextPhoto() {
    setPhotoIndex((current) => (current + 1) % lingshuiPhotoViews.length);
  }

  return <main className="relative h-[100dvh] overflow-hidden bg-[#eef2ed] text-ink">
    <header className="absolute inset-x-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-between border-b border-ink/10 bg-[#f3f7f7]/96 px-3 pb-2 pt-[env(safe-area-inset-top)]">
      <Link href="/map/?spot=ling-shui-lake" className="flex h-9 items-center gap-1.5 text-sm font-semibold"><AppIcon name="arrow" className="h-4 w-4 rotate-180" />返回地图</Link>
      <p className="text-sm font-semibold">凌水湖机位</p>
    </header>

    <section className="absolute inset-x-0 bottom-[21rem] top-[calc(3.5rem+env(safe-area-inset-top))] overflow-hidden bg-[#dfe7e3]">
      <div className="absolute left-3 top-3 z-30 flex h-9 items-center bg-white/95 p-1 text-xs font-semibold shadow-sm">
        <button type="button" onClick={() => setViewMode("photo")} className={`h-7 px-3 ${viewMode === "photo" ? "bg-sea text-white" : "text-slate-500"}`}>实景</button>
        <button type="button" onClick={() => setViewMode("diagram")} className={`h-7 px-3 ${viewMode === "diagram" ? "bg-sea text-white" : "text-slate-500"}`}>机位示意</button>
      </div>

      {viewMode === "photo" ? <>
        <figure className="absolute inset-0 bg-[#15242b]">
          <img src={photoView.image} alt={photoView.alt} className="h-full w-full object-cover" style={{ objectPosition: photoView.objectPosition }} />
          <figcaption className="absolute bottom-2 left-3 z-10 bg-black/55 px-2 py-1 text-[10px] text-white/85">{photoView.title} · {photoView.source}</figcaption>
        </figure>

        <button type="button" onClick={nextPhoto} className="absolute right-3 top-3 z-30 flex h-9 items-center gap-1.5 bg-white/95 px-3 text-[11px] font-semibold text-sea shadow-sm">切换视角 <span className="text-slate-400">{photoIndex + 1}/{lingshuiPhotoViews.length}</span><AppIcon name="arrow" className="h-3.5 w-3.5" /></button>

        <div data-testid="photo-direction" className="pointer-events-none absolute z-10 h-[3px] w-20 origin-left rounded-full bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,.3)]" style={{ left: `${activePlacement.x}%`, top: `${activePlacement.y}%`, transform: `rotate(${activePlacement.directionDegrees}deg)` }}>
          <span className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-coral/90" />
          <span className="absolute left-3 top-1/2 h-11 w-16 -translate-y-1/2 bg-coral/[.16] [clip-path:polygon(0_50%,100%_0,100%_100%)]" />
          <span className="absolute -right-1 -top-[5px] h-0 w-0 border-b-[6px] border-l-[10px] border-t-[6px] border-b-transparent border-l-coral border-t-transparent" />
        </div>

        {lingshuiCameraPositions.map((position) => {
          const placement = photoView.markers[position.id];
          const active = selectedId === position.id;
          return <button key={position.id} type="button" onClick={() => setSelectedId(position.id)} aria-label={`机位 ${position.label} ${position.name}`} className={`absolute z-20 grid h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-[0_3px_10px_rgba(0,0,0,.3)] transition ${active ? "scale-105 bg-coral" : "scale-90 bg-ink/80 opacity-70"}`} style={{ left: `${placement.x}%`, top: `${placement.y}%` }}><span className="flex items-center gap-0.5"><AppIcon name="camera" className="h-3 w-3" />{position.label}</span></button>;
        })}
      </> : <>
        <button type="button" onClick={() => setBearing(-8)} aria-label="恢复默认视角" className="absolute right-3 top-3 z-30 flex h-9 items-center gap-1.5 bg-white/95 px-3 text-[11px] font-semibold text-sea shadow-sm"><AppIcon name="rotate" className="h-4 w-4" />默认视角</button>
        <div className="absolute inset-x-0 bottom-0 top-11 touch-none [perspective:900px]" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <div className="lake-scene-plane absolute left-1/2 top-1/2 h-[77vw] max-h-[360px] w-[92vw] max-w-[520px] border border-[#b9c8bc] bg-[#cddacb] shadow-[0_24px_35px_rgba(35,55,48,.18)]" style={{ transform: `translate(-50%, -50%) perspective(900px) rotateX(53deg) rotateZ(${bearing}deg)` }}>
            <div className="absolute left-[17%] top-[18%] h-[58%] w-[66%] rounded-[45%_55%_50%_42%] border-[6px] border-[#b3c7b6] bg-[#6ea6ad]" />
            <div className="absolute inset-x-[7%] bottom-[8%] h-[12%] rounded-[50%] border border-white/65 bg-[#e5e0cb]" />
            <span className="absolute left-[43%] top-[43%] text-[11px] font-semibold tracking-[.18em] text-white/85">凌水湖</span>
            {lingshuiCameraPositions.map((position) => {
              const active = selectedId === position.id;
              return <div key={position.id}>{active && <div className="pointer-events-none absolute z-10 h-0.5 w-16 origin-left bg-[#d88858]" style={{ left: `${position.sceneX}%`, top: `${position.sceneY}%`, transform: `rotate(${position.directionDegrees}deg)` }}><span className="absolute -right-0.5 -top-[5px] h-0 w-0 border-b-[5px] border-l-[8px] border-t-[5px] border-b-transparent border-l-[#d88858] border-t-transparent" /></div>}<button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setSelectedId(position.id)} aria-label={`机位 ${position.label} ${position.name}`} className={`absolute z-20 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white text-xs font-bold text-white shadow-md ${active ? "scale-110 bg-[#d88858]" : "bg-ink/80 opacity-75"}`} style={{ left: `${position.sceneX}%`, top: `${position.sceneY}%` }}><span className="flex items-center gap-0.5"><AppIcon name="camera" className="h-3.5 w-3.5" />{position.label}</span></button></div>;
            })}
          </div>
        </div>
      </>}
    </section>

    <section className="absolute inset-x-0 bottom-0 z-30 h-[21rem] overflow-y-auto border-t border-ink/10 bg-[#fffefa] px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto max-w-xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-sea">机位 {selected.label}</p><h1 className="mt-0.5 text-xl font-semibold">{selected.name}</h1><p className="mt-1 text-xs text-slate-500">{selected.cameraPosition} · {selected.cameraDirection}</p></div><span className="flex shrink-0 items-center gap-2 rounded-[12px] bg-[#fff5e4] px-2.5 py-2 text-[#b66a00]"><AppIcon name="sun" className="h-4 w-4" /><span><strong className="block text-[11px] font-semibold leading-none">{selected.recommendedTime}</strong><small className="mt-1 block text-[9px] font-medium text-[#b66a00]/75">推荐拍摄时间</small></span></span></div>
        <div className="mt-2 flex gap-1.5">{selected.tags.map((tag) => <span key={tag} className="rounded-full bg-[#edf2f1] px-2 py-1 text-[10px] text-slate-600">{tag}</span>)}</div>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{selected.tips}</p>

        <div className="mt-3"><div className="flex items-center justify-between"><p className="flex items-center gap-1.5 text-xs font-semibold"><AppIcon name="camera" className="h-3.5 w-3.5 text-sea" />参考成片</p><span className="text-[10px] text-slate-400">环境参考图</span></div><div className="mt-2 grid grid-cols-3 gap-2">{lingshuiPhotoViews.map((photo) => <button key={photo.id} type="button" onClick={() => setLightboxId(photo.id)} aria-label={`查看环境参考图：${photo.title}`} className="relative overflow-hidden rounded-[10px] bg-slate-100"><img src={photo.image} alt={photo.alt} className="aspect-[4/3] w-full object-cover" style={{ objectPosition: photo.objectPosition }} /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1.5 pt-4 text-left text-[9px] text-white">{photo.title}</span></button>)}</div></div>

        <div className="mt-3 grid grid-cols-[1.15fr_1fr_1fr] gap-2 text-[10px] font-semibold"><button type="button" onClick={() => setLightboxId(lingshuiPhotoViews[0].id)} className="flex h-10 items-center justify-center gap-1 rounded-[10px] border border-slate-200 bg-white text-slate-600"><AppIcon name="camera" className="h-3.5 w-3.5" />查看全部参考</button><Link href={`/planner/?spot=ling-shui-lake&cameraPosition=${selected.id}&cameraPositionName=${encodeURIComponent(selected.name)}`} onClick={rememberPosition} className="flex h-10 items-center justify-center gap-1 rounded-[10px] bg-sea text-white"><AppIcon name="sparkles" className="h-3.5 w-3.5" />带入风格</Link><Link href={`/spot/ling-shui-lake/submit/?cameraPosition=${selected.id}`} className="flex h-10 items-center justify-center gap-1 rounded-[10px] bg-ink text-white"><AppIcon name="upload" className="h-3.5 w-3.5" />上传作品</Link></div>
      </div>
    </section>

    {lightboxPhoto && <div role="dialog" aria-modal="true" aria-label="环境参考图预览" className="fixed inset-0 z-[1300] flex h-[100dvh] flex-col bg-[#080b0d] text-white"><div className="flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-end justify-between px-3 pb-2 pt-[env(safe-area-inset-top)]"><button type="button" onClick={() => setLightboxId(null)} aria-label="关闭环境参考图" className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><AppIcon name="close" className="h-5 w-5" /></button><span className="text-xs text-white/60">{lightboxPhoto.title}</span><span className="h-10 w-10" /></div><div className="flex min-h-0 flex-1 items-center justify-center p-2"><img src={lightboxPhoto.image} alt={lightboxPhoto.alt} className="max-h-full max-w-full object-contain" /></div><div className="border-t border-white/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"><p className="text-sm font-semibold">环境参考图</p><p className="mt-1 text-xs text-white/55">{lightboxPhoto.source} · {lightboxPhoto.attribution}</p></div></div>}
  </main>;
}
