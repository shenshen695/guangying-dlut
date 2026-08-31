import type { StyleReference } from "@/types/planner";
import type { Season } from "@/types/spot";

export type WorkReviewStatus = "待审核" | "已通过" | "需补充";
export type WorkCategory = "校园景观" | "人像" | "秋景" | "夜景";

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

export type PhotographyWork = {
  workId: string;
  image: string;
  thumbnail: string;
  title: string;
  photographer: string;
  photographerId: string;
  photographerAvatar: string | null;
  spotId: string | null;
  spotName: string | null;
  cameraPositionId: string | null;
  shotTime: string | null;
  tags: string[];
  camera: string | null;
  focalLength: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: number | null;
  likes: number | null;
  categories: WorkCategory[];
  createdAt: string;
  source: string;
  sourceUrl: string;
};
