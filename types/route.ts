export type Route = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  duration: string;
  walkingDistance: string;
  recommendedTime: string;
  spots: string[];
  /** 每个点位的简短介绍，key 为 spot id */
  stopIntros?: Record<string, string>;
};
