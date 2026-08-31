import { Suspense } from "react";
import MapPageClient from "@/components/MapPageClient";

export default function MapPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-mist text-sm text-slate-500">路线加载中…</div>}><MapPageClient /></Suspense>;
}
