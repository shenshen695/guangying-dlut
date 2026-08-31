"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/AppIcon";
import BottomNav from "@/components/BottomNav";
import PrimaryHeader from "@/components/PrimaryHeader";

type AgentResult = {
  status: "locked";
  message: string;
  confirmed_style: string;
  recommendation: {
    color_palette: string[];
    outfit: { top: string; bottom: string; shoes: string; accessory: string };
    scenes: string[];
    shoot_time: string;
    actions: string[];
    style_note: string;
  };
  memory_update?: { people_preference?: string; clothing_mentioned?: string };
};

export default function ResultPage() {
  const [result, setResult] = useState<AgentResult | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem("guangying_style_agent_result") ?? localStorage.getItem("guangying_style_agent_last_result");
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as AgentResult;
      if (parsed.status === "locked" && parsed.recommendation) setResult(parsed);
    } catch {
      setResult(null);
    }
  }, []);

  if (!result) {
    return <main className="min-h-screen bg-mist pb-24 text-ink"><div className="mx-auto max-w-3xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8"><PrimaryHeader className="-mx-4 sm:-mx-8" /><section className="mt-12 rounded-[18px] border border-slate-200 bg-white p-6 text-center shadow-[0_5px_18px_rgba(15,23,42,.06)]"><AppIcon name="sparkles" className="mx-auto h-8 w-8 text-sea" /><h1 className="mt-4 text-[22px] font-bold">还没有锁定风格</h1><p className="mt-2 text-[12px] leading-5 text-slate-500">先和风格 Agent 聊几句，它会把最终推荐带到这里。</p><Link href="/planner/" className="mt-5 inline-flex h-10 items-center gap-2 rounded-[11px] bg-sea px-4 text-[12px] font-semibold text-white"><AppIcon name="sparkles" className="h-4 w-4" />去确定风格</Link></section></div><BottomNav /></main>;
  }

  const { recommendation } = result;

  return (
    <main className="min-h-screen overflow-x-clip bg-mist pb-24 text-ink lg:pb-10">
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8">
        <PrimaryHeader className="-mx-4 sm:-mx-8" right={<Link href="/map/" className="flex items-center gap-1.5 text-[12px] font-semibold text-sea"><AppIcon name="map" className="h-4 w-4" />看地图</Link>} />
        <section className="pt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sea">STYLE LOCKED</p>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight">{result.confirmed_style}</h1>
          <p className="mt-2 text-[12px] leading-5 text-slate-500">{result.message}</p>
          <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-[#e7f1f1] px-3 py-1.5 text-[10px] font-semibold text-sea">{recommendation.shoot_time}</span><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500">{result.memory_update?.people_preference || "人数未提及"}</span><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500">{result.memory_update?.clothing_mentioned || "穿搭未提及"}</span></div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <ResultCard eyebrow="COLOR" title="推荐色彩" icon="sun"><div className="flex flex-wrap gap-2">{recommendation.color_palette.map((color) => <span key={color} className="rounded-full bg-[#e7f1f1] px-3 py-1.5 text-[11px] font-semibold text-sea">{color}</span>)}</div><p className="mt-4 text-[12px] leading-6 text-slate-600">{recommendation.style_note}</p></ResultCard>
          <ResultCard eyebrow="OUTFIT" title="AI 穿搭组合" icon="camera"><dl className="space-y-3">{[["上装", recommendation.outfit.top], ["下装", recommendation.outfit.bottom], ["鞋子", recommendation.outfit.shoes], ["配饰", recommendation.outfit.accessory]].map(([label, value]) => <div key={label} className="grid grid-cols-[42px_1fr] gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0"><dt className="text-[10px] font-semibold text-slate-400">{label}</dt><dd className="text-[12px] leading-5 text-slate-600">{value}</dd></div>)}</dl></ResultCard>
          <ResultCard eyebrow="SCENES" title="推荐点位" icon="location"><ul className="space-y-2 text-[12px] text-slate-600">{recommendation.scenes.map((scene) => <li key={scene} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-sea" />{scene}</li>)}</ul></ResultCard>
          <ResultCard eyebrow="ACTIONS" title="动作建议" icon="sparkles"><ul className="space-y-2 text-[12px] text-slate-600">{recommendation.actions.map((action) => <li key={action} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-coral" />{action}</li>)}</ul></ResultCard>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-2"><Link href="/map/" className="flex h-11 items-center justify-center gap-2 rounded-[12px] bg-sea text-[12px] font-semibold text-white"><AppIcon name="map" className="h-4 w-4" />查看校园地图</Link><Link href="/planner/" className="flex h-11 items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white text-[12px] font-semibold text-slate-600"><AppIcon name="rotate" className="h-4 w-4" />重新确定</Link></div>
      </div>
      <BottomNav />
    </main>
  );
}

function ResultCard({ eyebrow, title, icon, children }: { eyebrow: string; title: string; icon: "sun" | "camera" | "location" | "sparkles"; children: React.ReactNode }) {
  return <article className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,.05)]"><div className="flex items-start justify-between gap-2"><div><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p><h2 className="mt-1 text-[16px] font-bold">{title}</h2></div><AppIcon name={icon} className="h-4 w-4 text-sea" /></div><div className="mt-4">{children}</div></article>;
}
