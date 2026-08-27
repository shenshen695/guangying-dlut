import type { PlannerInput, StyleReference, WalkingTolerance } from "@/types/planner";
import type { Spot } from "@/types/spot";

const walkingLimit: Record<WalkingTolerance, number> = {
  short: 1,
  medium: 2,
  long: 3,
};

const styleAliases: Record<StyleReference, string[]> = {
  海风清透: ["海风清透", "自然光", "湖边"],
  清透自然: ["海风清透", "自然光", "湖边", "合影"],
  学院纪实: ["学院纪实", "建筑", "抓拍"],
  复古胶片: ["复古胶片", "建筑", "长廊", "暖色"],
  电影氛围: ["电影氛围", "逆光", "湖边", "建筑"],
  低饱和: ["海风清透", "建筑", "湖边", "自然光"],
  新中式: ["建筑", "长廊", "学院纪实"],
  Citywalk感: ["抓拍", "学院纪实", "自然", "草坪"],
  多巴胺轻彩: ["暖色", "花墙", "自然", "合影"],
};

export function inferStyle(input: PlannerInput): StyleReference {
  if (input.styleReference) return input.styleReference;
  if (input.peopleCount > 3 && input.timeSlot === "morning") return "学院纪实";
  if (input.timeSlot === "golden_hour" || input.timeSlot === "evening") return "电影氛围";
  return "清透自然";
}

export function retrieveCandidates(input: PlannerInput, spots: Spot[]): Spot[] {
  const style = inferStyle(input);
  const limit = walkingLimit[input.walkingTolerance];

  return spots
    .map((spot, index) => {
      let score = 0;
      if (spot.tags.includes(style)) score += 10;
      if (styleAliases[style].some((tag) => spot.tags.includes(tag))) score += 6;
      if (spot.seasons.includes(input.season)) score += 8;
      if (spot.tags.includes(input.season)) score += 4;
      if (spot.recommendedTimeSlots.includes(input.timeSlot)) score += 5;
      if (input.indoorBackupNeeded && spot.hasIndoorBackup) score += 3;
      if (spot.walkingRank <= limit) score += 2;
      if (input.peopleCount > 3 && spot.tags.includes("合影")) score += 3;
      return { spot, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, input.walkingTolerance === "short" ? 3 : 4)
    .map(({ spot }) => spot);
}
