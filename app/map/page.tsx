import { Suspense } from "react";
import MapPageClient from "@/components/MapPageClient";
import MobileMapPageClient from "@/components/MobileMapPageClient";

export default function MapPage() {
  return (
    <Suspense fallback={<main className="gy-page"><div className="gy-map-page-fallback">路线加载中...</div></main>}>
      <div className="gy-map-desktop">
        <MapPageClient />
      </div>
      <MobileMapPageClient />
    </Suspense>
  );
}
