import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  REAL_SPOTS,
  STYLE_AGENT_FIRST_MESSAGE,
  STYLE_AGENT_SYSTEM_PROMPT,
  STYLE_DEFINITIONS,
  type GraduationStyle,
  type RealSpot,
} from "@/lib/ai/prompts";
import { deletePreferences, getPreferences, updateDisliked, upsertPreferences, type UserPreferences } from "@/lib/db/preferences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_USER_TURNS = 5;

type ConversationTurn = {
  user: string;
  assistant: string;
};

type SessionState = {
  history: ConversationTurn[];
  askedQuestionIds: string[];
  askedCount: number;
  userTurnCount: number;
  uncertainCount: number;
  greeted: boolean;
  candidateStyle?: GraduationStyle;
  pendingMemoryStyle?: GraduationStyle;
  lastRecommendedStyle?: GraduationStyle;
  dislikedStyles: GraduationStyle[];
};

type AgentRequest = {
  session_id?: string;
  user_id?: string;
  user_input?: string;
};

type Outfit = {
  top: string;
  bottom: string;
  shoes: string;
  accessory: string;
};

type Recommendation = {
  color_palette: string[];
  outfit: Outfit;
  scenes: RealSpot[];
  shoot_time: string;
  actions: string[];
  style_note: string;
};

type AskingResponse = {
  status: "asking";
  message: string;
  recommendation: null;
};

type LockedResponse = {
  status: "locked";
  message: string;
  confirmed_style: GraduationStyle;
  recommendation: Recommendation;
  memory_update: {
    preferred_style: GraduationStyle;
    preferred_colors: string[];
    preferred_scenes: RealSpot[];
    people_preference: string;
    clothing_mentioned: string;
    disliked_styles: GraduationStyle[];
  };
};

type AgentResponse = AskingResponse | LockedResponse;

const STYLE_NAMES = Object.keys(STYLE_DEFINITIONS) as GraduationStyle[];
const realSpotSet = new Set<string>(REAL_SPOTS);

const globalStore = globalThis as typeof globalThis & {
  __guangyingStyleSessions?: Map<string, SessionState>;
};

const sessions = globalStore.__guangyingStyleSessions ?? new Map<string, SessionState>();
globalStore.__guangyingStyleSessions = sessions;

function createSession(): SessionState {
  return {
    history: [],
    askedQuestionIds: [],
    askedCount: 0,
    userTurnCount: 0,
    uncertainCount: 0,
    greeted: false,
    candidateStyle: undefined,
    dislikedStyles: [],
  };
}

function getSession(sessionId: string) {
  const current = sessions.get(sessionId) ?? createSession();
  sessions.set(sessionId, current);
  return current;
}

function rememberTurn(state: SessionState, user: string, assistant: string) {
  state.history.push({ user, assistant });
  state.history = state.history.slice(-5);
}

