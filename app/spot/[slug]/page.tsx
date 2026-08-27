import Link from "next/link";
import { notFound } from "next/navigation";
import photographersData from "@/data/photographers.json";
import routesData from "@/data/routes.json";
import spotsData from "@/data/spots.json";
import type { Photographer } from "@/types/photographer";
import type { Route } from "@/types/route";
import type { Spot } from "@/types/spot";
import { CoralRule, Eyebrow, Field, PageShell, Pill } from "@/components/guangying-ui";

const spots = spotsData as Spot[];
const routes = routesData as Route[];
const photographers = photographersData as Photographer[];

export function generateStaticParams() {
  return spots.map((spot) => ({ slug: spot.slug }));
}

export default function SpotDetailPage({ params }: { params: { slug: string } }) {
  const spot = spots.find((item) => item.slug === params.slug);
  if (!spot) notFound();
  const relatedRoute = routes.find((route) => route.spots.includes(spot.id)) || routes[0];
  const familiarPhotographers = photographers
    .filter((photographer) => photographer.familiarSpots.some((name) => name === spot.shortName || name === spot.name))
    .slice(0, 3);

  return (
    <PageShell active="地图" actionLabel="返回地图" actionHref={`/map?spot=${spot.id}`}>
      <section className="gy-spot-layout">
        <div>
          <div className="gy-photo-stack">
            {spot.referenceImages.slice(0, 2).map((image, index) => (
              <img key={image} src={image} alt={`${spot.name}参考成片 ${index + 1}`} />
            ))}
          </div>
          <section className="gy-bottom-panels">
            <div className="gy-panel">
              <h2>拍摄技巧</h2>
              <ul className="gy-list">
                <li>1. {spot.shootingTips}</li>
                <li>2. 机位：{spot.cameraPosition}</li>
                <li>3. 动作：{spot.actionSuggestion}</li>
              </ul>
            </div>
            <div className="gy-panel">
              <h2>关联路线</h2>
              <div className="gy-pill-row">
                <Pill active>{relatedRoute.name}</Pill>
                <Pill>{spot.routeRole}</Pill>
              </div>
              <Link href={`/route/${relatedRoute.slug}`} style={{ color: "var(--teal)", display: "inline-flex", marginTop: 18, fontSize: 14 }}>查看路线 →</Link>
            </div>
            <div className="gy-panel">
              <h2>熟悉此点位的摄影者</h2>
              <div className="gy-photographer-links">
                {familiarPhotographers.map((photographer) => (
                  <Link key={photographer.slug} href={`/photographers/${photographer.slug}`}>
                    <strong>{photographer.name}</strong>
                    <span>{photographer.identity} · {photographer.styles[0]}</span>
                  </Link>
                ))}
              </div>
              <Link href="/photographers" style={{ color: "var(--teal)", display: "inline-flex", marginTop: 18, fontSize: 14 }}>查看全部摄影者 →</Link>
            </div>
          </section>
        </div>

        <div>
          <Eyebrow>SPOT KNOWLEDGE CARD</Eyebrow>
          <h1 className="gy-page-title">{spot.name}知识卡</h1>
          <CoralRule />
          <p className="gy-body-copy">{spot.description}</p>
          <div className="gy-pill-row">
            {spot.seasons.map((season, index) => <Pill key={season} active={index === 0}>{season}</Pill>)}
            <Pill>{spot.tags[1] || "学院纪实"}</Pill>
            <Pill>{spot.verified ? "已验证点位" : "待确认"}</Pill>
          </div>
          <section className="gy-field-grid">
            <Field label="建议时间" value={spot.bestTime} />
            <Field label="太阳方向" value={spot.sunDirection} />
            <Field label="推荐焦段" value={spot.focalLength} />
            <Field label="机位位置" value={spot.cameraPosition} />
            <Field label="动作建议" value={spot.actionSuggestion} />
            <Field label="拥挤度" value={spot.crowdLevel} />
          </section>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 34 }}>
            <Link href={`/map?spot=${spot.id}`} className="gy-primary-button">返回地图</Link>
            <Link href={familiarPhotographers[0] ? `/photographers/${familiarPhotographers[0].slug}` : "/photographers"} className="gy-secondary-button">查看熟悉摄影者</Link>
            <Link href={`/works/submit?spot=${spot.slug}&route=${relatedRoute.slug}`} className="gy-secondary-button">上传这个点位的作品</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
