import { STYLE_DEFINITIONS, type GraduationStyle, type RealSpot } from "@/lib/ai/prompts";

export type AgentResponse = {
  status: "asking" | "locked";
  message: string;
  confirmed_style?: GraduationStyle | null;
  recommendation: null | {
    color_palette: string[];
    outfit: {
      top: string;
      bottom: string;
      shoes: string;
      accessory: string;
    };
    scenes: RealSpot[];
    shoot_time: string;
    actions: string[];
    style_note: string;
  };
  memory_update?: {
    preferred_style: GraduationStyle;
    preferred_colors: string[];
    preferred_scenes: RealSpot[];
    people_preference: string;
    clothing_mentioned: string;
    disliked_styles: GraduationStyle[];
  } | null;
};

const styleKeywords: Array<{ style: GraduationStyle; words: string[] }> = [
  { style: "青春清透", words: ["清透", "明亮", "轻盈", "浅蓝", "淡粉", "花", "湖", "草坪", "自然光", "青春", "干净"] },
  { style: "学院风制服", words: ["学院", "制服", "正式", "图书馆", "教室", "整齐", "学士服", "主楼", "书架"] },
  { style: "端庄复古", words: ["复古", "胶片", "银杏", "老建筑", "温婉", "安静", "暖棕", "酒红", "故事感"] },
  { style: "学位纪实", words: ["纪实", "自然", "抓拍", "朋友", "多人", "操场", "互动", "不摆拍", "松弛"] },
];

export const plannerStyleMap: Record<GraduationStyle, string> = {
  青春清透: "清透自然",
  学院风制服: "学院纪实",
  端庄复古: "复古胶片",
  学位纪实: "学院纪实",
};

function detectPeople(text: string) {
  if (/[5-9五六七八九十]/.test(text) || text.includes("多人") || text.includes("班级")) return "多人";
  if (/[2-4二三四两]/.test(text) || text.includes("朋友") || text.includes("闺蜜") || text.includes("情侣")) return "小团体";
  if (text.includes("一个人") || text.includes("独照")) return "独照";
  return "未明确";
}

function detectClothing(text: string) {
  if (text.includes("白裙")) return "白裙子";
  if (text.includes("学士服")) return "学士服";
  if (text.includes("制服")) return "制服";
  if (text.includes("衬衫")) return "衬衫";
  if (text.includes("怕冷")) return "需要保暖层";
  return "未明确";
}

function detectDisliked(text: string): GraduationStyle[] {
  if (!/(不喜欢|不要|换一个|别|不想|太土|不行)/.test(text)) return [];
  return styleKeywords
    .filter((item) => item.words.some((word) => text.includes(word)) || text.includes(item.style))
    .map((item) => item.style);
}

function scoreStyle(text: string, disliked: GraduationStyle[]) {
  const normalized = text.toLowerCase();
  return styleKeywords
    .filter((item) => !disliked.includes(item.style))
    .map((item) => ({
      style: item.style,
      score: item.words.reduce((total, word) => total + (normalized.includes(word.toLowerCase()) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)[0];
}

function buildOutfit(style: GraduationStyle, text: string) {
  const definition = STYLE_DEFINITIONS[style];
  const clothing = detectClothing(text);
  const palette = definition.colors;
  if (clothing === "白裙子") {
    return {
      top: "白裙子或浅色衬衫，保持画面清透",
      bottom: "浅色半裙 / 牛仔下装均可，避免大面积深色",
      shoes: "白色帆布鞋或浅色乐福鞋",
      accessory: "浅蓝发带、小花束或毕业帽",
    };
  }
  if (clothing === "学士服") {
    return {
      top: "学士服内搭白衬衫或浅色 T 恤",
      bottom: "深色直筒裤或简单半裙",
      shoes: "黑白低帮鞋，保证行走舒服",
      accessory: "学位帽、院系徽章或同色文件夹",
    };
  }
  if (clothing === "需要保暖层") {
    return {
      top: `${palette[0]}系衬衫外加浅色开衫`,
      bottom: "卡其或牛仔下装，方便长时间步行",
      shoes: "低饱和运动鞋",
      accessory: "围巾或帆布包，颜色不要太跳",
    };
  }
  return {
    top: `${palette[0]} / ${palette[1]} 上衣`,
    bottom: "牛仔、卡其或同色系半裙",
    shoes: "轻便浅色鞋",
    accessory: "小花束、毕业帽或书本",
  };
}

export function runLocalStyleAgent({
  userInput,
  history,
  userTurns,
  dislikedStyles,
}: {
  userInput: string;
  history: string[];
  userTurns: number;
  dislikedStyles: GraduationStyle[];
}): AgentResponse {
  const nextDisliked = Array.from(new Set([...dislikedStyles, ...detectDisliked(userInput)]));
  const allText = [...history, userInput].join(" ");
  const scored = scoreStyle(allText, nextDisliked);
  const style = scored && scored.score > 0 ? scored.style : "青春清透";
  const definition = STYLE_DEFINITIONS[style];
  const hasExplicitLock = /确定|就这个|可以锁定|按你推荐|生成路线|开始生成/.test(userInput);
  const richEnough = /(人数|个人|朋友|闺蜜|情侣|学士服|白裙|湖|主楼|图书馆|复古|清透|纪实|制服|胶片|抓拍)/.test(allText);
  const locked = hasExplicitLock || (userTurns >= 4 && richEnough);

  if (!locked) {
    const ask = userTurns <= 1
      ? "我先记下这个方向。你更想要正式一点，还是更像朋友同行的抓拍？也可以补充人数、衣服颜色或想去的点位。"
      : `现在更靠近「${style}」。再补一句你的人数、衣服颜色，或者有没有特别想去的点位，我就可以帮你锁定。`;
    return {
      status: "asking",
      message: ask,
      confirmed_style: null,
      recommendation: null,
      memory_update: null,
    };
  }

  const outfit = buildOutfit(style, allText);
  const memoryUpdate = {
    preferred_style: style,
    preferred_colors: [...definition.colors],
    preferred_scenes: [...definition.scenes],
    people_preference: detectPeople(allText),
    clothing_mentioned: detectClothing(allText),
    disliked_styles: nextDisliked,
  };

  return {
    status: "locked",
    message: `我帮你锁定「${style}」。推荐从${definition.scenes.slice(0, 3).join("、")}开始，时间放在${definition.shootTime}，这样画面和路线都比较稳。`,
    confirmed_style: style,
    recommendation: {
      color_palette: [...definition.colors],
      outfit,
      scenes: [...definition.scenes],
      shoot_time: definition.shootTime,
      actions: [...definition.actions],
      style_note: `选择「${style}」是因为你提到的信息更适合${definition.traits.join("、")}的画面；穿搭保持同一色系，能让人和校园背景都更干净。`,
    },
    memory_update: memoryUpdate,
  };
}
