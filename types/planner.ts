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

// 光影大工 Product V2：自然语言解析与未来真实 AI API 共用的数据边界。
export type PlannerDuration = "30 分钟" | "1 小时" | "2 小时" | "半天";
export type PlannerMood = "日落感" | "建筑感" | "青春感" | "湖边" | "自然纪实";
export type PlannerShootType = "毕业照" | "校园写真" | "情侣照" | "风景" | "建筑";
export type PlannerTime = "上午" | "下午" | "傍晚" | "时间灵活";

export type PlannerDraft = {
  sourcePrompt: string;
  shootType: PlannerShootType;
  peopleCount: number | null;
  duration: PlannerDuration;
  mood: PlannerMood;
  timeOfDay: PlannerTime;
  selectedSpotIds: string[];
  uncertainFields: Array<"shootType" | "peopleCount" | "duration" | "mood" | "timeOfDay" | "selectedSpotIds">;
};
