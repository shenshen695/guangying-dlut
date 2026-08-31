import BottomNav from "@/components/BottomNav";
import RecommendationsClient from "@/components/RecommendationsClient";

export default function RecommendationsPage() {
  return <main className="min-h-screen overflow-x-clip bg-mist pb-24 text-ink"><div className="mx-auto max-w-3xl px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8"><header className="py-3"><h1 className="text-[24px] font-bold tracking-tight">本周推荐</h1><p className="mt-1.5 text-xs text-slate-500">结合天气与月相，为你推荐最佳拍摄地</p></header><section className="mt-4"><RecommendationsClient /></section></div><BottomNav /></main>;
}
