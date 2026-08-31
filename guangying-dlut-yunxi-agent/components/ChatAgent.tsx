"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppIcon from "@/components/AppIcon";
import { STYLE_AGENT_FIRST_MESSAGE } from "@/lib/ai/prompts";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AgentResponse = {
  status: "asking" | "locked";
  message: string;
  confirmed_style?: string;
  recommendation: null | {
    color_palette: string[];
    outfit: { top: string; bottom: string; shoes: string; accessory: string };
    scenes: string[];
    shoot_time: string;
    actions: string[];
    style_note: string;
  };
  memory_update?: {
    preferred_style: string;
    preferred_colors: string[];
    preferred_scenes: string[];
    people_preference: string;
    clothing_mentioned: string;
    disliked_styles: string[];
  };
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getStoredId(storage: Storage, key: string, prefix: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const next = createId(prefix).replace(`${prefix}-`, "");
  storage.setItem(key, next);
  return next;
}

export default function ChatAgent() {
  const router = useRouter();
  const initialized = useRef(false);
  const sessionId = useRef("");
  const userId = useRef("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestAgent(userInput: string) {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId.current, user_id: userId.current, user_input: userInput }),
    });

    if (!response.ok) throw new Error("Agent 暂时没有回应，请稍后再试。");
    return (await response.json()) as AgentResponse;
  }

  function appendAssistant(payload: AgentResponse) {
    setMessages((current) => [...current, { id: createId("assistant"), role: "assistant", content: payload.message }]);

    if (payload.status === "locked" && payload.recommendation) {
      const cache = JSON.stringify(payload);
      sessionStorage.setItem("guangying_style_agent_result", cache);
      localStorage.setItem("guangying_style_agent_last_result", cache);
      window.setTimeout(() => router.push("/result/"), 650);
    }
  }

  async function resetMemory() {
    if (loading) return;
    if (!window.confirm("确定要重置对话和已保存的风格记忆吗？")) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId.current, user_id: userId.current }),
      });

      if (!response.ok) throw new Error("记忆重置失败，请稍后再试。");

      const nextSessionId = createId("session").replace("session-", "");
      sessionId.current = nextSessionId;
      sessionStorage.setItem("guangying_style_agent_session_id", nextSessionId);
      sessionStorage.removeItem("guangying_style_agent_result");
      localStorage.removeItem("guangying_style_agent_last_result");
      setMessages([]);
      setInput("");
      appendAssistant(await requestAgent(""));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "记忆重置失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    sessionId.current = getStoredId(sessionStorage, "guangying_style_agent_session_id", "session");
    userId.current = getStoredId(localStorage, "guangying_style_agent_user_id", "user");
    setLoading(true);
    requestAgent("")
      .then(appendAssistant)
      .catch(() => setMessages([{ id: createId("assistant"), role: "assistant", content: STYLE_AGENT_FIRST_MESSAGE }]))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");
    setLoading(true);
    setMessages((current) => [...current, { id: createId("user"), role: "user", content: text }]);

    try {
      appendAssistant(await requestAgent(text));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Agent 暂时没有回应，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="毕业照风格 Agent" className="mt-5 space-y-3">
      <div className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_5px_18px_rgba(15,23,42,.06)] sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e7f1f1] text-sea"><AppIcon name="sparkles" className="h-4 w-4" /></span>
            <div><p className="text-[12px] font-semibold text-ink">风格对话</p><p className="text-[10px] text-slate-400">聊到你真正满意为止</p></div>
          </div>
          <button type="button" onClick={resetMemory} disabled={loading} title="清除当前对话和已保存的风格偏好" className="flex h-8 items-center gap-1 rounded-[9px] border border-slate-200 px-2.5 text-[10px] font-semibold text-slate-500 transition hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-50"><AppIcon name="rotate" className="h-3.5 w-3.5" />重置记忆</button>
        </div>

        <div aria-live="polite" className="scrollbar-none flex max-h-[54vh] min-h-[300px] flex-col gap-3 overflow-y-auto px-1 py-1">
          {messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-[15px] px-3.5 py-2.5 text-[13px] leading-6 ${message.role === "user" ? "rounded-br-[5px] bg-sea text-white" : "rounded-bl-[5px] bg-mist text-slate-700"}`}><p className={`mb-1 text-[10px] font-semibold ${message.role === "user" ? "text-white/70" : "text-sea"}`}>{message.role === "user" ? "你" : "光影大工 Agent"}</p><p className="whitespace-pre-wrap break-words">{message.content}</p></div></div>)}
          {loading && <div className="flex justify-start"><div className="rounded-[15px] rounded-bl-[5px] bg-mist px-3.5 py-2.5 text-[12px] text-slate-500">正在整理你的偏好...</div></div>}
        </div>

        {error && <p className="mt-2 rounded-[10px] bg-[#fff4ed] px-3 py-2 text-[11px] leading-5 text-coral">{error}</p>}

        <form onSubmit={submit} className="mt-3 flex items-end gap-2 border-t border-slate-100 pt-3">
          <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={2} placeholder="描述你想要的画面、人数、衣服或校园场景..." aria-label="输入毕业照风格偏好" className="min-h-[48px] flex-1 resize-none rounded-[12px] bg-mist px-3 py-2.5 text-[13px] leading-5 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#d5e8e8]" />
          <button type="submit" disabled={loading || !input.trim()} aria-label="发送消息" className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-sea text-white transition hover:bg-[#124f53] disabled:cursor-not-allowed disabled:bg-slate-200"><AppIcon name="send" className="h-[18px] w-[18px]" /></button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
        <div className="rounded-[12px] bg-white px-2 py-3"><AppIcon name="sparkles" className="mx-auto mb-1 h-4 w-4 text-sea" /><p>自然聊天</p></div>
        <div className="rounded-[12px] bg-white px-2 py-3"><AppIcon name="heart" className="mx-auto mb-1 h-4 w-4 text-coral" /><p>记住偏好</p></div>
        <div className="rounded-[12px] bg-white px-2 py-3"><AppIcon name="camera" className="mx-auto mb-1 h-4 w-4 text-sea" /><p>生成穿搭</p></div>
      </div>
    </section>
  );
}
