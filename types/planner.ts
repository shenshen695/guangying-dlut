export type StyleReference = "海风清透" | "学院纪实" | "复古胶片" | "电影氛围";
export type TimeSlot = "morning" | "afternoon" | "evening" | "golden_hour";
export type WalkingTolerance = "short" | "medium" | "long";

export type PlannerInput = {
  styleReference: StyleReference | null;
  peopleCount: number;
  shootDate: string;
  timeSlot: TimeSlot;
  hasAcademicGown: boolean;
  dressingColor: string;
  indoorBackupNeeded: boolean;
  walkingTolerance: WalkingTolerance;
};

export type ShootingPlan = {
  style: StyleReference;
  styleReason: string;
  selectedSpotIds: string[];
  colorPalette: string[];
  outfit: {
    inner: string;
    shoes: string;
    accessory: string;
  };
  actions: string[];
  avoid: string[];
  notice: string;
};
