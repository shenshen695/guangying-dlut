import ChatAgent from "@/components/ChatAgent";
import { CoralRule, Eyebrow, PageShell } from "@/components/guangying-ui";

export default function AgentPage() {
  return (
    <PageShell active="风格" actionLabel="生成路线" actionHref="/planner" containerClassName="gy-agent-container">
      <section className="gy-agent-page-head is-simple">
        <div>
          <Eyebrow muted>STYLE AGENT</Eyebrow>
          <h1 className="gy-page-title">和 Agent 聊出风格</h1>
          <CoralRule />
          <p className="gy-body-copy">
            说出你想要的画面、人数、穿搭或不喜欢的感觉，确认后进入路线生成。
          </p>
        </div>
      </section>

      <ChatAgent />
    </PageShell>
  );
}
