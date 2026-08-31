import { getCampusMedia } from "@/data/media";

export type DecisionSignal = { id: string; label: string; value: string; note: string; icon: "sun" | "clock" | "moon" | "building" | "sparkles"; tone: "blue" | "warm" };
export type RecommendationFilter = "推荐" | "天气" | "月相" | "光线" | "主题";
export type WeeklyRecommendation = {
  location: string;
  title: string;
  image: string;
  imageAlt: string;
  href: string;
  homeSubtitle: string;
  reason: string;
  tags: string[];
  filters: RecommendationFilter[];
  weatherCondition: string;
  moonPhase: string;
  bestDate: string;
  shootingTheme: string;
  rating: number;
  priority: number;
  priorityLabel: "高" | "中";
};

// 原型适配层：未来天气/月相 API 只需替换这两个函数，页面不依赖供应商字段。
export function getHomeDecisionContext(): { mode: "mock"; signals: DecisionSignal[] } {
  return { mode: "mock", signals: [
    { id: "weather", label: "每日天气", value: "18°C 晴", note: "能见度良好", icon: "sun", tone: "blue" },
    { id: "time", label: "最佳时段", value: "16:30 日落", note: "柔和侧光", icon: "sun", tone: "warm" },
    { id: "moon", label: "月相", value: "盈凸月", note: "夜拍参考", icon: "moon", tone: "blue" },
    { id: "architecture", label: "建筑光影", value: "柔和光线", note: "反差适中", icon: "building", tone: "blue" },
    { id: "season", label: "花景", value: "银杏最佳期", note: "季节参考", icon: "sparkles", tone: "blue" },
  ] };
}

export function getWeeklyRecommendations(): WeeklyRecommendation[] {
  const seeds = [
    { location: "凌水湖", title: "凌水湖日落倒影", homeSubtitle: "日落倒影 · 湖边人像", mediaId: "lake-golden", href: "/spot/ling-shui-lake/", reason: "水面平静，天空色彩丰富，适合拍摄倒影与人像。", tags: ["日落", "晴天", "倒影"], filters: ["推荐", "天气", "光线", "主题"] as RecommendationFilter[], weatherCondition: "晴天", moonPhase: "盈凸月", bestDate: "10/27 周一", shootingTheme: "湖边人像", rating: 5, priority: 1, priorityLabel: "高" as const },
    { location: "主楼广场", title: "主楼广场全景", homeSubtitle: "建筑全景 · 对称构图", mediaId: "main-building", href: "/spot/main-building/", reason: "建筑对称构图，适合清晨或傍晚的柔和光线。", tags: ["建筑", "对称", "广角"], filters: ["推荐", "光线", "主题"] as RecommendationFilter[], weatherCondition: "多云", moonPhase: "盈凸月", bestDate: "10/29 周三", shootingTheme: "建筑摄影", rating: 5, priority: 2, priorityLabel: "中" as const },
    { location: "伯川图书馆", title: "银杏大道人像", homeSubtitle: "秋景银杏 · 建筑纹理", mediaId: "autumn-light", href: "/spot/bochuan/", reason: "银杏最佳观赏期，金黄背景适合人像拍摄。", tags: ["秋景", "人像", "暖色"], filters: ["推荐", "天气", "月相", "主题"] as RecommendationFilter[], weatherCondition: "晴到多云", moonPhase: "盈凸月", bestDate: "10/31 周五", shootingTheme: "秋日人像", rating: 5, priority: 3, priorityLabel: "高" as const },
  ];
  return seeds.map((seed) => { const media = getCampusMedia(seed.mediaId); const { mediaId, ...recommendation } = seed; return { ...recommendation, image: media.src, imageAlt: media.alt }; });
}
