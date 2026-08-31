import BottomNav from "@/components/BottomNav";
import PhotographerApplicationClient from "@/components/PhotographerApplicationClient";

export default function PhotographerApplyPage() {
  return <main className="min-h-screen overflow-x-clip bg-mist pb-24 text-ink"><div className="mx-auto max-w-3xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8"><PhotographerApplicationClient /></div><BottomNav /></main>;
}
