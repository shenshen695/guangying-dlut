import Link from "next/link";
import { notFound } from "next/navigation";
import photographersData from "@/data/photographers.json";
import routesData from "@/data/routes.json";
import spotsData from "@/data/spots.json";
import type { Photographer } from "@/types/photographer";
import type { Route } from "@/types/route";
import type { Spot } from "@/types/spot";
import { CoralRule, Eyebrow, IllustratedMap, PageShell, Pill } from "@/components/guangying-ui";

const routes = routesData as Route[];
const spots = spotsData as Spot[];
const photographers = photographersData as Photographer[];

export function generateStaticParams() {
  return routes.map((route) => ({ slug: route.slug }));
}

export default function RouteDetailPage({ params }: { params: { slug: string } }) {
  const route = routes.find((item) => item.slug === params.slug);
  if (!route) notFound();
  const routeSpots = route.spots.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean) as Spot[];
  const firstSpot = routeSpots[0];
  const routeMapHref = `/map?route=${route.slug}`;
  const plannerHref = `/planner`;
  const recommendedPhotographers = photographers
    .filter((photographer) => (
      photographer.familiarRoutes.some((name) => route.name.includes(name.replace("线", "")) || name.includes(route.name.replace("毕业线", "线"))) ||
      photographer.familiarSpots.some((name) => routeSpots.some((spot) => spot.shortName === name || spot.name === name))
    ))
    .slice(0, 4);

  return (
    <PageShell active="企划" actionLabel="加入路线" actionHref={plannerHref}>
      <section className="gy-route-hero">
        <div>
          <Eyebrow muted>ROUTE DETAIL</Eyebrow>
          <h1 className="gy-page-title">{route.name}</h1>
          <CoralRule />
          <p className="gy-body-copy">{route.subtitle}。路线点位均来自已收录的校园机位，可直接进入地图查看。</p>
          <div className="gy-pill-row">
            <Pill active>春</Pill>
            <Pill>清透</Pill>
            <Pill>学院纪实</Pill>
            <Pill>{routeSpots.length} 个点位</Pill>
          </div>
          <div className="gy-map-detail-actions" style={{ marginTop: 28 }}>
            <Link href={routeMapHref} className="gy-primary-button">在地图中查看</Link>
            <Link href={plannerHref} className="gy-secondary-button">用此路线生成企划</Link>
            <Link href={`/works/submit?route=${route.slug}`} className="gy-secondary-button">上传这条路线作品</Link>
          </div>
        </div>
        <IllustratedMap selectedSlug={firstSpot?.slug || "south-gate"} compact />
      </section>

      <section className="gy-route-overview gy-panel">
        <img src="/images/spot-library/伯川前二月兰.jpg" alt={`${route.name}路线封面`} />
        <div>
          <Eyebrow>路线总览</Eyebrow>
          <h2>{route.name}</h2>
          <p>{route.recommendedTime}</p>
          <div className="gy-route-stats">
            <span>总距离：{route.walkingDistance}</span>
            <span>预计时长：{route.duration}</span>
            <span>点位：{routeSpots.map((spot) => spot.shortName).join("、")}</span>
          </div>
        </div>
      </section>

      <section className="gy-route-detail-grid">
        <div className="gy-panel gy-route-timeline">
          <h2>点位时间线</h2>
          {routeSpots.map((spot, index) => (
            <Link key={spot.id} href={`/spot/${spot.slug}`} className="gy-timeline-row">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{spot.bestTime}　{spot.name}</strong>
                <p>{spot.actionSuggestion}</p>
              </div>
            </Link>
          ))}
        </div>

        <aside className="gy-panel gy-route-tips">
          <h2>每站拍摄建议</h2>
          <ul className="gy-list">
            {routeSpots.slice(0, 5).map((spot) => (
              <li key={spot.id}><strong>{spot.shortName}</strong>　{spot.shootingTips}</li>
            ))}
          </ul>
          <h2 style={{ marginTop: 28 }}>关联摄影者</h2>
          <div className="gy-photographer-links">
            {recommendedPhotographers.map((photographer) => (
              <Link key={photographer.slug} href={`/photographers/${photographer.slug}`}>
                <strong>{photographer.name}</strong>
                <span>{photographer.identity} · {photographer.styles[0]}</span>
              </Link>
            ))}
          </div>
          <div className="gy-map-detail-actions" style={{ marginTop: 20 }}>
            <Link href="/photographers" className="gy-secondary-button">查看摄影者</Link>
            <Link href={plannerHref} className="gy-primary-button">加入路线</Link>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