function normalizeText(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

function isStyleName(value: unknown): value is GraduationStyle {
  return typeof value === "string" && STYLE_NAMES.includes(value as GraduationStyle);
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function isPositiveConfirmation(text: string) {
  return hasAny(text, ["可以", "继续", "沿用", "就这个", "好", "行", "确认", "没问题", "嗯", "对"]);
}

function isLockConfirmation(text: string) {
  return hasAny(text, ["确定", "确认", "锁定", "就这个", "就按这个", "可以锁定", "定了", "没问题"]);
}

function wantsImmediateRecommendation(text: string) {
  return hasAny(text, ["你决定", "你来定", "帮我定", "直接出", "马上出", "按你推荐", "听你的", "不用问了", "给我方案"]);
}

function isNegativeFeedback(text: string) {
  return hasAny(text, ["不喜欢", "不要", "不想要", "换一个", "换种", "重新", "别推荐", "算了"]);
}

function isUncertain(text: string) {
  return !text || hasAny(text, ["不知道", "随便", "都行", "都可以", "你推荐", "没想好", "无所谓", "看看", "模糊"]);
}

function extractPeoplePreference(text: string) {
  const explicitCount = text.match(/(\d+|[一二两三四五六七八九十]+)\s*(个)?人/);
  if (explicitCount) return `${explicitCount[1]}个人`;
  if (hasAny(text, ["多人", "一群", "同学", "室友", "朋友", "班级", "集体", "合照"])) return "多人";
  if (hasAny(text, ["单人", "自己", "一个人", "个人照"])) return "单人";
  return "";
}

function extractClothingMentioned(text: string) {
  const clothingKeywords = [
    "白裙子",
    "裙子",
    "学士服",
    "制服",
    "衬衫",
    "西装",
    "开衫",
    "牛仔",
    "红领结",
    "碎花",
    "怕冷",
  ];
  const found = clothingKeywords.filter((keyword) => text.includes(keyword));
  return found.length > 0 ? Array.from(new Set(found)).join("、") : "";
}

function inferStyleFromText(text: string, dislikedStyles: GraduationStyle[]) {
  const exact = STYLE_NAMES.find((style) => text.includes(style));
  if (exact) return { style: exact, explicit: true };

  const candidates: Array<{ style: GraduationStyle; keywords: string[] }> = [
    { style: "青春清透", keywords: ["明亮", "清透", "轻盈", "自然光", "浅蓝", "淡粉", "白裙", "湖边", "草坪", "花墙", "花海", "跑动", "大笑", "活泼"] },
    { style: "学院风制服", keywords: ["学院", "制服", "整齐", "校园感", "藏青", "红领结", "教室", "书架", "图书馆", "写黑板", "扔帽", "并排坐"] },
    { style: "端庄复古", keywords: ["端庄", "复古", "安静", "温婉", "故事感", "暖棕", "酒红", "碎花", "老建筑", "楼道", "树影", "银杏", "背影", "低头", "靠墙"] },
    { style: "学位纪实", keywords: ["纪实", "真实", "不作做", "不做作", "抓拍", "走路", "互动", "牛仔", "卡其", "操场", "毕业留念"] },
  ];

  const match = candidates.find((candidate) => hasAny(text, candidate.keywords));
  if (!match) return null;
  if (dislikedStyles.includes(match.style)) return null;
  return { style: match.style, explicit: false };
}

function extractDislikedStyles(input: string, state: SessionState) {
  if (!isNegativeFeedback(input)) return [];

  const explicit = STYLE_NAMES.filter((style) => input.includes(style));
  const keywordStyle = inferStyleFromText(input, []);
  const contextStyle = state.pendingMemoryStyle ?? state.candidateStyle ?? state.lastRecommendedStyle;
  const styles = [...explicit];

  if (keywordStyle?.style && hasAny(input, ["不要", "不喜欢", "不想要", "别推荐"])) {
    styles.push(keywordStyle.style);
  }

  if (styles.length === 0 && contextStyle) {
    styles.push(contextStyle);
  }

  return Array.from(new Set(styles));
}

function getContextText(state: SessionState, latestInput: string) {
  return [...state.history.map((turn) => `${turn.user} ${turn.assistant}`), latestInput].join(" ");
}

function buildOutfit(style: GraduationStyle, contextText: string): { outfit: Outfit; reason: string; peoplePreference: string; clothingMentioned: string } {
  const definition = STYLE_DEFINITIONS[style];
  const peoplePreference = extractPeoplePreference(contextText);
  const clothingMentioned = extractClothingMentioned(contextText);
  const hasWhiteDress = contextText.includes("白裙子") || contextText.includes("白裙");
  const hasColdConcern = contextText.includes("怕冷") || contextText.includes("冷");
  const hasAcademicGown = contextText.includes("学士服");
  const hasUniform = contextText.includes("制服");
  const isGroup = peoplePreference.includes("多人") || /[2-9五六七八九十]个人/.test(peoplePreference);

  let top = `${definition.colors[0]}或${definition.colors[1]}上衣`;
  let bottom = "与主色协调的下装";
  let shoes = "浅色舒适鞋";
  let accessory = "小束花或学位帽";

  if (style === "学院风制服" || hasUniform) {
    top = hasColdConcern ? "白衬衫外搭藏青色针织开衫" : "白衬衫或干净制服上装";
    bottom = "藏青色半裙或同色长裤";
    shoes = "黑色乐福鞋或简洁小皮鞋";
    accessory = "红领结、书本或学位帽";
  } else if (style === "端庄复古") {
    top = hasColdConcern ? "暖棕色针织开衫叠酒红内搭" : "暖棕色或酒红色上衣";
    bottom = "碎花裙或深色直筒裙";
    shoes = "棕色小皮鞋";
    accessory = "珍珠发夹、复古书本或小花束";
  } else if (style === "学位纪实" || hasAcademicGown) {
    top = hasColdConcern ? "白色内搭外加浅色开衫，可叠学士服" : "白色内搭或学士服";
    bottom = "牛仔裤或卡其色长裤";
    shoes = "白色运动鞋或帆布鞋";
    accessory = "学位帽、校牌或毕业证书夹";
  }

  if (hasWhiteDress) {
    top = hasColdConcern ? "浅色上衣外加米白开衫" : "浅色上衣";
    bottom = "白裙子";
    shoes = "浅色帆布鞋";
    accessory = "淡粉色小花束或细发带";
  }

  if (isGroup) {
    accessory = `${accessory}；多人统一色系，每人一个小道具`;
  }

  const reasonParts = [];
  if (hasWhiteDress) reasonParts.push("白裙子和浅色画面协调，人物会更轻盈干净");
  if (isGroup) reasonParts.push("多人统一色系能让合照更整齐，每个人的小道具又能保留差异");
  if (hasColdConcern) reasonParts.push("加一件浅色开衫能保暖，也不会压住毕业照的清爽感");
  if (reasonParts.length === 0) reasonParts.push(`${definition.colors.join("、")}贴合${style}的${definition.traits.join("、")}气质`);

  return {
    outfit: { top, bottom, shoes, accessory },
    reason: reasonParts.join("；"),
    peoplePreference: peoplePreference || "未提及",
    clothingMentioned: clothingMentioned || "未提及",
  };
}

function safeScenes(style: GraduationStyle) {
  return STYLE_DEFINITIONS[style].scenes.filter((scene) => realSpotSet.has(scene)) as RealSpot[];
}

function buildLockedResponse(style: GraduationStyle, state: SessionState, userInput: string, options?: { forced?: boolean; memoryStyle?: boolean }): LockedResponse {
  const contextText = getContextText(state, userInput);
  const definition = STYLE_DEFINITIONS[style];
  const outfit = buildOutfit(style, contextText);
  const scenes = safeScenes(style).slice(0, 3);
  const messagePrefix = options?.forced
    ? `我先帮你选择更稳妥的${style}风格，这套方案会尽量贴合你刚才提到的偏好。`
    : options?.memoryStyle
      ? `好的，继续沿用你上次选择的${style}风格。`
      : `已经为你锁定${style}风格。`;
  const styleNote = `${style}适合${definition.traits.join("、")}的毕业画面。为什么这样搭：${outfit.reason}。`;

  return {
    status: "locked",
    message: `${messagePrefix}${styleNote}`,
    confirmed_style: style,
    recommendation: {
      color_palette: [...definition.colors],
      outfit: outfit.outfit,
      scenes,
      shoot_time: definition.shootTime,
      actions: [...definition.actions],
      style_note: styleNote,
    },
    memory_update: {
      preferred_style: style,
      preferred_colors: [...definition.colors],
      preferred_scenes: scenes,
      people_preference: outfit.peoplePreference,
      clothing_mentioned: outfit.clothingMentioned,
      disliked_styles: state.dislikedStyles,
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];
}

function buildLockedResponseFromModel(style: GraduationStyle, payload: Record<string, unknown>, state: SessionState, userInput: string): LockedResponse {
  const fallback = buildLockedResponse(style, state, userInput);
  const recommendation = asRecord(payload.recommendation);
  const modelOutfit = asRecord(recommendation?.outfit);
  const memoryUpdate = asRecord(payload.memory_update);
  const modelScenes = readStringArray(recommendation?.scenes).filter((scene): scene is RealSpot => realSpotSet.has(scene)).slice(0, 4);
  const modelDislikes = readStringArray(memoryUpdate?.disliked_styles).filter(isStyleName);

  const colorPalette = fallback.recommendation.color_palette;
  const scenes = modelScenes.length > 0 ? modelScenes : fallback.recommendation.scenes;
  const outfit = {
    top: readString(modelOutfit?.top) ?? fallback.recommendation.outfit.top,
    bottom: readString(modelOutfit?.bottom) ?? fallback.recommendation.outfit.bottom,
    shoes: readString(modelOutfit?.shoes) ?? fallback.recommendation.outfit.shoes,
    accessory: readString(modelOutfit?.accessory) ?? fallback.recommendation.outfit.accessory,
  };
  const shootTime = fallback.recommendation.shoot_time;
  const actions = fallback.recommendation.actions;
  const styleNote = readString(recommendation?.style_note) ?? fallback.recommendation.style_note;
  const dislikedStyles = Array.from(new Set([...state.dislikedStyles, ...modelDislikes]));

  return {
    status: "locked",
    message: readString(payload.message) ?? fallback.message,
    confirmed_style: style,
    recommendation: {
      color_palette: colorPalette,
      outfit,
      scenes,
      shoot_time: shootTime,
      actions,
      style_note: styleNote,
    },
    memory_update: {
      preferred_style: style,
      preferred_colors: colorPalette,
      preferred_scenes: scenes,
      people_preference: readString(memoryUpdate?.people_preference) ?? fallback.memory_update.people_preference,
      clothing_mentioned: readString(memoryUpdate?.clothing_mentioned) ?? fallback.memory_update.clothing_mentioned,
      disliked_styles: dislikedStyles,
    },
  };
}

function getFallbackStyle(dislikedStyles: GraduationStyle[]) {
  if (!dislikedStyles.includes("学位纪实")) return "学位纪实";
  return STYLE_NAMES.find((style) => !dislikedStyles.includes(style)) ?? "学位纪实";
}

function getQuestionCandidates(input: string) {
  const candidates = [
    {
      id: "tone",
      message: "我先抓一下整体氛围：你希望照片看起来更轻松明亮，还是更有电影感和情绪？也可以直接描述一个你喜欢的画面。",
    },
    {
      id: "place",
      message: "有没有一个你更想出现的校园场景，比如湖边、草坪、图书馆、教室、老建筑，或者和同学走在路上的感觉？",
    },
    {
      id: "action",
      message: "动作上你更接受自然抓拍，还是可以拍一点跑动、回头、大笑这类更活泼的画面？",
    },
    {
      id: "clothing",
      message: "穿搭这块你有没有已经想穿的衣服或颜色？我可以按你的现有衣服去推风格。",
    },
  ];

  if (extractPeoplePreference(input)) {
    return [
      {
        id: "group",
        message: "多人一起拍的话，我想确认一下：你们有没有统一色系、统一服装，或者每个人都想保留一点自己的特点？",
      },
      ...candidates,
    ];
  }

  if (extractClothingMentioned(input)) {
    return [candidates[1], candidates[2], candidates[0], candidates[3]];
  }

  return candidates;
}

function buildAskingResponse(state: SessionState, userInput: string): AskingResponse {
  const next = getQuestionCandidates(userInput).find((question) => !state.askedQuestionIds.includes(question.id));
  const question = next ?? {
    id: `fallback-${state.askedCount}`,
    message: "我还想多听一点你的偏好：这组毕业照你最在意的是氛围好看、穿搭出片、地点有纪念感，还是和朋友互动自然？",
  };

  state.askedQuestionIds.push(question.id);
  state.askedCount += 1;

  return {
    status: "asking",
    message: question.message,
    recommendation: null,
  };
}

function openaiClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });
}

