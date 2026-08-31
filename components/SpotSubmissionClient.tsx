"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import SubmissionMap from "@/components/SubmissionMap";
import { resolveCampusLocation } from "@/lib/campusLocation";
import type { CampusLocationResolution } from "@/types/campus";
import type { Spot } from "@/types/spot";
import type { AIField, AIFieldSource, CameraSpotSubmission, SubmissionImage } from "@/types/submission";

type Step = "upload" | "position" | "review" | "success";
type FieldKey = "location" | "style" | "capturedAt" | "recommendedTime" | "focalLength" | "light" | "composition" | "advice" | "crowd";
type CardFields = Record<FieldKey, AIField<string | string[]>>;

const sourceText: Record<AIFieldSource, string> = { exif: "照片参数", ai: "AI 识别", user: "用户标记", inferred: "AI 推测" };

function makeMockFields(spot: Spot): CardFields {
  return {
    location: { value: spot.name, source: "user", userConfirmed: false },
    style: { value: ["学院纪实", "建筑肖像"], source: "ai", confidence: 0.84, userConfirmed: false },
    capturedAt: { value: "待从照片参数确认", source: "exif", userConfirmed: false },
    recommendedTime: { value: spot.bestTime, source: "inferred", confidence: 0.72, userConfirmed: false },
    focalLength: { value: "50 mm", source: "exif", userConfirmed: false },
    light: { value: "侧逆光，自然光", source: "ai", confidence: 0.79, userConfirmed: false },
    composition: { value: "对称构图，保留人物与建筑尺度", source: "ai", confidence: 0.76, userConfirmed: false },
    advice: { value: spot.shootingTips, source: "inferred", confidence: 0.68, userConfirmed: false },
    crowd: { value: spot.crowdLevel === "高" ? "课间时段人流较多" : "人流相对舒缓", source: "inferred", confidence: 0.63, userConfirmed: false },
  };
}

