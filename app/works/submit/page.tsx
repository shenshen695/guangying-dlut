import { Suspense } from "react";
import WorkSubmitClient from "@/components/WorkSubmitClient";

export default function WorkSubmitPage() {
  return (
    <Suspense fallback={<main className="gy-page"><div className="gy-container">作品上传加载中...</div></main>}>
      <WorkSubmitClient />
    </Suspense>
  );
}