function extractJson(content: string) {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

async function askModelForDecision(state: SessionState, userInput: string, preferences: UserPreferences | null) {
  const client = openaiClient();
  if (!client) return null;

  try {
    const historyMessages = state.history.flatMap((turn) => [
      { role: "user" as const, content: turn.user },
      { role: "assistant" as const, content: turn.assistant },
    ]);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "deepseek/deepseek-v4-flash-20260731",
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: STYLE_AGENT_SYSTEM_PROMPT },
        {
          role: "system",
          content: JSON.stringify({
            long_term_memory: preferences,
            current_session: {
              user_turn_count: state.userTurnCount,
              minimum_user_turns_before_lock: MIN_USER_TURNS,
              can_lock_now: state.userTurnCount >= MIN_USER_TURNS,
              candidate_style: state.candidateStyle ?? null,
              asked_count: state.askedCount,
              asked_question_ids: state.askedQuestionIds,
              disliked_styles: state.dislikedStyles,
            },
          }),
        },
        ...historyMessages,
        { role: "user", content: userInput },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;
    return extractJson(content);
  } catch (error) {
    console.warn("Style agent model call failed:", error);
    return null;
  }
}

function normalizeModelDecision(payload: Record<string, unknown> | null, state: SessionState, userInput: string): AgentResponse | null {
  if (!payload) return null;

  if (payload.status === "locked" && isStyleName(payload.confirmed_style)) {
    if (state.userTurnCount < MIN_USER_TURNS) {
      state.candidateStyle = payload.confirmed_style;
      return null;
    }
    if (state.dislikedStyles.includes(payload.confirmed_style) && !userInput.includes(payload.confirmed_style)) {
      return null;
    }
    return buildLockedResponseFromModel(payload.confirmed_style, payload, state, userInput);
  }

  if (payload.status === "asking" && typeof payload.message === "string") {
    const message = payload.message.trim();
    if (message && !state.history.some((turn) => turn.assistant === message)) {
      state.askedCount += 1;
      state.askedQuestionIds.push(`model-${state.askedCount}`);
      return { status: "asking", message, recommendation: null };
    }
  }

  return null;
}

