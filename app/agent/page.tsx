import ChatAgent from "@/components/ChatAgent";
import { CoralRule, Eyebrow, PageShell } from "@/components/guangying-ui";

const capabilities = [
  {
    title: "问出风格偏好",
    text: "把喜欢的画面、人数、穿搭、想去的点位说出来，系统会整理成可执行方向。",
  },
  {
    title: "记录不喜欢",
    text: "如果你说不要某种感觉，后续推荐会避开这个方向。",
  },
  {
    title: "给出拍摄建议",
    text: "输出适合季节、色彩、造型、点位和拍摄时间。",
  },
  {
    title: "进入路线生成",
    text: "风格锁定后自动把参数带到企划页，继续生成校园路线。",
  },
];

export default function AgentPage() {
  return (
    <PageShell active="风格" actionLabel="生成路线" actionHref="/planner" containerClassName="gy-agent-container">
      <section className="gy-agent-page-head">
        <div>
          <Eyebrow muted>STYLE AGENT</Eyebrow>
          <h1 className="gy-page-title">和 Agent 聊出风格</h1>
          <CoralRule />
          <p className="gy-body-copy">
            说出你想要的画面、同行人数和穿搭方向，光影大工会整理成路线生成所需的风格偏好。
          </p>
        </div>
        <aside className="gy-agent-capability-list gy-panel" aria-label="Agent 功能说明">
          {capabilities.map((item) => (
            <div key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </aside>
      </section>

      <ChatAgent />
    </PageShell>
  );
}
