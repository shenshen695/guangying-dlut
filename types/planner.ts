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

export type PlannerShootType = "毕业照" | "校园写真" | "情侣照" | "风景" | "建筑";
export type PlannerDuration = "30 分钟" | "1 小时" | "2 小时" | "半天";
export type PlannerMood = "日落感" | "建筑感" | "青春感" | "湖边" | "自然纪实";
export type PlannerTime = "上午" | "下午" | "傍晚" | "时间灵活";
export type PlannerDraftField = "shootType" | "peopleCount" | "duration" | "mood" | "timeOfDay" | "selectedSpotIds";

export type PlannerDraft = {
  sourcePrompt: string;
  shootType: PlannerShootType;
  peopleCount: number | null;
  duration: PlannerDuration;
  mood: PlannerMood;
  timeOfDay: PlannerTime;
  selectedSpotIds: string[];
  uncertainFields: PlannerDraftField[];
};

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
