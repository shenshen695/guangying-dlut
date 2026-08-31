import { getCampusMedia } from "@/data/media";
import type { PhotographyWork, WorkCategory } from "@/types/work";

type DemoWorkSeed = Omit<PhotographyWork, "image" | "thumbnail" | "source" | "sourceUrl" | "photographerId" | "categories" | "createdAt"> & {
  mediaId: string;
  photographerId?: string;
  categories?: WorkCategory[];
  createdAt?: string;
};

function demoWork(work: DemoWorkSeed): PhotographyWork {
  const { mediaId, ...workData } = work;
  const media = getCampusMedia(mediaId);
  return {
    ...workData,
    image: media.src,
    thumbnail: media.src,
    photographerId: workData.photographerId || "ruoshui",
    categories: workData.categories || ["校园景观", "人像"],
    createdAt: workData.createdAt || "2026-08-31",
    source: media.source,
    sourceUrl: media.sourceUrl,
  };
}

// 第二轮移动端修正：作品是独立内容实体，可由投稿审核结果直接替换，不再依附 Spot 卡片。
export const featuredWorks: PhotographyWork[] = [
  demoWork({ workId: "demo-lake-portrait", mediaId: "lake-portrait", title: "红桥下的春日一帧", photographer: "若水", photographerId: "ruoshui", photographerAvatar: null, spotId: "ling-shui-lake", spotName: "凌水湖", cameraPositionId: "lake-bridge", shotTime: "17:26", tags: ["日落", "湖边", "人像"], camera: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null, likes: 428, categories: ["人像", "校园景观"], createdAt: "2026-08-31" }),
  demoWork({ workId: "demo-campus-life", mediaId: "campus-life", title: "下课后的银杏路", photographer: "Ming", photographerId: "ming", photographerAvatar: null, spotId: null, spotName: "校园步道", cameraPositionId: null, shotTime: "秋日午后", tags: ["校园", "纪实"], camera: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null, likes: 392, categories: ["校园景观", "秋景"], createdAt: "2026-08-30" }),
  demoWork({ workId: "demo-autumn-light", mediaId: "autumn-light", title: "光落在老校园", photographer: "Yu", photographerId: "yu", photographerAvatar: null, spotId: "main-building", spotName: "主楼周边", cameraPositionId: null, shotTime: "暖色侧光", tags: ["建筑", "秋日"], camera: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null, likes: 365, categories: ["校园景观", "秋景"], createdAt: "2026-08-29" }),
  demoWork({ workId: "demo-lake-golden", mediaId: "lake-golden", title: "湖岸暖光", photographer: "林同学", photographerId: "lin", photographerAvatar: null, spotId: "ling-shui-lake", spotName: "凌水湖", cameraPositionId: "lake-west", shotTime: "日落前", tags: ["暖光", "湖面"], camera: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null, likes: 346, categories: ["校园景观", "人像"], createdAt: "2026-08-28" }),
  demoWork({ workId: "demo-main-building", mediaId: "main-building", title: "主楼中轴", photographer: "Ming", photographerId: "ming", photographerAvatar: null, spotId: "main-building", spotName: "主楼广场", cameraPositionId: null, shotTime: "午后", tags: ["建筑", "对称"], camera: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null, likes: 331, categories: ["校园景观"], createdAt: "2026-08-27" }),
];

export const workCategories: Array<"最新" | "热门" | WorkCategory> = ["最新", "热门", "校园景观", "人像", "秋景", "夜景"];
export function getWork(workId: string) { return featuredWorks.find((item) => item.workId === workId); }
