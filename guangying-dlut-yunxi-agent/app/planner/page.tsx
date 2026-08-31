import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import BottomNav from "@/components/BottomNav";
import ChatAgent from "@/components/ChatAgent";
import PrimaryHeader from "@/components/PrimaryHeader";

export default function PlannerPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-mist pb-24 text-ink lg:pb-10">
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8">
        <PrimaryHeader className="-mx-4 sm:-mx-8" right={<Link href="/map/" className="flex items-center gap-1.5 text-[12px] font-semibold text-sea"><AppIcon name="map" className="h-4 w-4" />看地图</Link>} />

        <section className="pt-8">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7f1f1] text-sea"><AppIcon name="sparkles" className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">STYLE AGENT</p>
              <h1 className="mt-1 text-[25px] font-bold tracking-tight sm:text-[28px]">和 Agent 聊出你的毕业照风格</h1>
              <p className="mt-2 max-w-xl text-[12px] leading-5 text-slate-500">不用在风格卡里反复比较，直接说说你想要的画面、人数、衣服和校园记忆。</p>
            </div>
          </div>
        </section>

        <ChatAgent />

        <section className="mt-8 border-t border-slate-200 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">AVAILABLE DIRECTIONS</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["青春清透", "明亮、轻盈、自然光"],
              ["学院风制服", "整齐、青春、校园感"],
              ["端庄复古", "安静、温婉、故事感"],
              ["学位纪实", "真实、自然、不做作"],
            ].map(([title, detail]) => <div key={title} className="rounded-[12px] border border-slate-200 bg-white px-3 py-3"><p className="text-[12px] font-semibold text-ink">{title}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p></div>)}
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}
