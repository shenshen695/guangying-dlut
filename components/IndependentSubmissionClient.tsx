"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import SubmissionMap from "@/components/SubmissionMap";
import { campusPlaces } from "@/data/campusPlaces";
import { resolveCampusLocation } from "@/lib/campusLocation";
import type { CampusLocationResolution } from "@/types/campus";
import type { AIField, AIFieldSource, CameraSpotSubmission, Submission, SubmissionImage } from "@/types/submission";

type Step = "upload" | "position" | "ai" | "review" | "submit" | "success";
type FieldKey = "style" | "capturedAt" | "recommendedTime" | "focalLength" | "light" | "composition" | "advice";
type CardFields = Record<FieldKey, AIField<string | string[]>>;
const sourceText: Record<AIFieldSource, string> = { exif: "照片参数", ai: "AI 识别", user: "用户修改", inferred: "AI 推测" };
const defaultCenter = { latitude: 38.8794, longitude: 121.5275 };

function mockFields(locationName: string): CardFields {
  return {
    style: { value: ["学院纪实", "建筑肖像"], source: "ai", confidence: 0.84, userConfirmed: false },
    capturedAt: { value: "待从照片参数确认", source: "exif", userConfirmed: false },
    recommendedTime: { value: "下午至黄金时段", source: "inferred", confidence: 0.72, userConfirmed: false },
    focalLength: { value: "50 mm", source: "exif", userConfirmed: false },
    light: { value: "侧逆光，自然光", source: "ai", confidence: 0.79, userConfirmed: false },
    composition: { value: "对称构图，保留人物与建筑尺度", source: "ai", confidence: 0.76, userConfirmed: false },
    advice: { value: `在${locationName}先拍环境全景，再补拍人物与建筑的关系。`, source: "ai", confidence: 0.68, userConfirmed: false },
  };
}

