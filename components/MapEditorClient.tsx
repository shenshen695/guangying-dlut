"use client";

import Link from "next/link";
import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import mapPointsData from "@/data/map-points.json";
import spotsData from "@/data/spots.json";
import type { Spot } from "@/types/spot";

type EditorPoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  imageSrc: string;
  imageFileName?: string;
  description: string;
  bestTime: string;
  seasonNote: string;
};

const STORAGE_KEY = "guangying-map-editor-v3";
const spots = spotsData as Spot[];
const initialPoints: EditorPoint[] = (mapPointsData as Array<Partial<EditorPoint> & { id: string; x: number; y: number }>).map((point) => {
  const spot = spots.find((item) => item.id === point.id);
  return {
    id: point.id,
    x: point.x,
    y: point.y,
    name: point.name ?? spot?.name ?? point.id,
    imageSrc: point.imageSrc ?? spot?.images?.[0]?.src ?? "",
    imageFileName: point.imageFileName,
    description: point.description ?? spot?.description ?? "",
    bestTime: point.bestTime ?? spot?.bestTime ?? "",
    seasonNote: point.seasonNote ?? spot?.seasonNote ?? "",
  };
});

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

export default function MapEditorClient() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<EditorPoint[]>(initialPoints);
  const [selectedId, setSelectedId] = useState(initialPoints.find((point) => point.id === "lover-road")?.id || initialPoints[0]?.id || "");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [backgroundPreview, setBackgroundPreview] = useState("");
  const [builtInBackground, setBuiltInBackground] = useState("/images/map/campus-q-map.jpg");
  const [notice, setNotice] = useState("点击地图即可移动当前标注");
  const selected = useMemo(() => points.find((point) => point.id === selectedId), [points, selectedId]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as EditorPoint[];
      if (Array.isArray(parsed) && parsed.length) {
        setPoints(parsed);
        setSelectedId(parsed[0].id);
        setNotice("已恢复上次保存在浏览器中的草稿");
      }
    } catch { /* Ignore an invalid local draft and keep the project defaults. */ }
  }, []);

  function updateSelected(patch: Partial<EditorPoint>) {
    setPoints((current) => current.map((point) => point.id === selectedId ? { ...point, ...patch } : point));
  }

  function placeAt(clientX: number, clientY: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || !selected) return;
    updateSelected({ x: clamp(((clientX - rect.left) / rect.width) * 100), y: clamp(((clientY - rect.top) / rect.height) * 100) });
  }

  function onMapPointer(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    placeAt(event.clientX, event.clientY);
  }

  function onMarkerPointer(event: PointerEvent<HTMLButtonElement>, id: string) {
    event.stopPropagation();
    setSelectedId(id);
    if (event.buttons === 1) placeAt(event.clientX, event.clientY);
  }

  function addPoint() {
    const id = `landmark-${Date.now().toString(36)}`;
    setPoints((current) => [...current, { id, name: "新点位", x: 50, y: 50, imageSrc: "", description: "", bestTime: "", seasonNote: "" }]);
    setSelectedId(id);
    setNotice("新点位已创建，请在地图上点击定位");
  }

  function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selected) return;
    const preview = URL.createObjectURL(file);
    setPreviews((current) => ({ ...current, [selected.id]: preview }));
    updateSelected({ imageFileName: file.name, imageSrc: `/images/spots/${file.name}` });
    setNotice("图片仅在本机预览；导出配置后请把原图放入 public/images/spots/");
  }

  function uploadBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBackgroundPreview(URL.createObjectURL(file));
    setNotice("新底图仅用于本机校准；确认后请将它作为正式校园底图接入项目");
  }

  function chooseBuiltInBackground(src: string, label: string) {
    setBackgroundPreview("");
    setBuiltInBackground(src);
    setNotice(`已切换到${label}；切换底图后需要重新校准标注位置`);
  }

  function saveDraft() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
    setNotice("草稿已保存在当前浏览器");
  }

  function exportConfig() {
    const payload = JSON.stringify(points, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "campus-map-points.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("配置已下载，可交给项目维护者直接接入");
  }

  async function importConfig(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as EditorPoint[];
      if (!Array.isArray(parsed) || !parsed.every((point) => point.id && Number.isFinite(point.x) && Number.isFinite(point.y))) throw new Error("invalid");
      setPoints(parsed.map((point) => ({ ...point, x: clamp(point.x), y: clamp(point.y) })));
      setSelectedId(parsed[0]?.id || "");
      setNotice(`已导入 ${parsed.length} 个点位`);
    } catch {
      setNotice("配置文件格式不正确，请导入本编辑器导出的 JSON");
    }
  }

  return <main className="min-h-screen bg-[#f5f2e9] text-ink"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-white/85 px-5 py-4 backdrop-blur sm:px-8"><div><p className="text-[10px] font-semibold tracking-[.22em] text-coral">MAP STUDIO</p><h1 className="mt-1 text-xl font-semibold">校园地图点位编辑器</h1></div><div className="flex flex-wrap gap-2"><Link href="/map?route=campus-highlights" className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold">查看正式地图</Link><button type="button" onClick={saveDraft} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">保存草稿</button><button type="button" onClick={exportConfig} className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white">导出配置</button></div></header>
    <div className="grid min-h-[calc(100vh-77px)] lg:grid-cols-[minmax(420px,1.35fr)_minmax(340px,.65fr)]">
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#e9e4d6] p-3 sm:p-6"><div className="absolute left-4 top-4 z-30 flex gap-2"><button type="button" onClick={() => chooseBuiltInBackground("/images/map/campus-q-map.jpg", "Q版地图")} className="rounded-full border border-white/70 bg-white/95 px-3 py-2 text-xs font-semibold text-ink shadow-sm">Q版地图</button><button type="button" onClick={() => chooseBuiltInBackground("/images/map/campus-screenshot-mosaic.jpg", "拼接校园图")} className="rounded-full border border-white/70 bg-white/95 px-3 py-2 text-xs font-semibold text-sea shadow-sm">拼接校园图</button></div><label className="absolute right-4 top-4 z-30 cursor-pointer rounded-full border border-white/70 bg-white/95 px-4 py-2 text-xs font-semibold text-coral shadow-sm">试用新底图<input type="file" accept="image/*" onChange={uploadBackground} className="hidden" /></label><div ref={stageRef} className={`relative h-auto max-h-[calc(100vh-125px)] w-full cursor-crosshair overflow-hidden shadow-[0_20px_70px_rgba(42,54,39,.18)] ${!backgroundPreview && builtInBackground.includes("mosaic") ? "aspect-[1940/1550] max-w-[940px]" : "aspect-[1024/1792] max-w-[580px]"}`} onPointerDown={onMapPointer} onPointerMove={(event) => { if (event.buttons === 1) onMapPointer(event); }}><img src={backgroundPreview || builtInBackground} alt="校园地图编辑底图" className="absolute inset-0 h-full w-full object-cover" draggable={false} />{points.map((point) => <button key={point.id} type="button" className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border-2 px-2 py-1 text-[10px] font-bold shadow-lg transition ${point.id === selectedId ? "border-ink bg-coral text-white ring-4 ring-white/70" : "border-white bg-white/95 text-ink"}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onPointerDown={(event) => onMarkerPointer(event, point.id)} onPointerMove={(event) => onMarkerPointer(event, point.id)} aria-pressed={point.id === selectedId}><span>{point.id === selectedId ? "◎" : "•"}</span>{point.name}</button>)}</div><div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-ink/85 px-4 py-2 text-xs text-white shadow-lg">{notice}</div></section>
      <aside className="overflow-y-auto border-l border-ink/10 bg-[#fbfaf6] p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold tracking-[.2em] text-sea">LANDMARKS</p><h2 className="mt-1 text-lg font-semibold">点位列表</h2></div><button type="button" onClick={addPoint} className="rounded-full border border-coral/30 bg-white px-3 py-2 text-xs font-semibold text-coral">＋ 新点位</button></div>
        <div className="mt-4 flex max-h-36 flex-wrap gap-2 overflow-y-auto">{points.map((point) => <button key={point.id} type="button" onClick={() => setSelectedId(point.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${point.id === selectedId ? "bg-ink text-white" : "border border-ink/10 bg-white text-slate-500"}`}>{point.name}</button>)}</div>
        {selected && <div className="mt-6 space-y-4 border-t border-ink/10 pt-6"><label className="block text-xs font-semibold text-slate-500">点位名称<input value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm text-ink outline-none focus:border-coral" /></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-slate-500">横向 X（%）<input type="number" min="0" max="100" step="0.1" value={selected.x} onChange={(event) => updateSelected({ x: clamp(Number(event.target.value)) })} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm text-ink" /></label><label className="text-xs font-semibold text-slate-500">纵向 Y（%）<input type="number" min="0" max="100" step="0.1" value={selected.y} onChange={(event) => updateSelected({ y: clamp(Number(event.target.value)) })} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm text-ink" /></label></div>
          <label className="block text-xs font-semibold text-slate-500">风景图<input type="file" accept="image/*" onChange={uploadImage} className="mt-2 block w-full rounded-xl border border-dashed border-sea/30 bg-white p-3 text-xs font-normal" /></label>{(previews[selected.id] || selected.imageSrc) && <img src={previews[selected.id] || selected.imageSrc} alt={`${selected.name}图片预览`} className="aspect-[16/9] w-full rounded-xl object-cover" />}
          <label className="block text-xs font-semibold text-slate-500">一句介绍<textarea value={selected.description} onChange={(event) => updateSelected({ description: event.target.value })} rows={3} className="mt-2 w-full resize-none rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm font-normal leading-6 text-ink" /></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-slate-500">最佳时间<input value={selected.bestTime} onChange={(event) => updateSelected({ bestTime: event.target.value })} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm font-normal text-ink" /></label><label className="text-xs font-semibold text-slate-500">季节提示<input value={selected.seasonNote} onChange={(event) => updateSelected({ seasonNote: event.target.value })} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm font-normal text-ink" /></label></div><div className="rounded-xl bg-[#edf4f1] p-3 text-xs leading-5 text-slate-600"><strong className="text-ink">使用方法：</strong>选择点位后直接点击地图定位，按住标注可拖动微调。完成后先保存草稿，再导出配置文件。</div>
        </div>}
        <div className="mt-6 border-t border-ink/10 pt-5"><label className="inline-flex cursor-pointer rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold text-slate-600">导入已有配置<input type="file" accept="application/json,.json" onChange={importConfig} className="hidden" /></label><p className="mt-3 text-[11px] leading-5 text-slate-400">编辑器不会直接修改线上网站。导出的配置和风景图经过确认后，再同步进 GitHub 发布。</p></div>
      </aside>
    </div>
  </main>;
}
