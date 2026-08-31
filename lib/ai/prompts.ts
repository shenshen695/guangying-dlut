export const REAL_SPOTS = [
  "伯川前二月兰",
  "伯川图书馆内",
  "经管学院",
  "二馆",
  "凌水湖",
  "操场",
  "二馆玉兰",
  "令希图书馆前",
  "音乐喷泉前草坪",
  "花墙",
  "南大门连理",
  "综一二楼玻璃窗",
  "船舶门前草坪",
  "建馆草坪",
  "情人路",
  "综一教室",
  "大活门前",
  "建艺（银杏季）",
  "情人坡（冬）",
] as const;

export const STYLE_DEFINITIONS = {
  青春清透: {
    traits: ["明亮", "轻盈", "自然光"],
    colors: ["白色", "浅蓝色", "淡粉色"],
    scenes: ["凌水湖", "音乐喷泉前草坪", "花墙", "伯川前二月兰"],
    shootTime: "下午 16:00-18:30",
    actions: ["跑动", "回头", "大笑"],
  },
  学院风制服: {
    traits: ["青春", "整齐", "校园感"],
    colors: ["白色", "藏青色", "红领结"],
    scenes: ["伯川图书馆内", "综一教室", "令希图书馆前", "二馆"],
    shootTime: "上午 9:00-11:00",
    actions: ["并排坐", "扔帽", "写黑板"],
  },
  端庄复古: {
    traits: ["安静", "温婉", "故事感"],
    colors: ["暖棕色", "酒红色", "碎花"],
    scenes: ["建艺（银杏季）", "情人路", "综一二楼玻璃窗", "二馆"],
    shootTime: "傍晚 17:00-19:00",
    actions: ["背影", "低头", "靠墙"],
  },
  学位纪实: {
    traits: ["真实", "自然", "不作做"],
    colors: ["白色", "牛仔蓝", "卡其色"],
    scenes: ["凌水湖", "大活门前", "操场", "船舶门前草坪"],
    shootTime: "上午或下午",
    actions: ["走路抓拍", "和同学互动", "自然合影"],
  },
} as const;

export type GraduationStyle = keyof typeof STYLE_DEFINITIONS;
export type RealSpot = (typeof REAL_SPOTS)[number];

export const STYLE_AGENT_FIRST_MESSAGE = "你有想好的毕业照风格吗？可以简单描述你喜欢的画面感觉。";

export const STYLE_AGENT_RULE_SUMMARY =
  "只从真实点位里推荐场景，记录用户喜欢与不喜欢的风格，并在风格明确后进入企划生成。";
