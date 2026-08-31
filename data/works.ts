import { getCampusMedia } from "@/data/media";
import type { PhotographyWork } from "@/types/work";

function demoWork(work: Omit<PhotographyWork, "image" | "thumbnail" | "source" | "sourceUrl"> & { mediaId: string }): PhotographyWork {
  const { mediaId, ...workData } = work;
  const media = getCampusMedia(mediaId);
  return { ...workData, image: media.src, thumbnail: media.src, source: media.source, sourceUrl: media.sourceUrl };
}

// 第二轮移动端修正：作品是独立内容实体，可由投稿审核结果直接替换，不再依附 Spot 卡片。
export const featuredWorks: PhotographyWork[] = [
  demoWork({ workId: "demo-lake-portrait", mediaId: "lake-portrait", title: "红桥下的春日一帧", photographer: "校园影像组", photographerAvatar: null, spotId: "ling-shui-lake", spotName: "凌水湖", cameraPositionId: "lake-bridge", shotTime: "17:26", tags: ["日落", "湖边", "人像"], camera: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null, likes: null }),
  demoWork({ workId: "demo-campus-life", mediaId: "campus-life", title: "下课后的银杏路", photographer: "大工新闻网影像组", photographerAvatar: null, spotId: null, spotName: "校园步道", cameraPositionId: null, shotTime: "秋日午后", tags: ["校园", "纪实"], camera: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null, likes: null }),
  demoWork({ workId: "demo-autumn-light", mediaId: "autumn-light", title: "光落在老校园", photographer: "大工新闻网影像组", photographerAvatar: null, spotId: "main-building", spotName: "主楼周边", cameraPositionId: null, shotTime: "暖色侧光", tags: ["建筑", "秋日"], camera: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null, likes: null }),
  demoWork({ workId: "demo-lake-golden", mediaId: "lake-golden", title: "湖岸暖光", photographer: "校园影像组", photographerAvatar: null, spotId: "ling-shui-lake", spotName: "凌水湖", cameraPositionId: "lake-west", shotTime: "日落前", tags: ["暖光", "湖面"], camera: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null, likes: null }),
  demoWork({ workId: "demo-main-building", mediaId: "main-building", title: "主楼中轴", photographer: "大工档案馆影像", photographerAvatar: null, spotId: "main-building", spotName: "主楼广场", cameraPositionId: null, shotTime: "午后", tags: ["建筑", "对称"], camera: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null, likes: null }),
];
