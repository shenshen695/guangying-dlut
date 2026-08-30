import Link from "next/link";
import { CoralRule, Eyebrow, IllustratedMap, PageShell, RouteSummaryStrip, SeasonCard, seasons } from "@/components/guangying-ui";

export default function HomePage() {
  return (
    <PageShell active="主页" actionLabel="生成路线" actionHref="/planner" containerClassName="gy-home-container">
      <section className="gy-home-layout">
        <div className="gy-home-intro">
          <Eyebrow>四季入口</Eyebrow>
          <h1 className="gy-hero-title">先选毕业季节，再生成校园路线</h1>
          <CoralRule />
          <p className="gy-body-copy">把大工熟悉的机位、光线和路线，整理成一份真正拍得了的毕业照计划。</p>
          <div className="gy-season-grid">
            {seasons.map((season, index) => (
              <SeasonCard key={season.name} season={season} active={index === 0} />
            ))}
          </div>
        </div>
        <IllustratedMap selectedSlug="south-gate" />
      </section>
      <RouteSummaryStrip title="春日花阶企划" />
      <p className="gy-home-footnote">
        路线与机位来自学生共建贡献　
        <Link href="/contribute" style={{ color: "var(--teal)" }}>
          了解共建计划 ↗
        </Link>
      </p>
    </PageShell>
  );
}