export default function SpotSubmissionClient({ spot }: { spot: Spot }) {
  const [step, setStep] = useState<Step>("upload");
  const [images, setImages] = useState<SubmissionImage[]>([]);
  const [cameraSpot, setCameraSpot] = useState<CameraSpotSubmission | null>(null);
  const [locationResolution, setLocationResolution] = useState<CampusLocationResolution | null>(null);
  const [fields, setFields] = useState<CardFields>(() => makeMockFields(spot));
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisLine, setAnalysisLine] = useState("正在识别拍摄时间…");
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [peopleConsentConfirmed, setPeopleConsentConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<SubmissionImage[]>([]);
  const canAnalyze = images.length > 0 && cameraSpot;
  const canSubmit = rightsConfirmed && peopleConsentConfirmed;

  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)), []);

  const cover = useMemo(() => images.find((image) => image.isCover) ?? images[0], [images]);

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setImages((current) => [
      ...current,
      ...files.filter((file) => file.type.startsWith("image/")).map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        isCover: current.length === 0 && index === 0,
      })),
    ]);
    event.target.value = "";
  }

  function removeImage(id: string) {
    setImages((current) => {
      const removing = current.find((image) => image.id === id);
      if (removing) URL.revokeObjectURL(removing.previewUrl);
      const next = current.filter((image) => image.id !== id);
      return next.map((image, index) => ({ ...image, isCover: next.some((item) => item.isCover) ? image.isCover : index === 0 }));
    });
  }

  function chooseCover(id: string) { setImages((current) => current.map((image) => ({ ...image, isCover: image.id === id }))); }

  function handleCameraSpotChange(next: CameraSpotSubmission) {
    const resolved = resolveCampusLocation(next.latitude, next.longitude);
    setLocationResolution(resolved);
    setCameraSpot({ ...next, nearbyPlaceId: resolved.nearestPlace?.id, spotId: spot.id });
  }

  function startAnalysis() {
    if (!canAnalyze) return;
    setAnalyzing(true);
    const phrases = ["正在识别拍摄时间…", "正在分析构图与光线…", "正在整理拍摄建议…"];
    let index = 0;
    const timer = window.setInterval(() => { index += 1; setAnalysisLine(phrases[index] ?? phrases[phrases.length - 1]); }, 750);
    window.setTimeout(() => { window.clearInterval(timer); setFields(makeMockFields(spot)); setAnalyzing(false); setStep("review"); }, 2350);
  }

  function updateField(key: FieldKey, value: string | string[]) { setFields((current) => ({ ...current, [key]: { ...current[key], value, source: "user", userConfirmed: true } })); setEditing(null); }
  function confirmField(key: FieldKey) { setFields((current) => ({ ...current, [key]: { ...current[key], userConfirmed: true } })); }

  const steps = [{ id: "upload", label: "上传作品" }, { id: "position", label: "标记机位" }, { id: "review", label: "确认投稿" }];

  return <main className="min-h-screen bg-mist pb-12">
    <header className="border-b border-ink/10 bg-mist/90 backdrop-blur"><div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8"><Link href={`/spot/${spot.slug}/`} className="text-sm text-slate-500 hover:text-sea">← 返回{spot.name}</Link><Link href="/" className="text-sm font-bold tracking-[.18em] text-ink">光影大工</Link></div></header>
    <div className="mx-auto max-w-4xl px-5 pt-7 sm:px-8 sm:pt-10">
      {step !== "success" && <><div className="flex items-center gap-2 text-[11px] font-semibold tracking-[.16em] text-sea"><span>PHOTOGRAPHER CONTRIBUTION</span></div><h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">把你的毕业照变成一份拍摄攻略</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">上传作品，系统会帮你整理机位、光线和拍摄建议；最后由你确认，分享给下一位来到{spot.name}的人。</p><nav className="mt-7 flex gap-1 overflow-x-auto pb-1" aria-label="投稿步骤">{steps.map((item, index) => <div key={item.id} className="flex shrink-0 items-center gap-1"><span className={`rounded-full px-3 py-2 text-xs font-semibold ${step === item.id ? "bg-ink text-white" : steps.findIndex((candidate) => candidate.id === step) > index ? "bg-sea/15 text-sea" : "bg-white text-slate-400"}`}>{index + 1}. {item.label}</span>{index < steps.length - 1 && <span className="h-px w-4 bg-ink/15" />}</div>)}</nav></>}

      {step === "upload" && <section className="mt-7 rounded-[1.75rem] border border-ink/8 bg-white/70 p-5 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-semibold tracking-[.18em] text-sea">STEP 01 / YOUR IMAGES</p><h2 className="mt-2 text-2xl font-semibold text-ink">先放进这组作品</h2></div><p className="text-xs text-slate-400">照片只在当前浏览器预览</p></div><input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={addImages} />
        {!images.length ? <button onClick={() => inputRef.current?.click()} className="mt-6 grid min-h-64 w-full place-items-center rounded-[1.25rem] border-2 border-dashed border-sea/35 bg-[#edf4f1] p-6 text-center transition hover:border-sea hover:bg-[#e5f0ec]"><span><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-2xl text-sea shadow-sm">＋</span><strong className="mt-4 block text-base text-ink">选择你想分享的照片</strong><span className="mt-2 block text-xs leading-5 text-slate-500">可以一次选择多张。选好后，挑一张作为这组作品的封面。</span></span></button> : <><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{images.map((image) => <figure key={image.id} className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border ${image.isCover ? "border-coral ring-2 ring-coral/25" : "border-ink/10"}`}><img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />{image.isCover && <figcaption className="absolute left-2 top-2 rounded-full bg-coral px-2 py-1 text-[10px] font-semibold text-white">封面</figcaption>}<div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-ink/72 p-2 transition group-hover:translate-y-0 group-focus-within:translate-y-0"><button onClick={() => chooseCover(image.id)} className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-ink">设为封面</button><button onClick={() => removeImage(image.id)} className="rounded-full px-2 py-1 text-[10px] text-white hover:bg-white/15">删除</button></div></figure>)}</div><button onClick={() => inputRef.current?.click()} className="mt-4 rounded-full border border-sea/35 bg-white px-4 py-2.5 text-sm font-semibold text-sea hover:bg-[#edf4f1]">＋ 继续添加照片</button></>}
        <div className="mt-7 flex items-center justify-between gap-4 border-t border-ink/8 pt-5"><p className="text-xs leading-5 text-slate-500">不上传服务器，不会自动发布。下一步标出拍摄时你站的位置。</p><button disabled={!images.length} onClick={() => setStep("position")} className="shrink-0 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/20">标记摄影机位 →</button></div></section>}

      {step === "position" && <section className="mt-7 overflow-hidden rounded-[1.75rem] border border-ink/8 bg-white/70"><div className="p-5 sm:p-8"><p className="text-[11px] font-semibold tracking-[.18em] text-sea">STEP 02 / CAMERA POSITION</p><h2 className="mt-2 text-2xl font-semibold text-ink">你是从哪里按下快门的？</h2><p className="mt-3 text-sm leading-6 text-slate-600">点击地图放下标记，再拖动微调。这个位置只作为这次投稿的摄影机位候选，不会改动{spot.name}的正式点位。</p></div><div className="border-y border-ink/8"><SubmissionMap spot={spot} cameraSpot={cameraSpot} onChange={handleCameraSpotChange} /></div><div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-8"><div className="flex items-center gap-2 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full bg-coral text-white">⌖</span><div><span className="font-medium text-ink">{cameraSpot ? "这是摄影师站的位置，可继续拖动调整" : "点击地图，标出你的实际站位"}</span>{locationResolution?.nearestPlace && <p className="mt-1 text-xs text-slate-500">附近地标 · 地图推测：{locationResolution.nearestPlace.name}（请确认）</p>}</div></div><div className="flex gap-2"><button onClick={() => setStep("upload")} className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500">上一步</button><button disabled={!cameraSpot} onClick={startAnalysis} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/20">让 AI 整理拍摄信息 →</button></div></div></section>}

      {analyzing && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-5 backdrop-blur-sm"><div className="w-full max-w-sm rounded-[1.75rem] bg-white p-7 text-center shadow-2xl"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf4f1] text-xl text-sea animate-pulse">✦</span><p className="mt-5 text-[11px] font-semibold tracking-[.18em] text-sea">PHOTO NOTE</p><h2 className="mt-2 text-xl font-semibold text-ink">{analysisLine}</h2><p className="mt-3 text-sm leading-6 text-slate-500">正在整理机位、光线和构图建议。</p></div></div>}

      {step === "review" && <section className="mt-7"><div className="rounded-[1.5rem] border border-sea/25 bg-[#edf4f1] p-4 text-sm leading-6 text-ink"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-sea text-xs text-white">✦</span><strong>已整理好第一版，确认后即可投稿。</strong><span className="block pl-8 text-slate-600">系统负责整理，摄影师负责确认；你可以继续修改每一项内容。</span></div><div className="mt-5 overflow-hidden rounded-[1.75rem] border border-ink/8 bg-white/80"><div className="flex items-start justify-between gap-4 border-b border-ink/8 p-5 sm:p-7"><div><p className="text-[11px] font-semibold tracking-[.18em] text-sea">PHOTOGRAPHY CARD</p><h2 className="mt-2 text-2xl font-semibold text-ink">{spot.name} · 这一次拍摄</h2><p className="mt-2 text-sm text-slate-500">摄影卡草稿，点击任意字段即可调整。</p></div>{cover && <img src={cover.previewUrl} alt="投稿封面预览" className="h-20 w-20 rounded-2xl object-cover sm:h-24 sm:w-24" />}</div><div className="grid divide-y divide-ink/8 sm:grid-cols-2 sm:divide-x sm:divide-y-0">{(["location", "style", "capturedAt", "recommendedTime", "focalLength", "light", "composition", "advice", "crowd"] as FieldKey[]).map((key) => <EditableField key={key} fieldKey={key} field={fields[key]} editing={editing === key} onEdit={() => setEditing(key)} onCancel={() => setEditing(null)} onSave={(value) => updateField(key, value)} onConfirm={() => confirmField(key)} />)}<div className="p-5 sm:p-6"><p className="text-xs text-slate-400">摄影机位</p><p className="mt-2 font-medium text-ink">{cameraSpot?.label ?? "待标记"}</p><div className="mt-3 flex items-center justify-between"><Source source="user" confirmed={Boolean(cameraSpot)} /><button onClick={() => setStep("position")} className="text-xs font-semibold text-sea">重新调整地图 →</button></div></div></div></div>
        <section className="mt-5 rounded-[1.5rem] border border-ink/8 bg-white/70 p-5 sm:p-7"><p className="text-[11px] font-semibold tracking-[.18em] text-sea">BEFORE YOU SHARE</p><h2 className="mt-2 text-xl font-semibold text-ink">把作品交给地图前，再确认两件事</h2><label className="mt-5 flex cursor-pointer gap-3 rounded-2xl bg-mist p-4 text-sm leading-6 text-ink"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-coral" /><span>我拥有这些照片的版权或已获得投稿授权</span></label><label className="mt-3 flex cursor-pointer gap-3 rounded-2xl bg-mist p-4 text-sm leading-6 text-ink"><input type="checkbox" checked={peopleConsentConfirmed} onChange={(event) => setPeopleConsentConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-coral" /><span>照片中的人物已同意公开展示</span></label><div className="mt-6 flex flex-wrap items-center justify-between gap-3"><button onClick={() => setStep("position")} className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500">返回修改机位</button><button disabled={!canSubmit} onClick={() => setStep("success")} className="rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/20">提交审核</button></div></section></section>}

      {step === "success" && <section className="mx-auto mt-16 max-w-xl rounded-[2rem] border border-ink/8 bg-white/80 p-8 text-center shadow-sm sm:mt-20 sm:p-12"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#edf4f1] text-3xl text-sea">✓</span><p className="mt-6 text-[11px] font-semibold tracking-[.2em] text-sea">SUBMISSION RECEIVED</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">投稿成功</h1><p className="mt-4 text-sm leading-7 text-slate-600">审核通过后，这组作品和拍摄经验将出现在光影大工地图中。</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href={`/spot/${spot.slug}/`} className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink">返回点位</Link><Link href="/map/?route=classic-graduation" className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white">继续浏览地图</Link></div></section>}
    </div></main>;
}

function Source({ source, confirmed }: { source: AIFieldSource; confirmed: boolean }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${confirmed ? "bg-sea/15 text-sea" : "bg-[#f7eee8] text-coral"}`}>{sourceText[source]} · {confirmed ? "已确认" : "待确认"}</span>;
}

function EditableField({ fieldKey, field, editing, onEdit, onCancel, onSave, onConfirm }: { fieldKey: FieldKey; field: AIField<string | string[]>; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (value: string | string[]) => void; onConfirm: () => void }) {
  const labels: Record<FieldKey, string> = { location: "拍摄地点", style: "拍摄风格", capturedAt: "实际拍摄时间", recommendedTime: "推荐拍摄时段", focalLength: "焦段", light: "光线类型", composition: "构图方式", advice: "拍摄建议", crowd: "人流情况" };
  const isTags = fieldKey === "style";
  const display = Array.isArray(field.value) ? field.value.join(" · ") : field.value;
  const [draft, setDraft] = useState(display);
  useEffect(() => setDraft(display), [display, editing]);
  return <div className={`p-5 sm:p-6 ${fieldKey === "advice" || fieldKey === "composition" ? "sm:col-span-2" : ""}`}><div className="flex items-start justify-between gap-3"><p className="text-xs text-slate-400">{labels[fieldKey]}</p><button onClick={onEdit} className="text-xs font-semibold text-sea">编辑</button></div>{editing ? <div className="mt-3"><textarea value={draft} rows={fieldKey === "advice" ? 3 : 2} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-xl border border-sea/30 bg-mist px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-sea" /><div className="mt-2 flex gap-2"><button onClick={() => onSave(isTags ? draft.split(/[，,]/).map((item) => item.trim()).filter(Boolean) : draft)} className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">保存</button><button onClick={onCancel} className="px-2 text-xs text-slate-500">取消</button></div></div> : <><p className="mt-2 text-sm font-medium leading-6 text-ink">{isTags && Array.isArray(field.value) ? <span className="flex flex-wrap gap-1.5">{field.value.map((tag) => <span key={tag} className="rounded-full bg-[#edf4f1] px-2 py-1 text-xs text-sea">{tag}</span>)}</span> : display}</p><div className="mt-3 flex items-center justify-between gap-2"><Source source={field.source} confirmed={field.userConfirmed} />{!field.userConfirmed && <button onClick={onConfirm} className="text-xs font-semibold text-sea">确认</button>}</div></>}</div>;
}
