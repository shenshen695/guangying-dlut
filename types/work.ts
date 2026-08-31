export type WorkCategory = "校园景观" | "人像" | "秋景" | "夜景";

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
