"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { STYLE_AGENT_FIRST_MESSAGE, STYLE_AGENT_RULE_SUMMARY, STYLE_DEFINITIONS, type GraduationStyle, type RealSpot } from "@/lib/ai/prompts";
import { upsertPreferences } from "@/lib/ai/preferences";
import { getBackendUserState, type BackendUserState } from "@/lib/supabase/backend";

type ChatMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
};

type AgentResult = {
  style: GraduationStyle;
  plannerStyle: string;
  season: "春" | "夏" | "秋" | "冬";
  reason: string;
  scenes: readonly RealSpot[];
  colors: readonly string[];
  outfit: string;
  people: string;
  clothing: string;
  disliked: GraduationStyle[];
};

const styleKeywords: Array<{ style: GraduationStyle; words: string[] }> = [
  { style: "青春清透", words: ["清透", "明亮", "轻盈", "浅蓝", "花", "湖", "草坪", "自然光", "青春"] },
  { style: "学院风制服", words: ["学院", "制服", "正式", "图书馆", "教室", "整齐", "学士服", "主楼"] },
  { style: "端庄复古", words: ["复古", "胶片", "银杏", "老建筑", "温婉", "安静", "暖棕", "酒红"] },
  { style: "学位纪实", words: ["纪实", "自然", "抓拍", "朋友", "多人", "操场", "互动", "不摆拍"] },
];

const plannerStyleMap: Record<GraduationStyle, string> = {
  青春清透: "清透自然",
  学院风制服: "学院纪实",
  端庄复古: "复古胶片",
  学位纪实: "学院纪实",
};

const seasonWords: Array<{ season: AgentResult["season"]; words: string[] }> = [
  { season: "春", words: ["春", "花", "玉兰", "二月兰"] },
  { season: "夏", words: ["夏", "草坪", "湖", "清透", "毕业季"] },
  { season: "秋", words: ["秋", "银杏", "落叶", "复古"] },
  { season: "冬", words: ["冬", "雪", "冷", "室内"] },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function detectSeason(text: string): AgentResult["season"] {
  const hit = seasonWords.find((item) => item.words.some((word) => text.includes(word)));
  return hit?.season ?? "春";
}

function detectPeople(text: string) {
  if (/[5-9五六七八九十]/.test(text) || text.includes("多人") || text.includes("班级")) return "多人";
  if (/[2-4二三四两]/.test(text) || text.includes("朋友") || text.includes("闺蜜")) return "小团体";
  if (text.includes("一个人") || text.includes("独照")) return "独照";
  return "未明确";
}

function detectClothing(text: string) {
  if (text.includes("白裙")) return "白裙子";
  if (text.includes("学士服")) return "学士服";
  if (text.includes("制服")) return "制服";
  if (text.includes("衬衫")) return "衬衫";
  return "未明确";
}

function detectDisliked(text: string): GraduationStyle[] {
  if (!/(不喜欢|不要|换一个|别|不想)/.test(text)) return [];
  return styleKeywords.filter((item) => item.words.some((word) => text.includes(word)) || text.includes(item.style)).map((item) => item.style);
}

function buildResult(allText: string, disliked: GraduationStyle[]): AgentResult {
  const scored = scoreStyle(allText, disliked);
  const style = scored && scored.score > 0 ? scored.style : "青春清透";
  const definition = STYLE_DEFINITIONS[style];
  const clothing = detectClothing(allText);
  const people = detectPeople(allText);
  const outfit = clothing === "未明确"
    ? `建议以${definition.colors.slice(0, 2).join("、")}为主色，保持统一但不完全一样。`
    : `围绕${clothing}做统一色系，外搭和鞋子控制在${definition.colors.slice(0, 2).join("、")}附近。`;

  return {
    style,
    plannerStyle: plannerStyleMap[style],
    season: detectSeason(allText),
    reason: `根据你提到的画面、人数和衣着，更适合先走「${style}」方向。`,
    scenes: definition.scenes,
    colors: definition.colors,
    outfit,
    people,
    clothing,
    disliked,
  };
}

export default function StyleAgentPanel() {
  const [backendState, setBackendState] = useState<BackendUserState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "agent-first", role: "agent", content: STYLE_AGENT_FIRST_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [disliked, setDisliked] = useState<GraduationStyle[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);

  useEffect(() => {
    getBackendUserState().then(setBackendState);
    const cached = window.localStorage.getItem("guangying_style_agent_last_result");
    if (cached) {
      try {
        setResult(JSON.parse(cached) as AgentResult);
      } catch {
        window.localStorage.removeItem("guangying_style_agent_last_result");
      }
    }
  }, []);

  const userTurns = useMemo(() => messages.filter((message) => message.role === "user").length, [messages]);
  const plannerHref = result ? `/planner?style=${encodeURIComponent(result.plannerStyle)}&season=${encodeURIComponent(result.season)}&source=agent` : "/planner";

  async function saveResult(nextResult: AgentResult) {
    window.localStorage.setItem("guangying_style_agent_last_result", JSON.stringify(nextResult));
    if (backendState?.user?.id) {
      await upsertPreferences({
        user_id: backendState.user.id,
        preferred_style: nextResult.style,
        preferred_colors: [...nextResult.colors],
        preferred_scenes: [...nextResult.scenes],
        people_preference: nextResult.people,
        clothing_mentioned: nextResult.clothing,
        disliked_styles: nextResult.disliked,
      });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    const nextDisliked = Array.from(new Set([...disliked, ...detectDisliked(text)]));
    const nextMessages = [...messages, { id: createId("user"), role: "user" as const, content: text }];
    const allText = nextMessages.filter((message) => message.role === "user").map((message) => message.content).join(" ");
    const locked = /确定|就这个|可以|按你推荐|生成/.test(text) || userTurns >= 2;
    const nextResult = buildResult(allText, nextDisliked);
    const answer = locked
      ? `${nextResult.reason} 推荐点位可以从${nextResult.scenes.slice(0, 3).join("、")}开始，穿搭建议：${nextResult.outfit}`
      : "我先记下这个方向。你更想要正式一点，还是更像朋友同行的抓拍？也可以补充人数、衣服颜色或想去的点位。";

    setInput("");
    setDisliked(nextDisliked);
    setMessages([...nextMessages, { id: createId("agent"), role: "agent", content: answer }]);
    if (locked) {
      setResult(nextResult);
      await saveResult(nextResult);
    }
  }

  return (
    <section className="gy-style-agent-panel gy-panel">
      <div className="gy-style-agent-head">
        <div>
          <span>AI STYLE AGENT</span>
          <h2>风格问答</h2>
        </div>
        <small>{backendState?.configured ? "登录后同步偏好" : "本次会话记录"}</small>
      </div>
      <p className="gy-style-agent-note">{STYLE_AGENT_RULE_SUMMARY}</p>
      <div className="gy-style-agent-stream">
        {messages.slice(-5).map((message) => (
          <div key={message.id} className={message.role === "user" ? "is-user" : "is-agent"}>
            <span>{message.role === "user" ? "你" : "Agent"}</span>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      <form className="gy-style-agent-form" onSubmit={submit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="例：5个人，想要清透，白裙子，湖边" />
        <button type="submit">发送</button>
      </form>
      {result ? (
        <div className="gy-style-agent-result">
          <strong>{result.style}</strong>
          <span>{result.colors.join(" / ")}</span>
          <p>{result.scenes.slice(0, 3).join("、")} · {result.season}季</p>
          <Link href={plannerHref}>用这个偏好生成路线 ↗</Link>
        </div>
      ) : null}
    </section>
  );
}
