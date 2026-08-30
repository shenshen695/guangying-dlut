export type MapPointSeason = {
  season: "春" | "夏" | "秋" | "冬";
  months: number[];
  highlight: string;
  /** 具体花期或最佳观赏期，如"约一周"、"十月下旬–十一月" */
  bloomPeriod?: string;
};

export type MapPoint = {
  id: string;
  /** % coordinate on map image (x-axis) */
  x: number;
  /** % coordinate on map image (y-axis) */
  y: number;
  name: string;
  imageSrc?: string;
  description: string;
  bestTime?: string;
  seasons?: MapPointSeason[];
  hasIndoorBackup?: boolean;
  navigationUrl?: string;
  featured?: boolean;
};
