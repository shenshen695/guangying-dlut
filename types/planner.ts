export type StyleReference =
  | "海风清透"
  | "清透自然"
  | "学院纪实"
  | "复古胶片"
  | "电影氛围"
  | "低饱和"
  | "新中式"
  | "Citywalk感"
  | "多巴胺轻彩";
export type SeasonPreference = "春" | "夏" | "秋" | "冬";
export type TimeSlot = "morning" | "afternoon" | "evening" | "golden_hour";
export type WalkingTolerance = "short" | "medium" | "long";

export type PlannerInput = {
  styleReference: StyleReference | null;
  season: SeasonPreference;
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
