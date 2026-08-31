import BottomNav from "@/components/BottomNav";
import PhotographersClient from "@/components/PhotographersClient";

export default function PhotographersPage() {
  return <main className="min-h-screen overflow-x-clip bg-mist pb-24 text-ink"><div className="mx-auto max-w-5xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8"><PhotographersClient /></div><BottomNav /></main>;
}
