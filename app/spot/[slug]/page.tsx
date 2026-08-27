import Link from "next/link";
import { notFound } from "next/navigation";
import routesData from "@/data/routes.json";
import spotsData from "@/data/spots.json";
import type { Route } from "@/types/route";
import type { Spot } from "@/types/spot";

const routes = routesData as Route[];
const spots = spotsData as Spot[];

export function generateStaticParams() {
  return spots.map((spot) => ({ slug: spot.slug }));
}

export default function SpotDetailPage({ params }: { params: { slug: string } }) {
  const spot = spots.find((item) => item.slug === params.slug);
  if (!spot) notFound();
  const route = routes.find((item) => item.spots.includes(spot.id));
  const hasPhotos = Boolean(spot.images?.length);

  return <main className="min-h-screen bg-mist"><div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
    <header className="flex items-center justify-between border-b border-ink/10 pb-5"><Link href="/" className="text-sm font-bold tracking-[.18em] text-ink">光影大工</Link><Link href="/map?route=classic-graduation" className="text-sm text-slate-500 hover:text-sea">Q版校园摄影地图 →</Link></header>
    <section className="pb-10 pt-14 sm:pt-20"><p className="text-[11px] font-semibold tracking-[.2em] text-sea">SPOT / {spot.area}</p><div className="mt-4 flex flex-wrap items-end justify-between gap-4"><h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-6xl">{spot.name}</h1><span className="rounded-full border border-coral/35 bg-[#fffaf7] px-3 py-1.5 text-xs text-coral">{hasPhotos ? `${spot.images!.length} 张机位样片` : "样片待补充"}</span></div><p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">{spot.description}</p></section>
    <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div className="space-y-6">
      {hasPhotos ? <div className={`grid gap-3 ${spot.images!.length > 1 ? "sm:grid-cols-2" : ""}`}>{spot.images!.map((image, index) => <figure key={image.src} className={`overflow-hidden rounded-[1.75rem] border border-ink/8 bg-white ${index === 0 && spot.images!.length > 1 ? "sm:col-span-2" : ""}`}><img src={image.src} alt={image.alt} className="aspect-[16/10] w-full object-cover" /><figcaption className="px-4 py-3 text-xs text-slate-500">{image.caption || `${spot.name}机位样片`}</figcaption></figure>)}</div> : <div className="relative grid min-h-[360px] place-items-center overflow-hidden rounded-[1.75rem] border border-ink/8 bg-[#e7eeea] p-8 text-center"><div className="absolute inset-8 rounded-[1.25rem] border border-dashed border-sea/35" /><div className="relative"><p className="text-sm font-semibold text-ink">真实摄影作品待补充</p><p className="mt-2 text-xs leading-5 text-slate-500">{spot.photoPlaceholder}</p></div></div>}
      <div className="rounded-[1.5rem] border border-ink/8 bg-white/70 p-6 sm:p-7"><p className="text-[11px] font-semibold tracking-[.2em] text-sea">SHOOTING NOTE</p><h2 className="mt-2 text-xl font-semibold text-ink">拍摄建议</h2><p className="mt-3 text-sm leading-7 text-slate-600">{spot.shootingTips}</p></div>
    </div><aside className="space-y-4"><div className="rounded-[1.5rem] border border-ink/8 bg-white/70 p-6 sm:p-7"><p className="text-[11px] font-semibold tracking-[.2em] text-sea">FIELD NOTES</p><h2 className="mt-2 text-xl font-semibold text-ink">摄影攻略</h2><dl className="mt-6 space-y-5 text-sm"><div className="flex justify-between gap-4 border-b border-ink/8 pb-4"><dt className="text-slate-400">所属区域</dt><dd className="text-right font-medium text-ink">{spot.area}</dd></div><div className="flex justify-between gap-4 border-b border-ink/8 pb-4"><dt className="text-slate-400">最佳拍摄时间</dt><dd className="text-right font-medium text-ink">{spot.bestTime}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-400">人流程度</dt><dd className="text-right font-medium text-ink">{spot.crowdLevel}</dd></div></dl></div><div className="rounded-[1.5rem] bg-ink p-6 text-white sm:p-7"><p className="text-[10px] tracking-[.2em] text-white/45">MAP LOCATION</p><h2 className="mt-3 text-lg font-semibold">Q版地图位置</h2><div className="mt-4 flex items-center gap-3 text-sm text-white/75"><span className="grid h-9 w-9 place-items-center rounded-full bg-coral text-white">{spot.name.slice(0, 1)}</span><span>路线第 {route ? route.spots.indexOf(spot.id) + 1 : "—"} 站<br /><span className="text-xs text-white/45">点位用于摄影路线示意</span></span></div><Link href={`/map?route=classic-graduation&spot=${spot.id}`} className="mt-6 inline-flex rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink">在地图中定位</Link></div></aside></section>
    <section className="mt-8 flex flex-wrap gap-3"><Link href={route ? `/route/${route.slug}` : "/route/classic-graduation"} className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white hover:bg-ink">查看工大经典毕业线 →</Link><p className="self-center text-xs text-slate-400">正式上线前请再次确认作品版权与出镜人肖像授权。</p></section>
  </div></main>;
}
