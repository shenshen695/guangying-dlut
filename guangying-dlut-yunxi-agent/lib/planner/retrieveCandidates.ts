import type { PlannerInput, StyleReference, WalkingTolerance } from "@/types/planner";
import type { Spot } from "@/types/spot";

const walkingLimit: Record<WalkingTolerance, number> = {
  short: 1,
  medium: 2,
  long: 3,
};

export function inferStyle(input: PlannerInput): StyleReference {
  if (input.styleReference) return input.styleReference;
  if (input.peopleCount > 3 && input.timeSlot === "morning") return "学院纪实";
  if (input.timeSlot === "golden_hour" || input.timeSlot === "evening") return "电影氛围";
  return "海风清透";
}

export function retrieveCandidates(input: PlannerInput, spots: Spot[]): Spot[] {
  const style = inferStyle(input);
  const limit = walkingLimit[input.walkingTolerance];

  return spots
    .map((spot, index) => {
      let score = 0;
      if (spot.tags.includes(style)) score += 10;
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
