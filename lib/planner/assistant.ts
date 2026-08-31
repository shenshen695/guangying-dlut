import spotsData from "@/data/spots.json";
import type { PlannerDraft, PlannerDuration, PlannerMood, PlannerShootType, PlannerTime } from "@/types/planner";
import type { Spot } from "@/types/spot";
import { parsePeopleCount } from "@/lib/planner/people";

const spots = spotsData as Spot[];

// 光影大工 Product V2：这是未来接入真实 AI API 的唯一解析边界；当前使用可替换的本地 mock 解析器。
export async function parsePlannerRequest(prompt: string): Promise<PlannerDraft> {
  const text = prompt.trim();
  const uncertainFields: PlannerDraft["uncertainFields"] = [];

  const shootType = matchFirst<PlannerShootType>(text, ["毕业照", "情侣照", "校园写真", "风景", "建筑"]) || "校园写真";
  if (!["毕业照", "情侣照", "校园写真", "风景", "建筑"].some((item) => text.includes(item))) uncertainFields.push("shootType");

  const peopleCount = parsePeopleCount(text);
  if (peopleCount === null) uncertainFields.push("peopleCount");

  const duration = text.includes("半天") ? "半天" : text.includes("30") ? "30 分钟" : /(?:2|两)\s*小时/.test(text) ? "2 小时" : /(?:1|一)\s*小时/.test(text) ? "1 小时" : "2 小时";
  if (!text.includes("半天") && !text.includes("分钟") && !text.includes("小时")) uncertainFields.push("duration");

  const mood = matchFirst<PlannerMood>(text, ["日落感", "建筑感", "青春感", "湖边", "自然纪实"]) || (text.includes("日落") ? "日落感" : text.includes("建筑") ? "建筑感" : "自然纪实");
  if (!["日落", "建筑", "青春", "湖边", "自然", "纪实"].some((item) => text.includes(item))) uncertainFields.push("mood");

  const timeOfDay: PlannerTime = text.includes("今晚") || text.includes("傍晚") || text.includes("日落") ? "傍晚" : text.includes("上午") || text.includes("早上") ? "上午" : text.includes("下午") ? "下午" : "时间灵活";
  if (timeOfDay === "时间灵活") uncertainFields.push("timeOfDay");

  const selectedSpotIds = spots.filter((spot) => text.includes(spot.name)).map((spot) => spot.id);
  if (!selectedSpotIds.length) uncertainFields.push("selectedSpotIds");

  return { sourcePrompt: text, shootType, peopleCount, duration: duration as PlannerDuration, mood, timeOfDay, selectedSpotIds, uncertainFields };
}

function matchFirst<T extends string>(text: string, values: readonly T[]): T | null {
  return values.find((value) => text.includes(value)) || null;
}
