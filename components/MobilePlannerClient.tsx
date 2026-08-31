"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import AppIcon from "@/components/AppIcon";
import spotsData from "@/data/spots.json";
import { getCampusMedia } from "@/data/media";
import { parsePlannerRequest } from "@/lib/planner/assistant";
import type { PlannerDraft, PlannerDuration, PlannerMood, PlannerShootType, PlannerTime } from "@/types/planner";
import type { Spot } from "@/types/spot";

const spots = spotsData as Spot[];
const suggestions = ["两个人拍毕业照", "今晚想拍凌水湖日落", "1小时校园情侣照", "想拍有建筑感的照片"];
const shootTypes: PlannerShootType[] = ["毕业照", "校园写真", "情侣照", "风景", "建筑"];
const durations: PlannerDuration[] = ["30 分钟", "1 小时", "2 小时", "半天"];
const moods: PlannerMood[] = ["日落感", "建筑感", "青春感", "湖边", "自然纪实"];
const timeOptions: PlannerTime[] = ["上午", "下午", "傍晚", "时间灵活"];
const filters = ["全部", "进行中", "已完成", "收藏夹"] as const;
type Filter = typeof filters[number];

type PlanStop = {
  spot: Spot;
  time: string;
  stay: string;
  position: string;
  direction: string;
  walk: string;
  light: string;
};
type GeneratedPlan = {
  title: string;
  summary: string;
  spotIds: string[];
  stops: PlanStop[];
  shootType: PlannerShootType;
  peopleCount: number;
  duration: PlannerDuration;
  timeOfDay: PlannerTime;
};
type PreviewPlan = {
  status: "进行中" | "已完成";
  title: string;
  route: string;
  schedule: string;
  media: string;
  progress: number;
  total: number;
  stops: { name: string; time: string; note: string }[];
};

const previewPlans: PreviewPlan[] = [
  { status: "进行中", title: "毕业照 · 4人", route: "主楼 → 凌水湖 → 伯川图书馆", schedule: "周六 16:00 · 2 小时", media: "lake-wide", progress: 2, total: 3, stops: [{ name: "主楼广场", time: "16:00", note: "建筑全景" }, { name: "凌水湖", time: "16:40", note: "日落倒影" }, { name: "伯川图书馆", time: "17:30", note: "建筑线条" }] },
  { status: "已完成", title: "夜景练习 · 个人", route: "凌水湖 → 红桥 → 主楼", schedule: "周五 19:00 · 2 小时", media: "main-building", progress: 3, total: 3, stops: [{ name: "凌水湖", time: "19:00", note: "蓝调时刻" }, { name: "红桥", time: "19:35", note: "水面倒影" }, { name: "主楼", time: "20:10", note: "建筑夜景" }] },
];

const stopAdvice: Record<string, Pick<PlanStop, "position" | "direction" | "light">> = {
  "ling-shui-lake": { position: "湖东侧开阔岸线，镜头贴近草地", direction: "先拍沿湖慢走，再用 85mm 拍逆光侧脸与水面倒影。", light: "17:10 后人物背对夕阳，保留天空高光。" },
  "main-building": { position: "主楼广场中轴偏东，利用台阶形成层次", direction: "24mm 拍建筑与全员，再移到台阶用 50mm 拍半身互动。", light: "正面反差较大，人物脸部朝向开阔天空。" },
  "south-gate": { position: "校名标识外侧，留出入口纵深", direction: "完成标准合影后，拍一组走进校园的连续动作。", light: "上午光线均匀；傍晚避免人物直面低角度强光。" },
  bochuan: { position: "图书馆台阶侧面与长廊交界", direction: "借栏杆做引导线，安排并肩走、回望和自然交谈。", light: "廊下比室外暗一档，优先保证面部曝光。" },
  "first-building": { position: "一馆前台阶下方，镜头略微仰拍", direction: "利用楼梯错落站位，补拍不看镜头的校园日常。", light: "硬光时移入廊下，用门洞框住人物。" },
  "flower-wall": { position: "花墙前约 2 米，避开杂乱枝叶", direction: "用 50mm 拍半身与侧脸，最后抓拍整理衣服的瞬间。", light: "黄金时刻暖色明显，白色服装注意不过曝。" },
};

