export type CrowdLevel = "低" | "中" | "高";

export type CameraSpot = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  direction?: string;
  bestTime?: string;
  description?: string;
  verified: boolean;
};

export type Spot = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  area: string;
  latitude: number;
  longitude: number;
  description: string;
  bestTime: string;
  crowdLevel: CrowdLevel;
  shootingTips: string;
  /** 用于企划模块筛选真实点位，避免 AI 编造地点。 */
  tags: string[];
  recommendedTimeSlots: Array<"morning" | "afternoon" | "evening" | "golden_hour">;
  hasIndoorBackup: boolean;
  /** 1=步行负担低，2=中等，3=较高。 */
  walkingRank: 1 | 2 | 3;
  photoPlaceholder: string;
  verified: boolean;
  /** 预留给摄影师维护的多个具体机位，当前 Demo 为空。 */
  cameraSpots: CameraSpot[];
};
