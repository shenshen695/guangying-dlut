import type { StyleReference } from "@/types/planner";
import type { Season } from "@/types/spot";

export type WorkReviewStatus = "待审核" | "已通过" | "需补充";

export type SubmittedWork = {
  id: string;
  title: string;
  photographerName: string;
  photographerSlug?: string;
  spotSlug: string;
  spotName: string;
  routeSlug: string;
  routeName: string;
  season: Season;
  styleTags: StyleReference[];
  description: string;
  images: string[];
  status: WorkReviewStatus;
  submittedAt: string;
  note: string;
};