export default function IndependentSubmissionClient() {
  const [step, setStep] = useState<Step>("upload");
  const [images, setImages] = useState<SubmissionImage[]>([]);
  const [cameraSpot, setCameraSpot] = useState<CameraSpotSubmission | null>(null);
  const [resolution, setResolution] = useState<CampusLocationResolution | null>(null);
  const [locationName, setLocationName] = useState("");
  const [placeChoice, setPlaceChoice] = useState("");
  const [fields, setFields] = useState<CardFields>(() => mockFields("你标记的位置"));
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisLine, setAnalysisLine] = useState("正在读取照片参数…");
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [peopleConsentConfirmed, setPeopleConsentConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<SubmissionImage[]>([]);
  const cover = useMemo(() => images.find((image) => image.isCover) ?? images[0], [images]);
  const canContinuePosition = Boolean(cameraSpot && locationName.trim());
  const canSubmit = rightsConfirmed && peopleConsentConfirmed;

  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)), []);

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    setImages((current) => [...current, ...files.map((file, index) => ({ id: `${file.name}-${file.lastModified}-${index}`, name: file.name, previewUrl: URL.createObjectURL(file), isCover: current.length === 0 && index === 0 }))]);
    event.target.value = "";
  }
  function removeImage(id: string) {
    setImages((current) => {
      const removing = current.find((image) => image.id === id); if (removing) URL.revokeObjectURL(removing.previewUrl);
      const next = current.filter((image) => image.id !== id);
      return next.map((image, index) => ({ ...image, isCover: next.some((item) => item.isCover) ? image.isCover : index === 0 }));
    });
  }
  function resolvePosition(next: CameraSpotSubmission) {
    const nextResolution = resolveCampusLocation(next.latitude, next.longitude);
    setCameraSpot({ ...next, nearbyPlaceId: nextResolution.nearestPlace?.id, spotId: nextResolution.matchedSpotId });
    setResolution(nextResolution);
    setPlaceChoice(nextResolution.nearestPlace?.id ?? "");
    setLocationName(nextResolution.nearestPlace?.name ?? "");
  }
  function choosePlace(id: string) {
    const place = campusPlaces.find((item) => item.id === id); if (!place) return;
    resolvePosition({ latitude: place.latitude, longitude: place.longitude, label: `${place.name}附近拍摄机位`, source: "user" });
  }
  function startAnalysis() {
    if (!canContinuePosition) return;
    setAnalyzing(true); const phrases = ["正在读取照片参数…", "正在分析构图与光线…", "正在整理拍摄建议…"]; let index = 0;
    const timer = window.setInterval(() => { index += 1; setAnalysisLine(phrases[index] ?? phrases[phrases.length - 1]); }, 700);
    window.setTimeout(() => { window.clearInterval(timer); setFields(mockFields(locationName)); setAnalyzing(false); setStep("review"); }, 2200);
  }
  function updateField(key: FieldKey, value: string | string[]) { setFields((current) => ({ ...current, [key]: { ...current[key], value, source: "user", userConfirmed: true } })); setEditing(null); }
  function submit() {
    if (!cameraSpot || !canSubmit) return;
    const submission: Submission = { id: `demo-${Date.now()}`, spotId: cameraSpot.spotId, locationName: locationName.trim(), latitude: cameraSpot.latitude, longitude: cameraSpot.longitude, nearbyPlaceId: cameraSpot.nearbyPlaceId, images, cameraSpot, fields: { location: { value: locationName.trim(), source: "user", userConfirmed: true }, ...fields } as Submission["fields"], rightsConfirmed, peopleConsentConfirmed, status: "submitted" };
    void submission;
    setStep("success");
  }
  const steps = [{ id: "upload", label: "上传作品" }, { id: "position", label: "确认地点" }, { id: "ai", label: "AI 整理" }, { id: "review", label: "确认修改" }, { id: "submit", label: "授权提交" }];

  return <main className="min-h-screen bg-mist pb-12"><header className="border-b border-ink/10 bg-mist/90 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8"><Link href="/" className="text-sm font-bold tracking-[.18em] text-ink">光影大工</Link><Link href="/map/?route=classic-graduation" className="text-sm text-slate-500 hover:text-sea">返回地图 →</Link></div></header><div className="mx-auto max-w-5xl px-5 pt-8 sm:px-8 sm:pt-11"><p className="text-[11px] font-semibold tracking-[.2em] text-sea">PHOTOGRAPHER CONTRIBUTION</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">上传一组作品，留下你的校园机位</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">不必先选择路线中的点位。先上传作品，再标记你实际按下快门的位置。</p><nav className="mt-7 flex gap-1 overflow-x-auto pb-1" aria-label="投稿步骤">{steps.map((item, index) => <div key={item.id} className="flex shrink-0 items-center gap-1"><span className={`rounded-full px-3 py-2 text-xs font-semibold ${step === item.id ? "bg-ink text-white" : "bg-white text-slate-400"}`}>{index + 1}. {item.label}</span>{index < steps.length - 1 && <span className="h-px w-3 bg-ink/15" />}</div>)}</nav>

      {step === "upload" && <section className="mt-7 rounded-[1.75rem] border border-ink/8 bg-white/75 p-5 sm:p-8"><p className="text-[11px] font-semibold tracking-[.18em] text-sea">STEP 01 / YOUR IMAGES</p><h2 className="mt-2 text-2xl font-semibold text-ink">先上传作品</h2><input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={addImages} />{!images.length ? <button type="button" onClick={() => inputRef.current?.click()} className="mt-6 grid min-h-72 w-full place-items-center rounded-[1.25rem] border-2 border-dashed border-sea/35 bg-[#edf4f1] p-6 text-center"><span><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-2xl text-sea">＋</span><strong className="mt-4 block text-base text-ink">选择你想分享的照片</strong><span className="mt-2 block text-xs text-slate-500">照片只在当前浏览器预览，不会自动发布。</span></span></button> : <><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image) => <figure key={image.id} className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border ${image.isCover ? "border-coral ring-2 ring-coral/25" : "border-ink/10"}`}><img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />{image.isCover && <figcaption className="absolute left-2 top-2 rounded-full bg-coral px-2 py-1 text-[10px] font-semibold text-white">封面</figcaption>}<button type="button" onClick={() => removeImage(image.id)} className="absolute bottom-2 right-2 rounded-full bg-ink/75 px-2 py-1 text-[10px] text-white">删除</button></figure>)}</div><button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded-full border border-sea/35 px-4 py-2.5 text-sm font-semibold text-sea">＋ 继续添加照片</button></>}<div className="mt-7 flex justify-end border-t border-ink/8 pt-5"><button type="button" disabled={!images.length} onClick={() => setStep("position")} className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white disabled:bg-ink/20">下一步：确认拍摄地点 →</button></div></section>}

      {step === "position" && <section className="mt-7 overflow-hidden rounded-[1.75rem] border border-ink/8 bg-white/75"><div className="p-5 sm:p-8"><p className="text-[11px] font-semibold tracking-[.18em] text-sea">STEP 02 / CONFIRM LOCATION</p><h2 className="mt-2 text-2xl font-semibold text-ink">你是在哪里按下快门的？</h2><p className="mt-3 text-sm leading-6 text-slate-600">点击地图选点或拖动标记。地图推测只是附近地标提示，请你确认、改选或自定义名称。</p></div><div className="border-y border-ink/8"><SubmissionMap initialCenter={cameraSpot ? { latitude: cameraSpot.latitude, longitude: cameraSpot.longitude } : defaultCenter} cameraSpot={cameraSpot} onChange={resolvePosition} /></div><div className="space-y-4 p-5 sm:p-8"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-mist p-4"><p className="text-xs text-slate-400">当前经纬度（WGS84）</p><p className="mt-2 font-mono text-sm text-ink">{cameraSpot ? `${cameraSpot.latitude.toFixed(6)}, ${cameraSpot.longitude.toFixed(6)}` : "点击地图后显示"}</p></div><div className="rounded-2xl bg-mist p-4"><p className="text-xs text-slate-400">附近地标 · 地图推测 · 请确认</p><p className="mt-2 font-medium text-ink">{resolution?.nearestPlace ? `你标记的位置靠近：${resolution.nearestPlace.name}` : "暂未匹配到校园地标"}{resolution?.distanceMeters ? <span className="ml-2 text-xs text-slate-400">约 {Math.round(resolution.distanceMeters)}m</span> : null}</p></div></div><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><select value={placeChoice} onChange={(event) => { setPlaceChoice(event.target.value); if (event.target.value) choosePlace(event.target.value); }} className="rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm text-ink"><option value="">选择其他已有校园地点（可选）</option>{campusPlaces.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select><input value={locationName} onChange={(event) => { const value = event.target.value; setLocationName(value); if (cameraSpot && resolution?.nearestPlace && value.trim() !== resolution.nearestPlace.name) setCameraSpot((current) => current ? { ...current, spotId: undefined } : current); }} placeholder="或自定义地点名称" className="rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm text-ink outline-none focus:border-sea" /></div><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{cameraSpot?.spotId ? `将自动关联已有点位：${cameraSpot.spotId}` : "不是路线中的点位也可以投稿"}</p><div className="flex gap-2"><button type="button" onClick={() => setStep("upload")} className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500">上一步</button><button type="button" disabled={!canContinuePosition} onClick={() => setStep("ai")} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:bg-ink/20">确认地点并继续 →</button></div></div></div></section>}

      {step === "ai" && <section className="mt-7 rounded-[1.75rem] border border-ink/8 bg-white/75 p-5 sm:p-8"><p className="text-[11px] font-semibold tracking-[.18em] text-sea">STEP 03 / AI ORGANIZE</p><h2 className="mt-2 text-2xl font-semibold text-ink">让 AI 整理摄影信息</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">EXIF 只读取时间、焦段等照片参数；AI 负责风格、构图、光线和建议，不负责猜准确地名。</p><button type="button" onClick={startAnalysis} className="mt-7 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white">开始整理 →</button></section>}

      {step === "review" && <section className="mt-7"><div className="rounded-2xl border border-sea/25 bg-[#edf4f1] p-4 text-sm leading-6 text-ink"><strong>AI 摄影卡草稿已生成。</strong><span className="ml-2 text-slate-600">请逐项确认或修改，地点信息来自地图与用户。</span></div><div className="mt-5 overflow-hidden rounded-[1.75rem] border border-ink/8 bg-white/80"><div className="flex items-start justify-between gap-4 border-b border-ink/8 p-5 sm:p-7"><div><p className="text-[11px] font-semibold tracking-[.18em] text-sea">AI PHOTOGRAPHY CARD</p><h2 className="mt-2 text-2xl font-semibold text-ink">{locationName} · 这一次拍摄</h2><p className="mt-2 text-sm text-slate-500">地点：用户确认 · 其他字段可继续编辑</p></div>{cover && <img src={cover.previewUrl} alt="投稿封面预览" className="h-20 w-20 rounded-2xl object-cover" />}</div><div className="grid divide-y divide-ink/8 sm:grid-cols-2 sm:divide-x sm:divide-y-0">{(["style", "capturedAt", "recommendedTime", "focalLength", "light", "composition", "advice"] as FieldKey[]).map((key) => <EditableField key={key} fieldKey={key} field={fields[key]} editing={editing === key} onEdit={() => setEditing(key)} onCancel={() => setEditing(null)} onSave={(value) => updateField(key, value)} />)}<div className="p-5 sm:col-span-2 sm:p-6"><p className="text-xs text-slate-400">拍摄地点</p><p className="mt-2 font-medium text-ink">{locationName}</p><Source source="user" confirmed /><p className="mt-3 text-xs text-slate-500">{cameraSpot?.spotId ? `spotId: ${cameraSpot.spotId}` : "spotId 留空，将作为 newSpot / cameraSpot candidate"}</p></div></div></div><div className="mt-5 flex flex-wrap justify-between gap-3"><button type="button" onClick={() => setStep("position")} className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500">返回修改地点</button><button type="button" onClick={() => setStep("submit")} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">下一步：授权与提交 →</button></div></section>}

      {step === "submit" && <section className="mt-7 rounded-[1.75rem] border border-ink/8 bg-white/75 p-5 sm:p-8"><p className="text-[11px] font-semibold tracking-[.18em] text-sea">STEP 05 / AUTHORIZE & SUBMIT</p><h2 className="mt-2 text-2xl font-semibold text-ink">最后确认，再把经验交给地图</h2><label className="mt-6 flex cursor-pointer gap-3 rounded-2xl bg-mist p-4 text-sm leading-6 text-ink"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-coral" /><span>我拥有这些照片的版权或已获得投稿授权</span></label><label className="mt-3 flex cursor-pointer gap-3 rounded-2xl bg-mist p-4 text-sm leading-6 text-ink"><input type="checkbox" checked={peopleConsentConfirmed} onChange={(event) => setPeopleConsentConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-coral" /><span>照片中的人物已同意公开展示</span></label><div className="mt-7 flex flex-wrap justify-between gap-3"><button type="button" onClick={() => setStep("review")} className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500">返回修改</button><button type="button" disabled={!canSubmit} onClick={submit} className="rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white disabled:bg-ink/20">提交审核</button></div></section>}

      {analyzing && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-5 backdrop-blur-sm"><div className="w-full max-w-sm rounded-[1.75rem] bg-white p-7 text-center shadow-2xl"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#edf4f1] text-xl text-sea">✦</span><p className="mt-5 text-[11px] font-semibold tracking-[.18em] text-sea">PHOTO NOTE</p><h2 className="mt-2 text-xl font-semibold text-ink">{analysisLine}</h2><p className="mt-3 text-sm leading-6 text-slate-500">正在整理机位、光线和构图建议。</p></div></div>}
      {step === "success" && <section className="mx-auto mt-16 max-w-xl rounded-[2rem] border border-ink/8 bg-white/80 p-8 text-center shadow-sm sm:mt-20 sm:p-12"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#edf4f1] text-3xl text-sea">✓</span><p className="mt-6 text-[11px] font-semibold tracking-[.2em] text-sea">SUBMISSION RECEIVED</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">投稿成功</h1><p className="mt-4 text-sm leading-7 text-slate-600">审核通过后，这组作品和拍摄经验将出现在光影大工地图中。</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/" className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink">返回首页</Link><Link href="/map/?route=classic-graduation" className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white">继续浏览地图</Link></div></section>}
    </div></main>;
}

function Source({ source, confirmed }: { source: AIFieldSource; confirmed: boolean }) { return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${confirmed ? "bg-sea/15 text-sea" : "bg-[#f7eee8] text-coral"}`}>{sourceText[source]} · {confirmed ? "已确认" : "待确认"}</span>; }

function EditableField({ fieldKey, field, editing, onEdit, onCancel, onSave }: { fieldKey: FieldKey; field: AIField<string | string[]>; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (value: string | string[]) => void }) {
  const labels: Record<FieldKey, string> = { style: "拍摄风格", capturedAt: "实际拍摄时间", recommendedTime: "推荐拍摄时段", focalLength: "焦段", light: "光线类型", composition: "构图方式", advice: "拍摄建议" };
  const isTags = fieldKey === "style"; const display = Array.isArray(field.value) ? field.value.join(" · ") : field.value; const [draft, setDraft] = useState(display); useEffect(() => setDraft(display), [display, editing]);
  return <div className={`p-5 sm:p-6 ${fieldKey === "advice" || fieldKey === "composition" ? "sm:col-span-2" : ""}`}><div className="flex items-start justify-between gap-3"><p className="text-xs text-slate-400">{labels[fieldKey]}</p><button type="button" onClick={onEdit} className="text-xs font-semibold text-sea">编辑</button></div>{editing ? <div className="mt-3"><textarea value={draft} rows={fieldKey === "advice" ? 3 : 2} onChange={(event) => setDraft(event.target.value)} className="w-full rounded-xl border border-sea/30 bg-mist px-3 py-2 text-sm leading-6 text-ink outline-none" /><div className="mt-2 flex gap-2"><button type="button" onClick={() => onSave(isTags ? draft.split(/[，,]/).map((item) => item.trim()).filter(Boolean) : draft)} className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">保存</button><button type="button" onClick={onCancel} className="px-2 text-xs text-slate-500">取消</button></div></div> : <><p className="mt-2 text-sm font-medium leading-6 text-ink">{isTags && Array.isArray(field.value) ? <span className="flex flex-wrap gap-1.5">{field.value.map((tag) => <span key={tag} className="rounded-full bg-[#edf4f1] px-2 py-1 text-xs text-sea">{tag}</span>)}</span> : display}</p><div className="mt-3"><Source source={field.source} confirmed={field.userConfirmed} /></div></>}</div>;
}