export default function MobilePlannerClient() {
  const confirmRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<PlannerDraft | null>(null);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cameraSelection, setCameraSelection] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("全部");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("spot") !== "ling-shui-lake") return;
    const position = params.get("cameraPosition");
    const positionName = params.get("cameraPositionName") || "推荐机位";
    if (position) {
      setCameraSelection(positionName);
      setPrompt((current) => current || `想去凌水湖的${positionName}拍照`);
    }
  }, []);

  async function analyze(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setAnalyzing(true);
    const parsed = await parsePlannerRequest(prompt);
    setDraft(parsed);
    setPlan(null);
    setAnalyzing(false);
    window.setTimeout(() => confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function updateDraft<K extends keyof PlannerDraft>(key: K, value: PlannerDraft[K]) {
    if (!draft) return;
    setDraft({ ...draft, [key]: value, uncertainFields: draft.uncertainFields.filter((field) => field !== key) });
  }

  function toggleSpot(id: string) {
    if (!draft) return;
    updateDraft("selectedSpotIds", draft.selectedSpotIds.includes(id) ? draft.selectedSpotIds.filter((item) => item !== id) : [...draft.selectedSpotIds, id]);
  }

  function generatePlan() {
    if (!draft || draft.peopleCount === null) return;
    const fallback = draft.mood === "日落感" || draft.mood === "湖边" ? ["main-building", "ling-shui-lake", "flower-wall"] : draft.mood === "建筑感" ? ["south-gate", "main-building", "first-building"] : ["bochuan", "main-building", "ling-shui-lake"];
    const maxStops = draft.duration === "30 分钟" ? 1 : draft.duration === "1 小时" ? 2 : draft.duration === "2 小时" ? 3 : 5;
    const ids = (draft.selectedSpotIds.length ? draft.selectedSpotIds : fallback).slice(0, maxStops);
    const chosen = ids.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean) as Spot[];
    const startMinutes = draft.timeOfDay === "上午" ? 9 * 60 : draft.timeOfDay === "傍晚" ? 16 * 60 + 20 : 14 * 60;
    const stayMinutes = draft.duration === "30 分钟" ? 25 : draft.duration === "1 小时" ? 25 : 30;
    const stops = chosen.map((spot, index) => {
      const minutes = startMinutes + index * (stayMinutes + 10);
      return {
        spot,
        time: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
        stay: `${stayMinutes} 分钟`,
        ...stopAdvice[spot.id],
        walk: index === 0 ? "集合点" : index === chosen.length - 1 ? "步行约 12 分钟" : "步行约 8 分钟",
      };
    });
    setPlan({ title: `${draft.shootType} · ${draft.peopleCount}人`, summary: `${draft.timeOfDay}，${draft.duration} · ${draft.mood}`, spotIds: ids, stops, shootType: draft.shootType, peopleCount: draft.peopleCount, duration: draft.duration, timeOfDay: draft.timeOfDay });
    setSaved(false);
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function savePlan() {
    if (!plan) return;
    const current = JSON.parse(window.localStorage.getItem("guangying-plans") || "[]") as GeneratedPlan[];
    window.localStorage.setItem("guangying-plans", JSON.stringify([plan, ...current].slice(0, 5)));
    setSaved(true);
  }

  const mapHref = plan ? `/map/?spots=${encodeURIComponent(plan.spotIds.join(","))}&style=${encodeURIComponent(plan.title)}` : "/map/";
  const visiblePreviews = filter === "全部" ? previewPlans : filter === "收藏夹" ? previewPlans.slice(0, 1) : previewPlans.filter((item) => item.status === filter);

  return (
    <main className="gy-kelvin-mobile-planner min-h-screen overflow-x-clip bg-mist pb-24 text-ink lg:pb-12">
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <section id="assistant" className="scroll-mt-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e7f1f1] text-sea"><AppIcon name="sparkles" className="h-[17px] w-[17px]" /></span>
            <div>
              <h1 className="text-[19px] font-semibold">AI 摄影助手</h1>
              <p className="text-[10px] font-medium text-slate-400">描述需求，生成一份可执行路线</p>
            </div>
          </div>
          <Link href="/agent/" className="mb-2.5 flex items-center justify-between rounded-[13px] border border-[#167b75]/25 bg-[#f7fbfa] px-3 py-2 text-[11px] font-semibold text-sea">
            <span>不确定风格？先和风格 Agent 聊一下</span>
            <AppIcon name="arrow" className="h-4 w-4" />
          </Link>
          {cameraSelection ? <div className="mb-2.5 flex items-center gap-2 rounded-[12px] bg-[#e7f1f1] px-3 py-2 text-[11px] font-semibold text-sea"><AppIcon name="camera" className="h-4 w-4" />已带入：凌水湖 · {cameraSelection}</div> : null}
          <form onSubmit={analyze} className="rounded-[16px] border border-slate-200 bg-white p-3 shadow-[0_5px_18px_rgba(15,23,42,.06)]">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} placeholder="我想和 3 个人周六下午拍毕业照，想去主楼和凌水湖……" aria-label="拍摄需求" className="w-full resize-none bg-transparent px-1 text-[14px] leading-6 outline-none placeholder:text-slate-400" />
            <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400"><AppIcon name="location" className="h-3.5 w-3.5" />地点 · 时间 · 人数 · 风格</span>
              <button type="submit" disabled={!prompt.trim() || analyzing} aria-label="理解拍摄需求" className="grid h-9 w-9 place-items-center rounded-full bg-sea text-white disabled:bg-slate-200">
                <AppIcon name={analyzing ? "sparkles" : "send"} className="h-[18px] w-[18px]" />
              </button>
            </div>
          </form>
          <div className="scrollbar-none -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {suggestions.map((item) => <button key={item} type="button" onClick={() => setPrompt(item)} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600">{item}</button>)}
          </div>
        </section>

        {!draft && !plan ? <section className="mt-7"><PlanListHeader filter={filter} setFilter={setFilter} /><div className="mt-3 space-y-4">{visiblePreviews.map((item) => <PreviewPlanCard key={item.title} plan={item} />)}</div></section> : null}

        {draft ? (
          <section ref={confirmRef} className="scroll-mt-4 pt-8">
            <div className="flex items-end justify-between">
              <div><h2 className="text-[19px] font-semibold">需求确认</h2><p className="mt-1 text-[11px] text-slate-400">识别结果可直接修改</p></div>
              <button type="button" onClick={() => { setDraft(null); setPlan(null); }} className="text-[11px] font-semibold text-sea">重新描述</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <SummaryTag value={draft.shootType} uncertain={draft.uncertainFields.includes("shootType")} icon="camera" />
              <SummaryTag value={draft.peopleCount === null ? "人数待确认" : `${draft.peopleCount}人`} uncertain={draft.uncertainFields.includes("peopleCount")} icon="user" />
              <SummaryTag value={draft.duration} uncertain={draft.uncertainFields.includes("duration")} icon="clock" />
              <SummaryTag value={draft.mood} uncertain={draft.uncertainFields.includes("mood")} icon="sun" />
              <SummaryTag value={draft.timeOfDay} uncertain={draft.uncertainFields.includes("timeOfDay")} icon="planner" />
            </div>
            <div className="mt-5 space-y-5 rounded-[16px] border border-slate-200 bg-white p-4">
              <Choice label="拍摄类型" uncertain={draft.uncertainFields.includes("shootType")} options={shootTypes} value={draft.shootType} onChange={(value) => updateDraft("shootType", value)} />
              <label className="block">
                <FieldLabel label="人数" uncertain={draft.uncertainFields.includes("peopleCount")} />
                <input type="number" min={1} max={30} value={draft.peopleCount ?? ""} placeholder="待确认" onChange={(event) => updateDraft("peopleCount", event.target.value ? Number(event.target.value) : null)} className="mt-2 h-10 w-24 rounded-[10px] border border-slate-200 bg-mist px-3 text-[13px] outline-none focus:border-sea" />
              </label>
              <Choice label="可用时间" uncertain={draft.uncertainFields.includes("duration")} options={durations} value={draft.duration} onChange={(value) => updateDraft("duration", value)} />
              <Choice label="拍摄时段" uncertain={draft.uncertainFields.includes("timeOfDay")} options={timeOptions} value={draft.timeOfDay} onChange={(value) => updateDraft("timeOfDay", value)} />
              <Choice label="感觉" uncertain={draft.uncertainFields.includes("mood")} options={moods} value={draft.mood} onChange={(value) => updateDraft("mood", value)} />
              <fieldset>
                <FieldLabel label="想去的地点" uncertain={draft.uncertainFields.includes("selectedSpotIds")} />
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {spots.map((spot) => (
                    <button key={spot.id} type="button" onClick={() => toggleSpot(spot.id)} className={`h-10 rounded-[10px] border px-3 text-left text-[12px] ${draft.selectedSpotIds.includes(spot.id) ? "border-sea bg-[#e7f1f1] font-semibold text-sea" : "border-slate-200 bg-mist text-slate-600"}`}>
                      {spot.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
            <button type="button" onClick={generatePlan} disabled={draft.peopleCount === null} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] bg-sea px-5 py-3.5 text-[13px] font-semibold text-white disabled:bg-slate-300">
              {draft.peopleCount === null ? "请先确认人数" : "生成拍摄规划"}
              <AppIcon name="arrow" className="h-4 w-4" />
            </button>
          </section>
        ) : null}

        {plan ? (
          <section ref={resultRef} className="scroll-mt-4 pt-8">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[20px] font-semibold">我的规划</h2><span className="grid h-8 w-8 place-items-center rounded-[10px] bg-sea text-white"><AppIcon name="plus" className="h-4 w-4" /></span></div>
            <GeneratedPlanCard plan={plan} mapHref={mapHref} saved={saved} onSave={savePlan} onAdjust={() => { setPlan(null); confirmRef.current?.scrollIntoView({ behavior: "smooth" }); }} />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function PlanListHeader({ filter, setFilter }: { filter: Filter; setFilter: (value: Filter) => void }) {
  return (
    <>
      <div className="flex items-center justify-between"><h2 className="text-[20px] font-semibold">我的规划</h2><a href="#assistant" aria-label="新建规划" className="grid h-8 w-8 place-items-center rounded-[10px] bg-sea text-white"><AppIcon name="plus" className="h-4 w-4" /></a></div>
      <div className="mt-3 flex gap-2">{filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${filter === item ? "bg-sea text-white" : "bg-slate-200/70 text-slate-600"}`}>{item}</button>)}</div>
    </>
  );
}

function PreviewPlanCard({ plan }: { plan: PreviewPlan }) {
  const media = getCampusMedia(plan.media);
  return (
    <article className="overflow-hidden rounded-[17px] border border-slate-200 bg-white shadow-[0_5px_18px_rgba(15,23,42,.06)]">
      <div className="relative h-36"><img src={media.src} alt={media.alt} className="h-full w-full object-cover" /><span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold text-white ${plan.status === "进行中" ? "bg-sea" : "bg-ink/75"}`}>{plan.status}</span></div>
      <div className="p-4">
        <h3 className="text-[16px] font-semibold">{plan.title}</h3>
        <p className="mt-1 text-[11px] text-slate-500">{plan.route}</p>
        <div className="mt-2 flex items-center justify-between"><p className="flex items-center gap-1.5 text-[11px] text-slate-500"><AppIcon name="clock" className="h-3.5 w-3.5" />{plan.schedule}</p><span className="text-[10px] font-semibold text-slate-500">{plan.progress}/{plan.total}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-sea" style={{ width: `${plan.progress / plan.total * 100}%` }} /></div>
        <Timeline stops={plan.stops} />
        <Link href="/map/" className="mt-1 flex h-9 items-center justify-center rounded-full border border-slate-200 text-[11px] font-semibold text-sea">查看详情</Link>
      </div>
    </article>
  );
}

function GeneratedPlanCard({ plan, mapHref, saved, onSave, onAdjust }: { plan: GeneratedPlan; mapHref: string; saved: boolean; onSave: () => void; onAdjust: () => void }) {
  const media = getCampusMedia(plan.spotIds.includes("ling-shui-lake") ? "lake-wide" : "main-building");
  return (
    <article className="overflow-hidden rounded-[17px] border border-slate-200 bg-white shadow-[0_5px_18px_rgba(15,23,42,.07)]">
      <div className="relative h-40"><img src={media.src} alt={media.alt} className="h-full w-full object-cover" /><span className="absolute right-3 top-3 rounded-full bg-sea px-3 py-1 text-[10px] font-semibold text-white">进行中</span></div>
      <div className="p-4">
        <h3 className="text-[17px] font-semibold">{plan.title}</h3>
        <p className="mt-1 text-[11px] text-slate-500">{plan.stops.map((stop) => stop.spot.name).join(" → ")}</p>
        <div className="mt-2 flex items-center justify-between"><p className="flex items-center gap-1.5 text-[11px] text-slate-500"><AppIcon name="clock" className="h-3.5 w-3.5" />{plan.summary}</p><span className="text-[10px] font-semibold text-slate-500">1/{plan.stops.length}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-sea" style={{ width: `${100 / plan.stops.length}%` }} /></div>
        <div className="mt-4">
          {plan.stops.map((stop, index) => (
            <div key={stop.spot.id} className="grid grid-cols-[1.25rem_1fr] gap-2.5">
              <div className="flex flex-col items-center"><span className="mt-1 h-2.5 w-2.5 rounded-full border-[3px] border-sea bg-white" />{index < plan.stops.length - 1 ? <span className="my-1 w-px flex-1 bg-slate-200" /> : null}</div>
              <div className="pb-4">
                <div className="flex items-start justify-between gap-2"><div><h4 className="text-[13px] font-semibold">{stop.spot.name}</h4><p className="mt-0.5 text-[10px] text-slate-500">{stop.time} · {stop.stay} · {stop.walk}</p></div><AppIcon name="location" className="h-4 w-4 text-sea" /></div>
                <dl className="mt-2 rounded-[10px] bg-mist px-3"><PlanRow label="机位" value={stop.position} /><PlanRow label="怎么拍" value={stop.direction} /><PlanRow label="光线" value={stop.light} warm /></dl>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-[1fr_auto_auto] gap-2">
          <Link href={mapHref} className="flex h-10 items-center justify-center gap-1.5 rounded-[11px] bg-ink px-3 text-[11px] font-semibold text-white"><AppIcon name="map" className="h-4 w-4" />地图查看</Link>
          <button type="button" onClick={onAdjust} className="rounded-[11px] border border-slate-200 px-3 text-[11px] font-semibold">调整</button>
          <button type="button" onClick={onSave} className={`rounded-[11px] px-3 text-[11px] font-semibold text-white ${saved ? "bg-sea" : "bg-coral"}`}>{saved ? "已保存" : "保存"}</button>
        </div>
      </div>
    </article>
  );
}

function Timeline({ stops }: { stops: PreviewPlan["stops"] }) {
  return <div className="mt-4">{stops.map((stop, index) => <div key={stop.name} className="grid grid-cols-[1.25rem_1fr] gap-2.5"><div className="flex flex-col items-center"><span className="mt-1 h-2.5 w-2.5 rounded-full border-[3px] border-sea bg-white" />{index < stops.length - 1 ? <span className="my-1 w-px flex-1 bg-slate-200" /> : null}</div><div className="pb-3"><h4 className="text-[12px] font-semibold">{stop.name}</h4><p className="mt-0.5 text-[10px] text-slate-500">{stop.time} · {stop.note}</p></div></div>)}</div>;
}

function FieldLabel({ label, uncertain }: { label: string; uncertain: boolean }) {
  return <span className="flex items-center gap-2 text-[12px] font-semibold"><span>{label}</span>{uncertain ? <span className="rounded-full bg-[#fff4df] px-2 py-0.5 text-[9px] font-semibold text-[#b66a00]">待确认</span> : null}</span>;
}

function SummaryTag({ value, uncertain, icon }: { value: string; uncertain: boolean; icon: "camera" | "user" | "clock" | "sun" | "planner" }) {
  return <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${uncertain ? "border border-dashed border-[#e5b660] bg-[#fff9ed] text-[#9a6500]" : "bg-[#e7f1f1] text-sea"}`}><AppIcon name={icon} className="h-3.5 w-3.5" />{value}</span>;
}

function Choice<T extends string>({ label, uncertain, options, value, onChange }: { label: string; uncertain: boolean; options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return <fieldset><FieldLabel label={label} uncertain={uncertain} /><div className="mt-2 flex flex-wrap gap-2">{options.map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${value === option ? "border-sea bg-sea text-white" : "border-slate-200 bg-mist text-slate-600"}`}>{option}</button>)}</div></fieldset>;
}

function PlanRow({ label, value, warm }: { label: string; value: string; warm?: boolean }) {
  return <div className="grid grid-cols-[2.8rem_1fr] gap-2 border-b border-slate-200/70 py-2 last:border-0"><dt className={`text-[10px] font-semibold ${warm ? "text-[#b66a00]" : "text-slate-400"}`}>{label}</dt><dd className="text-[10px] leading-4 text-slate-600">{value}</dd></div>;
}