async function persistLockedResponse(userId: string, response: LockedResponse) {
  await upsertPreferences({
    user_id: userId,
    preferred_style: response.memory_update.preferred_style,
    preferred_colors: response.memory_update.preferred_colors,
    preferred_scenes: response.memory_update.preferred_scenes,
    people_preference: response.memory_update.people_preference,
    clothing_mentioned: response.memory_update.clothing_mentioned,
    disliked_styles: response.memory_update.disliked_styles,
  });
}

async function createResponse(state: SessionState, userId: string, userInput: string): Promise<AgentResponse> {
  const preferences = userId ? await getPreferences(userId) : null;
  const storedDislikes = preferences?.disliked_styles ?? [];
  state.dislikedStyles = Array.from(new Set([...state.dislikedStyles, ...storedDislikes]));

  if (!userInput) {
    if (preferences?.preferred_style && !state.dislikedStyles.includes(preferences.preferred_style)) {
      state.greeted = true;
      state.pendingMemoryStyle = preferences.preferred_style;
      state.lastRecommendedStyle = preferences.preferred_style;
      return {
        status: "asking",
        message: `根据你上次的选择，推荐${preferences.preferred_style}风格，你觉得怎么样？`,
        recommendation: null,
      };
    }

    state.greeted = true;
    return {
      status: "asking",
      message: STYLE_AGENT_FIRST_MESSAGE,
      recommendation: null,
    };
  }

  state.userTurnCount += 1;

  const dislikedFromInput = extractDislikedStyles(userInput, state);
  if (dislikedFromInput.length > 0) {
    const persistedDislikes = await updateDisliked(userId, dislikedFromInput);
    state.dislikedStyles = Array.from(new Set([...state.dislikedStyles, ...persistedDislikes, ...dislikedFromInput]));
    state.pendingMemoryStyle = undefined;
    state.lastRecommendedStyle = undefined;
    state.candidateStyle = undefined;
  }

  if (state.pendingMemoryStyle && isPositiveConfirmation(userInput) && !isNegativeFeedback(userInput)) {
    state.candidateStyle = state.pendingMemoryStyle;
    state.pendingMemoryStyle = undefined;
  }

  const inferred = inferStyleFromText(userInput, state.dislikedStyles);
  if (inferred) {
    state.candidateStyle = inferred.style;
  }

  if (isUncertain(userInput)) {
    state.uncertainCount += 1;
  }

  const modelDecision = await askModelForDecision(state, userInput, preferences);
  const normalizedModelDecision = normalizeModelDecision(modelDecision, state, userInput);
  if (normalizedModelDecision) {
    if (normalizedModelDecision.status === "locked") {
      await persistLockedResponse(userId, normalizedModelDecision);
      state.lastRecommendedStyle = normalizedModelDecision.confirmed_style;
      state.candidateStyle = undefined;
      state.pendingMemoryStyle = undefined;
    }
    return normalizedModelDecision;
  }

  const canFallbackLock = state.userTurnCount >= MIN_USER_TURNS;
  const userExplicitlyLocksCandidate = Boolean(state.candidateStyle && (isLockConfirmation(userInput) || inferred?.explicit));
  const userDelegatesFinalChoice = wantsImmediateRecommendation(userInput);

  if (canFallbackLock && (userExplicitlyLocksCandidate || userDelegatesFinalChoice)) {
    const selectedStyle = state.candidateStyle ?? getFallbackStyle(state.dislikedStyles);
    const response = buildLockedResponse(selectedStyle, state, userInput, {
      forced: !state.candidateStyle,
    });
    await persistLockedResponse(userId, response);
    state.lastRecommendedStyle = response.confirmed_style;
    state.candidateStyle = undefined;
    state.pendingMemoryStyle = undefined;
    return response;
  }

  return buildAskingResponse(state, userInput);
}

