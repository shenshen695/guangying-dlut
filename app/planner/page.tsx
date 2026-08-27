import { Suspense } from "react";
import PlannerClient from "@/components/PlannerClient";

export default function PlannerPage() {
  return (
    <Suspense fallback={<main className="gy-page"><div className="gy-container">企划加载中...</div></main>}>
      <PlannerClient />
    </Suspense>
  );
}
