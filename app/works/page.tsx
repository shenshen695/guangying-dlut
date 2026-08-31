import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import BottomNav from "@/components/BottomNav";
import WorksClient from "@/components/WorksClient";

export default function WorksPage() {
  return <main className="min-h-screen overflow-x-clip bg-mist pb-24 text-ink">
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
      <header className="flex items-end justify-between gap-4 py-3"><div><p className="text-[11px] font-semibold tracking-[.16em] text-sea">CAMPUS WORKS</p><h1 className="mt-1 text-[25px] font-bold tracking-tight">大工摄影精选</h1></div><Link href="/photographers/" className="flex items-center gap-1 text-xs font-semibold text-sea">发现摄影师<AppIcon name="arrow" className="h-4 w-4" /></Link></header>
      <section className="mt-5"><WorksClient /></section>
    </div>
    <BottomNav />
  </main>;
}
