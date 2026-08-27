import { Suspense } from "react";
import MapPageClient from "@/components/MapPageClient";

export default function MapPage() {
  return (
    <Suspense fallback={<main className="gy-page"><div className="gy-container">地图加载中...</div></main>}>
      <MapPageClient />
    </Suspense>
  );
}
