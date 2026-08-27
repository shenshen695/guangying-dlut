"use client";

import type { MapSpot } from "@/types/map-spot";

type MapSpotCardProps = { spot: MapSpot; index: number; selected?: boolean; onSelect: () => void };

export default function MapSpotCard({ spot, index, selected, onSelect }: MapSpotCardProps) {
  return <button onClick={onSelect} className={selected ? "gy-map-spot-card is-selected" : "gy-map-spot-card"} aria-pressed={selected}>
    {spot.images?.[0] && <div className="gy-map-spot-image"><img src={spot.images[0].src} alt={spot.images[0].alt} loading="lazy" /></div>}
    <div className="gy-map-spot-head">
      <span className="gy-map-spot-index">{spot.featured ? "★" : String(index + 1).padStart(2, "0")}</span>
      <div>
        <p>{spot.featured ? "推荐地标 · " : ""}{spot.area}</p>
        <h3>{spot.name}</h3>
        {spot.seasonNote && <strong>{spot.seasonNote}</strong>}
      </div>
      <i aria-hidden>↗</i>
    </div>
    <p className="gy-map-spot-desc">{spot.description}</p>
    <div className="gy-map-spot-fields">
      <div><span>最佳时间</span><b>{spot.bestTime}</b></div>
      <div><span>人流</span><b>{spot.crowdLevel}</b></div>
    </div>
    <p className="gy-map-spot-tip"><span>拍摄建议</span>{spot.shootingTips}</p>
    <p className="gy-map-spot-action">点击地图查看位置 →</p>
  </button>;
}