export async function POST(request: NextRequest) {
  let body: AgentRequest;

  try {
    body = (await request.json()) as AgentRequest;
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON。" }, { status: 400 });
  }

  const sessionId = normalizeText(body.session_id ?? "");
  const userId = normalizeText(body.user_id ?? "");
  const userInput = normalizeText(body.user_input ?? "");

  if (!sessionId || !userId) {
    return NextResponse.json({ error: "缺少 session_id 或 user_id。" }, { status: 400 });
  }

  const state = getSession(sessionId);
  const response = await createResponse(state, userId, userInput);
  rememberTurn(state, userInput, response.message);

  return NextResponse.json(response);
}

export async function DELETE(request: NextRequest) {
  let body: AgentRequest;

  try {
    body = (await request.json()) as AgentRequest;
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON。" }, { status: 400 });
  }

  const sessionId = normalizeText(body.session_id ?? "");
  const userId = normalizeText(body.user_id ?? "");

  if (!sessionId || !userId) {
    return NextResponse.json({ error: "缺少 session_id 或 user_id。" }, { status: 400 });
  }

  sessions.delete(sessionId);
  const deleted = await deletePreferences(userId);

  if (!deleted) {
    return NextResponse.json({ error: "长期记忆清除失败，请检查 Supabase 配置或权限。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
