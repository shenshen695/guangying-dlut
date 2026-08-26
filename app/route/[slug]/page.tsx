import Link from "next/link";
import { notFound } from "next/navigation";
import routesData from "@/data/routes.json";
import spotsData from "@/data/spots.json";
import type { Route } from "@/types/route";
import type { Spot } from "@/types/spot";

const routes = routesData as Route[];
const spots = spotsData as Spot[];

export function generateStaticParams() {
  return routes.map((route) => ({ slug: route.slug }));
}

export default function RouteDetailPage({ params }: { params: { slug: string } }) {
  const route = routes.find((item) => item.slug === params.slug);
  if (!route) notFound();
  const routeSpots = route.spots.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean) as Spot[];
  return <main className="min-h-screen bg-mist"><div className="mx-auto max-w-5xl px-5 py-7 sm:px-8 lg:px-12 lg:py-10"><header className="flex items-center justify-between border-b border-ink/10 pb-5"><Link href="/" className="text-sm font-bold tracking-[.18em] text-ink">光影大工</Link><Link href="/map?route=classic-graduation" className="text-sm text-slate-500 hover:text-sea">返回地图 →</Link></header>
    <section className="pb-12 pt-16 sm:pb-16 sm:pt-24"><p className="text-[11px] font-semibold tracking-[.24em] text-sea">GRADUATION ROUTE / 01</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.03em] text-ink sm:text-6xl">{route.name}</h1><p className="mt-4 text-lg text-slate-600">{route.subtitle}</p><div className="mt-7 flex flex-wrap gap-3 text-xs text-slate-600"><span className="rounded-full border border-ink/8 bg-white px-4 py-2">预计拍摄时间　{route.duration}</span><span className="rounded-full border border-ink/8 bg-white px-4 py-2">{route.walkingDistance}</span><span className="rounded-full border border-ink/8 bg-white px-4 py-2">{routeSpots.length} 个摄影点</span></div><p className="mt-5 text-sm text-slate-500">推荐拍摄时间：{route.recommendedTime}</p></section>
    <section className="rounded-[1.75rem] border border-ink/8 bg-white/70 p-5 sm:p-8"><div className="mb-8 flex items-end justify-between"><div><p className="text-[11px] font-semibold tracking-[.2em] text-sea">THE SEQUENCE</p><h2 className="mt-2 text-xl font-semibold text-ink">六站，拍完工大的春天</h2></div><span className="text-xs text-slate-400">摄影顺序示意</span></div><div>{routeSpots.map((spot, index) => <div key={spot.id} className="flex items-stretch gap-4"><div className="flex w-8 shrink-0 flex-col items-center"><span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[10px] font-bold text-white">{String(index + 1).padStart(2, "0")}</span>{index < routeSpots.length - 1 && <span className="my-1 w-px flex-1 bg-coral/45" />}</div><Link href={`/spot/${spot.slug}`} className="mb-5 flex-1 rounded-2xl border border-black/6 bg-white/70 p-4 transition hover:border-coral/45 hover:bg-[#fffaf7] sm:p-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><div><p className="text-[11px] font-semibold tracking-wide text-sea">{spot.area}</p><h3 className="mt-1 text-lg font-semibold text-ink">{spot.name}</h3></div><span className="text-xs text-slate-400">{spot.bestTime}</span></div><p className="mt-3 text-sm leading-6 text-slate-500">{spot.description}</p></Link></div>)}</div><div className="mt-2 flex flex-wrap items-center gap-4"><Link href="/map?route=classic-graduation" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-sea">在地图中查看路线</Link><span className="text-xs text-slate-400">路线为摄影顺序示意，不代表精确步行导航。</span></div></section>
    <p className="mt-7 text-center text-xs leading-5 text-slate-400">当前点位坐标为 Demo 初始值，具体摄影机位可由摄影师后续更新。</p>
  </div></main>;
}
