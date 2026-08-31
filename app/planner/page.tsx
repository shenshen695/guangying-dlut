import { Suspense } from "react";
import PlannerClient from "@/components/PlannerClient";
import MobilePlannerClient from "@/components/MobilePlannerClient";

export default function PlannerPage() {
  return (
    <Suspense fallback={<main className="gy-page"><div className="gy-container">企划加载中...</div></main>}>
      <div className="gy-planner-desktop">
        <PlannerClient />
      </div>
      <MobilePlannerClient />
    </Suspense>
  );
}
