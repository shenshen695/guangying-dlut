import type { Season } from "@/types/spot";

export type PhotographerIdentity = "摄影社成员" | "校友摄影者" | "在校学生" | "摄影爱好者";

export type PhotographerStatus = "可互勉" | "可约拍" | "暂不互勉";

export type PhotographerWorkCategory = "毕业照" | "湖畔" | "人像" | "建筑" | "夜景" | "室内" | "胶片感";

export type PhotographerContact = {
  wechat?: string;
  email?: string;
  qq?: string;
};

export type PhotographerWork = {
  id: string;
  title: string;
  image: string;
  spot: string;
  season: Season;
  style: string;
  categories: PhotographerWorkCategory[];
  description?: string;
  featured?: boolean;
  isPublic?: boolean;
};

export type Photographer = {
  sourceId?: string;
  source?: "local" | "supabase";
  slug: string;
  name: string;
  identity: PhotographerIdentity;
  intro: string;
  familiarRoutes: string[];
  familiarSpots: string[];
  styles: string[];
  seasons: Season[];
  mutualStatus: PhotographerStatus;
  authorized: boolean;
  contact: PhotographerContact;
  avatar: string;
  portfolio: PhotographerWork[];
  featured?: boolean;
  isPublic?: boolean;
};
