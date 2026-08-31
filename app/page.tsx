import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import BottomNav from "@/components/BottomNav";
import HomePhotographers from "@/components/HomePhotographers";
import PhotographySelections from "@/components/PhotographySelections";
import { getHomeDecisionContext, getWeeklyRecommendations } from "@/data/recommendations";
import { getCampusMedia } from "@/data/media";

const guides = [
  { title: "毕业照怎么拍", subtitle: "4 个机位 · 构图技巧", media: "main-building", href: "/route/classic-graduation/" },
  { title: "凌水湖日落攻略", subtitle: "时间 · 机位 · 参数", media: "lake-golden", href: "/route/lingshui-sunset/" },
  { title: "校园建筑摄影", subtitle: "对称 · 线条 · 光影", media: "autumn-light", href: "/route/campus-architecture/" },
  { title: "夜景拍摄", subtitle: "长曝光 · 参数", media: "lake-wide", href: "/route/campus-couple-walk/" },
];

export default function HomePage() {
  const atmosphere = getCampusMedia("autumn-walk");
  const context = getHomeDecisionContext();
  const weekly = getWeeklyRecommendations();

  return <main className="min-h-screen overflow-x-clip bg-mist pb-24 text-ink">
    <div className="mx-auto max-w-6xl pb-10">
      <header className="relative isolate h-[132px] overflow-hidden px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <img src={atmosphere.src} alt="" className="absolute inset-y-0 right-0 -z-20 w-[58%] object-cover object-[68%_34%] opacity-45" />
        <span className="absolute inset-0 -z-10 bg-gradient-to-r from-mist via-mist/95 to-mist/20" />
        <span className="absolute inset-x-0 bottom-0 -z-10 h-14 bg-gradient-to-t from-mist to-transparent" />
        <div className="flex items-center justify-between pt-3"><div><h1 className="text-[25px] font-bold tracking-[.08em]">光影大工</h1><p className="mt-2 flex items-center gap-2 text-[12px] font-medium text-slate-600"><AppIcon name="sun" className="h-4 w-4 text-coral" />今日灵感 · 沿湖岸寻找柔和倒影</p></div><Link href="/me/" aria-label="进入我的" className="overflow-hidden rounded-full border-2 border-white shadow-sm"><img src="/photography/lake-couple.jpg" alt="" className="h-10 w-10 object-cover" /></Link></div>
      </header>

      <div className="px-4 sm:px-8">
        <form action="/map/" className="relative z-10 -mt-3 flex h-14 w-full items-center rounded-[18px] border border-slate-200 bg-white p-1.5 pl-4 shadow-[0_8px_24px_rgba(15,23,42,.09)]"><AppIcon name="search" className="h-5 w-5 shrink-0 text-slate-400" /><input name="search" aria-label="搜索地点、机位、拍摄主题" placeholder="搜索地点、机位、拍摄主题" className="min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-slate-400" /><button type="submit" className="h-11 rounded-[13px] bg-sea px-5 text-[13px] font-semibold text-white">搜索</button></form>

        <section className="mt-4" aria-label="拍摄决策参考">
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5">{context.signals.map((signal) => <article key={signal.id} className="flex h-[66px] w-[126px] shrink-0 items-center gap-2.5 rounded-[15px] border border-slate-200/80 bg-white px-3 shadow-[0_2px_10px_rgba(15,23,42,.035)] lg:w-auto"><span className={`grid h-8 w-8 shrink-0 place-items-center ${signal.tone === "warm" ? "text-[#d67a3f]" : "text-[#155e63]"}`}><AppIcon name={signal.icon} className="h-[22px] w-[22px]" /></span><span className="min-w-0"><span className="block truncate text-[10px] font-semibold text-slate-600">{signal.label}</span><strong className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">{signal.value}</strong><small className="mt-0.5 block truncate text-[8px] text-slate-300">{signal.note}</small></span></article>)}</div>
        </section>

        <ContentSection title="本周值得拍" action="本周推荐" href="/recommendations/">
          <div className="grid h-[270px] grid-cols-[1.4fr_.95fr] grid-rows-2 gap-2.5 lg:h-[360px]">{weekly.sort((a, b) => a.priority - b.priority).map((item, index) => <Link key={item.location} href={item.href} className={`group relative isolate min-h-0 overflow-hidden rounded-[17px] bg-slate-200 shadow-[0_5px_16px_rgba(15,23,42,.11)] ${index === 0 ? "row-span-2" : ""}`}><img src={item.image} alt={item.imageAlt} className="h-full w-full object-cover transition duration-300 group-active:scale-[1.02]" /><span className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/5 to-transparent" /><span className="absolute inset-x-3 bottom-3 text-white"><strong className={`block font-semibold ${index === 0 ? "text-[20px]" : "text-[14px]"}`}>{item.location}</strong><span className={`mt-1 flex items-end justify-between gap-2 ${index === 0 ? "text-[11px]" : "text-[9px] leading-3.5"}`}><span className="line-clamp-2 text-white/85">{item.homeSubtitle}</span><AppIcon name="arrow" className="h-4 w-4 shrink-0" /></span></span></Link>)}</div>
        </ContentSection>

        <div className="lg:grid lg:grid-cols-[1.55fr_1fr] lg:gap-8">
          <ContentSection title="大工摄影精选" action="查看全部" href="/works/"><PhotographySelections /></ContentSection>
          <ContentSection title="摄影师" action="查看全部" href="/photographers/"><HomePhotographers /></ContentSection>
        </div>

        <ContentSection title="摄影攻略" action="查看更多" href="/map/"><div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{guides.map((guide) => { const media = getCampusMedia(guide.media); return <Link key={guide.title} href={guide.href} className="relative isolate aspect-[4/3] w-[58vw] max-w-[250px] shrink-0 overflow-hidden rounded-[14px] bg-slate-200 shadow-sm"><img src={media.src} alt={media.alt} className="h-full w-full object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" /><span className="absolute inset-x-3 bottom-3 text-white"><strong className="block text-[14px] font-semibold">{guide.title}</strong><span className="mt-1 block text-[10px] text-white/80">{guide.subtitle}</span></span></Link>; })}</div></ContentSection>
      </div>
    </div>
    <BottomNav />
  </main>;
}

function ContentSection({ title, action, href, children }: { title: string; action?: string; href?: string; children: React.ReactNode }) {
  return <section className="mt-7"><div className="mb-3 flex items-center justify-between"><h2 className="text-[19px] font-semibold tracking-tight">{title}</h2>{action && href && <Link href={href} className="flex items-center gap-1 text-[11px] font-semibold text-sea">{action}<AppIcon name="arrow" className="h-4 w-4" /></Link>}</div>{children}</section>;
}
