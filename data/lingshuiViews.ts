import { getCampusMedia } from "@/data/media";

type MarkerPlacement = { x: number; y: number; directionDegrees: number };

export type LingshuiPhotoView = {
  id: string;
  title: string;
  image: string;
  alt: string;
  objectPosition: string;
  markers: Record<string, MarkerPlacement>;
  source: string;
  sourceUrl: string;
  attribution: string;
  usageNote: string;
};

const viewConfigs = [
  { id: "lake-overview", title: "湖岸全景", mediaId: "lake-wide", objectPosition: "50% 50%", markers: { "lake-west": { x: 17, y: 59, directionDegrees: -26 }, "lake-bridge": { x: 39, y: 48, directionDegrees: 8 }, "lake-lawn": { x: 78, y: 67, directionDegrees: 190 } } },
  { id: "lake-red-bridge", title: "红桥方向", mediaId: "lake-portrait", objectPosition: "50% 50%", markers: { "lake-west": { x: 18, y: 70, directionDegrees: -42 }, "lake-bridge": { x: 64, y: 57, directionDegrees: -142 }, "lake-lawn": { x: 84, y: 74, directionDegrees: 180 } } },
  { id: "lake-golden-light", title: "湖岸暖光", mediaId: "lake-golden", objectPosition: "52% 50%", markers: { "lake-west": { x: 16, y: 72, directionDegrees: -28 }, "lake-bridge": { x: 52, y: 68, directionDegrees: -115 }, "lake-lawn": { x: 84, y: 72, directionDegrees: 180 } } },
] as const;

// 凌水湖实景导航：图片来自学校官方公开页面；机位叠加坐标仅用于首版导航，正式上线前需现场复核。
export const lingshuiPhotoViews: LingshuiPhotoView[] = viewConfigs.map((view) => {
  const media = getCampusMedia(view.mediaId);
  return { id: view.id, title: view.title, image: media.src, alt: media.alt, objectPosition: view.objectPosition, markers: view.markers, source: media.source, sourceUrl: media.sourceUrl, attribution: media.attribution, usageNote: "学校官方公开环境图片，仅用于产品开发展示；正式发布前复核授权与机位标注。" };
});
