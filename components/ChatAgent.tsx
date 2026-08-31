"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STYLE_AGENT_FIRST_MESSAGE, type GraduationStyle } from "@/lib/ai/prompts";
import { plannerStyleMap, runLocalStyleAgent, type AgentResponse } from "@/lib/ai/localAgent";
import { getPreferences, updateDisliked, upsertPreferences } from "@/lib/ai/preferences";
import { getBackendUserState, type BackendUserState } from "@/lib/supabase/backend";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getStoredId(storage: Storage, key: string, prefix: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const next = createId(prefix).replace(`${prefix}-`, "");
  storage.setItem(key, next);
  return next;
}

function getSeasonHint(text: string) {
  if (/夏|暑|蓝天|草坪/.test(text)) return "夏";
  if (/秋|银杏|落叶|复古/.test(text)) return "秋";
  if (/冬|雪|冷|室内/.test(text)) return "冬";
  return "春";
}

export default function ChatAgent() {
  const router = useRouter();
  const initialized = useRef(false);
  const sessionId = useRef("");
  const userId = useRef("");
  const [backendState, setBackendState] = useState<BackendUserState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [disliked, setDisliked] = useState<GraduationStyle[]>([]);

  function appendAssistant(payload: AgentResponse, allUserText: string) {
    setMessages((current) => [...current, { id: createId("assistant"), role: "assistant", content: payload.message }]);

    if (payload.memory_update) {
      setDisliked(payload.memory_update.disliked_styles);
    }

    if (payload.status === "locked" && payload.recommendation && payload.confirmed_style) {
      const cache = JSON.stringify(payload);
      sessionStorage.setItem("guangying_style_agent_result", cache);
      localStorage.setItem("guangying_style_agent_last_result", cache);
      const plannerStyle = plannerStyleMap[payload.confirmed_style];
      const season = getSeasonHint(allUserText);
      window.setTimeout(() => router.push(`/planner?style=${encodeURIComponent(plannerStyle)}&season=${encodeURIComponent(season)}&source=agent`), 650);
    }
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    sessionId.current = getStoredId(sessionStorage, "guangying_style_agent_session_id", "session");
    userId.current = getStoredId(localStorage, "guangying_style_agent_user_id", "user");

    setLoading(true);
    getBackendUserState()
      .then(async (state) => {
        setBackendState(state);
        const realUserId = state.user?.id || userId.current;
        const preferences = await getPreferences(realUserId);
        if (preferences?.disliked_styles?.length) setDisliked(preferences.disliked_styles);
        if (preferences?.preferred_style) {
          setMessages([{ id: createId("assistant"), role: "assistant", content: `根据你上次的选择，我记得你偏向「${preferences.preferred_style}」。这次要沿用它，还是换一个方向？` }]);
          return;
        }
        setMessages([{ id: createId("assistant"), role: "assistant", content: STYLE_AGENT_FIRST_MESSAGE }]);
      })
      .catch(() => {
        setMessages([{ id: createId("assistant"), role: "assistant", content: STYLE_AGENT_FIRST_MESSAGE }]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userHistory = messages.filter((message) => message.role === "user").map((message) => message.content);
    const nextMessages = [...messages, { id: createId("user"), role: "user" as const, content: text }];
    const allUserText = [...userHistory, text].join(" ");

    setInput("");
    setError("");
    setLoading(true);
    setMessages(nextMessages);

    try {
      const payload = runLocalStyleAgent({
        userInput: text,
        history: userHistory,
        userTurns: userHistory.length + 1,
        dislikedStyles: disliked,
      });
      const realUserId = backendState?.user?.id || userId.current;
      if (payload.memory_update) {
        await upsertPreferences({ user_id: realUserId, ...payload.memory_update });
      } else if (disliked.length) {
        await updateDisliked(realUserId, disliked);
      }
      appendAssistant(payload, allUserText);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Agent 暂时没有回应，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="gy-chat-agent" aria-label="风格确定 Agent">
      <div className="gy-chat-agent-main gy-panel">
        <div className="gy-chat-stream" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className={`gy-chat-row ${message.role === "user" ? "is-user" : "is-agent"}`}>
              <div className="gy-chat-bubble">
                <span>{message.role === "user" ? "你" : "光影大工 Agent"}</span>
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          {loading ? (
            <div className="gy-chat-row is-agent">
              <div className="gy-chat-bubble is-loading">
                <span>光影大工 Agent</span>
                <p>正在整理你的偏好...</p>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="gy-chat-error">{error}</p> : null}

        <form onSubmit={submit} className="gy-chat-form">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="例如：我想要明亮一点，5 个人，有白裙子"
            aria-label="输入你的毕业照风格偏好"
          />
          <button type="submit" className="gy-primary-button" disabled={loading || !input.trim()}>
            发送
          </button>
        </form>
      </div>

      <aside className="gy-chat-agent-side gy-panel">
        <h2>Agent 会记住这些</h2>
        <div>
          <strong>风格偏好</strong>
          <p>从你的描述里锁定青春清透、学院风制服、端庄复古或学位纪实。</p>
        </div>
        <div>
          <strong>穿搭细节</strong>
          <p>白裙子、多人、怕冷、学士服等信息都会进入最终推荐。</p>
        </div>
        <div>
          <strong>负反馈</strong>
          <p>你说不喜欢或换一个后，后续不会再主动推荐那个风格。</p>
        </div>
      </aside>
    </section>
  );
}
