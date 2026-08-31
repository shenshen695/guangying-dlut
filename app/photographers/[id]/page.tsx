import { notFound } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import PhotographerProfileClient from "@/components/PhotographerProfileClient";
import { getPhotographer, photographers } from "@/data/photographers";

export function generateStaticParams() { return photographers.map((photographer) => ({ id: photographer.id })); }

export default function PhotographerProfilePage({ params }: { params: { id: string } }) {
  const photographer = getPhotographer(params.id);
  if (!photographer) notFound();
  return <main className="min-h-screen overflow-x-clip bg-mist pb-24 text-ink"><div className="mx-auto max-w-4xl px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8"><PhotographerProfileClient photographer={photographer} /></div><BottomNav /></main>;
}
