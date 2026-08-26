"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import spotsData from "@/data/spots.json";
import { buildShootingPlan } from "@/lib/planner/buildPlan";
import type { PlannerInput, ShootingPlan, StyleReference, TimeSlot, WalkingTolerance } from "@/types/planner";
import type { Spot } from "@/types/spot";

const styles: StyleReference[] = ["海风清透", "学院纪实", "复古胶片", "电影氛围"];
const spots = spotsData as Spot[];

export default function PlannerPage() {
  const [input, setInput] = useState<PlannerInput>({
    styleReference: null,
    peopleCount: 1,
    shootDate: "",
    timeSlot: "golden_hour",
    hasAcademicGown: true,
    dressingColor: "白色内搭",
    indoorBackupNeeded: false,
    walkingTolerance: "medium",
  });
  const [plan, setPlan] = useState<ShootingPlan | null>(null);
  const selectedNames = useMemo(() => plan?.selectedSpotIds.map((id) => spots.find((spot) => spot.id === id)?.name).filter(Boolean) || [], [plan]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setPlan(buildShootingPlan(input, spots));
  }

  const mapHref = plan ? `/map?spots=${encodeURIComponent(plan.selectedSpotIds.join(","))}&style=${encodeURIComponent(plan.style)}` : "/map";

  return <main className="min-h-screen bg-mist"><div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
    <header className="flex items-center justify-between border-b border-ink/10 pb-5"><Link href="/" className="text-sm font-bold tracking-[.18em] text-ink">光影大工</Link><span className="text-xs text-slate-500">毕业照企划生成器</span></header>
    <section className="grid gap-8 py-12 lg:grid-cols-[.9fr_1.1fr] lg:py-16">
      <div><p className="text-[11px] font-semibold tracking-[.24em] text-sea">SHOOTING PLANNER</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">先选效果，再生成路线</h1><p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">当前演示使用真实点位规则匹配，不会编造地点；后续接入模型时仍沿用同一输入和输出结构。</p>
        <form onSubmit={submit} className="mt-8 space-y-6 rounded-[1.75rem] border border-ink/10 bg-white/70 p-5 sm:p-7">
          <fieldset><legend className="text-sm font-semibold text-ink">想要的照片风格</legend><div className="mt-3 grid grid-cols-2 gap-2">{styles.map((style) => <button key={style} type="button" onClick={() => setInput({ ...input, styleReference: input.styleReference === style ? null : style })} className={`rounded-xl border px-3 py-3 text-sm transition ${input.styleReference === style ? "border-coral bg-[#fff4ef] text-ink" : "border-ink/10 bg-white text-slate-600 hover:border-sea"}`}>{style}</button>)}</div><button type="button" onClick={() => setInput({ ...input, styleReference: null })} className="mt-2 text-xs text-slate-400 hover:text-sea">不确定，让系统推荐</button></fieldset>
          <div className="grid grid-cols-2 gap-4"><label className="text-sm text-slate-600">人数<input type="number" min={1} max={20} value={input.peopleCount} onChange={(event) => setInput({ ...input, peopleCount: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-ink" /></label><label className="text-sm text-slate-600">拍摄日期<input type="date" value={input.shootDate} onChange={(event) => setInput({ ...input, shootDate: event.target.value })} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-ink" /></label></div>
          <div className="grid grid-cols-2 gap-4"><label className="text-sm text-slate-600">时间<select value={input.timeSlot} onChange={(event) => setInput({ ...input, timeSlot: event.target.value as TimeSlot })} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-ink"><option value="morning">上午</option><option value="afternoon">下午</option><option value="golden_hour">黄金时刻</option><option value="evening">傍晚</option></select></label><label className="text-sm text-slate-600">步行接受度<select value={input.walkingTolerance} onChange={(event) => setInput({ ...input, walkingTolerance: event.target.value as WalkingTolerance })} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-ink"><option value="short">短</option><option value="medium">中</option><option value="long">长</option></select></label></div>
          <label className="block text-sm text-slate-600">服装颜色<input value={input.dressingColor} onChange={(event) => setInput({ ...input, dressingColor: event.target.value })} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-ink" /></label>
          <div className="flex flex-wrap gap-5 text-sm text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" checked={input.hasAcademicGown} onChange={(event) => setInput({ ...input, hasAcademicGown: event.target.checked })} />穿学士服</label><label className="flex items-center gap-2"><input type="checkbox" checked={input.indoorBackupNeeded} onChange={(event) => setInput({ ...input, indoorBackupNeeded: event.target.checked })} />需要室内备选</label></div>
          <button type="submit" className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-sea">生成我的毕业影像路线</button>
        </form>
      </div>
      <div className="lg:pt-16">{plan ? <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 shadow-[0_18px_60px_rgba(22,32,42,.08)] sm:p-8"><p className="text-[11px] font-semibold tracking-[.22em] text-coral">YOUR SHOOTING PLAN</p><h2 className="mt-3 text-3xl font-semibold text-ink">{plan.style}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{plan.styleReason}</p><div className="mt-6"><p className="text-xs font-semibold text-slate-400">推荐路线</p><div className="mt-3 flex flex-wrap gap-2">{selectedNames.map((name, index) => <span key={name} className="rounded-full bg-mist px-3 py-2 text-sm text-ink">{index + 1}. {name}</span>)}</div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><div><p className="text-xs font-semibold text-slate-400">配色</p><p className="mt-2 text-sm text-slate-600">{plan.colorPalette.join(" / ")}</p></div><div><p className="text-xs font-semibold text-slate-400">服装</p><p className="mt-2 text-sm text-slate-600">{plan.outfit.inner} · {plan.outfit.shoes}</p></div></div><div className="mt-6"><p className="text-xs font-semibold text-slate-400">Shot List</p><ul className="mt-2 space-y-2 text-sm text-slate-600">{plan.actions.map((action) => <li key={action}>— {action}</li>)}</ul></div><p className="mt-6 rounded-2xl bg-[#fff8f3] p-4 text-xs leading-6 text-slate-500">{plan.notice}</p><Link href={mapHref} className="mt-6 inline-flex rounded-full bg-coral px-6 py-3.5 text-sm font-semibold text-white hover:bg-ink">在地图中查看这条路线 →</Link></section> : <div className="grid min-h-[420px] place-items-center rounded-[1.75rem] border border-dashed border-ink/15 bg-white/40 p-8 text-center"><div><p className="text-4xl text-coral">◎</p><p className="mt-4 text-sm text-slate-500">填写左侧条件后，这里会生成配色、穿搭、Shot List 和真实点位路线。</p></div></div>}</div>
    </section>
  </div></main>;
}
