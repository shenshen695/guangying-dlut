"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "idle" | "q1" | "q2" | "q3" | "result";

type Answers = {
  vibe: string;
  season: string;
  group: string;
};

type StyleResult = {
  name: string;
  reason: string;
  href: string;
};

const STYLE_MAP: Record<string, Record<string, Record<string, StyleResult>>> = {
  // vibe -> season -> group -> result
  轻松: {
    春: {
      独照: { name: "清透自然", reason: "春天柔光 + 独照，清透自然最出片，干净不过度摆拍。", href: "/planner?style=清透自然&season=春" },
      "2-3人": { name: "Citywalk感", reason: "春天适合边走边拍，小团体抓拍比站定合影更自然。", href: "/planner?style=Citywalk感&season=春" },
      多人: { name: "多巴胺轻彩", reason: "多人场景需要点颜色提气，多巴胺轻彩刚好热闹但不杂乱。", href: "/planner?style=多巴胺轻彩&season=春" },
    },
    夏: {
      独照: { name: "清透自然", reason: "夏天光线强，清透自然压住对比度，画面还是干净的。", href: "/planner?style=清透自然&season=夏" },
      "2-3人": { name: "多巴胺轻彩", reason: "夏天草坪花墙，多巴胺配色出画面，几个人拍也很轻快。", href: "/planner?style=多巴胺轻彩&season=夏" },
      多人: { name: "多巴胺轻彩", reason: "多人夏日首选，颜色活泼、场地开阔，统一色系就很好看。", href: "/planner?style=多巴胺轻彩&season=夏" },
    },
    秋: {
      独照: { name: "Citywalk感", reason: "秋天漫步路线，一个人走走拍拍，不强摆自然出片。", href: "/planner?style=Citywalk感&season=秋" },
      "2-3人": { name: "Citywalk感", reason: "小团体秋游感，边走边聊的抓拍比摆拍有意思。", href: "/planner?style=Citywalk感&season=秋" },
      多人: { name: "学院纪实", reason: "多人秋天适合学院纪实，课堂感和同行感都能拍到。", href: "/planner?style=学院纪实&season=秋" },
    },
    冬: {
      独照: { name: "低饱和", reason: "冬天阴天多，低饱和把灰调变成优势，画面安静但有质感。", href: "/planner?style=低饱和&season=冬" },
      "2-3人": { name: "低饱和", reason: "冬日几个人沿湖边走，低饱和压色，比鲜艳更耐看。", href: "/planner?style=低饱和&season=冬" },
      多人: { name: "学院纪实", reason: "多人冬天适合学院纪实，建筑线条稳，合影有纪念感。", href: "/planner?style=学院纪实&season=冬" },
    },
  },
  正式: {
    春: {
      独照: { name: "学院纪实", reason: "春天自然光配学院纪实，白衬衫 + 台阶，经典毕业照质感。", href: "/planner?style=学院纪实&season=春" },
      "2-3人": { name: "学院纪实", reason: "几个人并肩走过主楼或伯川，这就是毕业纪实该有的样子。", href: "/planner?style=学院纪实&season=春" },
      多人: { name: "学院纪实", reason: "班级合影、台阶站位，学院纪实最适合大合影的毕业感。", href: "/planner?style=学院纪实&season=春" },
    },
    夏: {
      独照: { name: "学院纪实", reason: "夏天上午光线清晰，学院纪实把建筑线条和人物都交代清楚。", href: "/planner?style=学院纪实&season=夏" },
      "2-3人": { name: "学院纪实", reason: "小团体正式毕业照首选，不管是并肩还是台阶合影都稳。", href: "/planner?style=学院纪实&season=夏" },
      多人: { name: "学院纪实", reason: "多人正式合影，学院纪实给足框架感，不怕人多出画面乱。", href: "/planner?style=学院纪实&season=夏" },
    },
    秋: {
      独照: { name: "新中式", reason: "秋天石阶和树荫，新中式压住了正式感但不显呆板。", href: "/planner?style=新中式&season=秋" },
      "2-3人": { name: "新中式", reason: "几个人在伯川或门廊，新中式的克制感反而更有纪念意义。", href: "/planner?style=新中式&season=秋" },
      多人: { name: "学院纪实", reason: "多人秋天正式合影，学院纪实把银杏和建筑都用进来。", href: "/planner?style=学院纪实&season=秋" },
    },
    冬: {
      独照: { name: "新中式", reason: "冬天清晨冷色调，新中式月白和墨绿搭校园石阶，安静正式。", href: "/planner?style=新中式&season=冬" },
      "2-3人": { name: "新中式", reason: "冬日小团体，新中式含蓄克制，有点凛冬纪念感。", href: "/planner?style=新中式&season=冬" },
      多人: { name: "学院纪实", reason: "冬天多人还是学院纪实稳，主楼前的大合影永远不会错。", href: "/planner?style=学院纪实&season=冬" },
    },
  },
  文艺: {
    春: {
      独照: { name: "清透自然", reason: "春天二月兰和柔光，清透自然让独照安静又有点诗意。", href: "/planner?style=清透自然&season=春" },
      "2-3人": { name: "清透自然", reason: "几个人在花丛边漫走，清透自然不强求构图，随手出片。", href: "/planner?style=清透自然&season=春" },
      多人: { name: "多巴胺轻彩", reason: "多人春天文艺感用多巴胺轻彩，花墙和草坪做背景很跳脱。", href: "/planner?style=多巴胺轻彩&season=春" },
    },
    夏: {
      独照: { name: "电影氛围", reason: "夏日黄昏逆光，独照剪影配电影氛围，这种光线本来就是答案。", href: "/planner?style=电影氛围&season=夏" },
      "2-3人": { name: "低饱和", reason: "夏天几个人在湖边，低饱和压住燥热感，画面更沉静。", href: "/planner?style=低饱和&season=夏" },
      多人: { name: "Citywalk感", reason: "多人夏天文艺感就是一起乱走，Citywalk抓拍比摆拍有意思。", href: "/planner?style=Citywalk感&season=夏" },
    },
    秋: {
      独照: { name: "复古胶片", reason: "秋天银杏和暖色调，复古胶片把每张都拍成相册里的那一页。", href: "/planner?style=复古胶片&season=秋" },
      "2-3人": { name: "复古胶片", reason: "几个人在伯川长廊，复古胶片的树影和颗粒感是秋天独有的。", href: "/planner?style=复古胶片&season=秋" },
      多人: { name: "复古胶片", reason: "多人秋天文艺感，复古胶片是最容易统一画面调性的风格。", href: "/planner?style=复古胶片&season=秋" },
    },
    冬: {
      独照: { name: "电影氛围", reason: "冬天黄昏金色光，独照剪影 + 电影氛围，收尾感极强。", href: "/planner?style=电影氛围&season=冬" },
      "2-3人": { name: "电影氛围", reason: "冬日小团体黄昏拍，电影感逆光把画面和情绪一起收进去。", href: "/planner?style=电影氛围&season=冬" },
      多人: { name: "低饱和", reason: "多人冬天文艺感，低饱和灰调让人数多也不显乱。", href: "/planner?style=低饱和&season=冬" },
    },
  },
  活泼: {
    春: {
      独照: { name: "多巴胺轻彩", reason: "春天花墙 + 独照，多巴胺轻彩的浅色亮度刚好热闹但不闹腾。", href: "/planner?style=多巴胺轻彩&season=春" },
      "2-3人": { name: "多巴胺轻彩", reason: "几个人春天一起拍，多巴胺配色让画面立刻有活力。", href: "/planner?style=多巴胺轻彩&season=春" },
      多人: { name: "多巴胺轻彩", reason: "多人活泼场景的最佳搭档，统一浅色系道具，热闹但有序。", href: "/planner?style=多巴胺轻彩&season=春" },
    },
    夏: {
      独照: { name: "多巴胺轻彩", reason: "夏天草坪和湖边，浅黄天蓝草绿，独照活泼出片。", href: "/planner?style=多巴胺轻彩&season=夏" },
      "2-3人": { name: "多巴胺轻彩", reason: "夏天几个人配上颜色，Citywalk 或花墙都能出活泼感。", href: "/planner?style=多巴胺轻彩&season=夏" },
      多人: { name: "多巴胺轻彩", reason: "多人夏天活泼首选，颜色、人数和开阔场地三样都对了。", href: "/planner?style=多巴胺轻彩&season=夏" },
    },
    秋: {
      独照: { name: "Citywalk感", reason: "秋天活泼感就是走走逛逛，Citywalk 抓拍最真实。", href: "/planner?style=Citywalk感&season=秋" },
      "2-3人": { name: "Citywalk感", reason: "小团体秋天活泼，边走边互动，Citywalk 拍出来最有感染力。", href: "/planner?style=Citywalk感&season=秋" },
      多人: { name: "多巴胺轻彩", reason: "多人秋天活泼感，多巴胺轻彩加点暖色道具，场面热闹但不失控。", href: "/planner?style=多巴胺轻彩&season=秋" },
    },
    冬: {
      独照: { name: "清透自然", reason: "冬天活泼感反差玩得好就是清透，白色系独照轻松不拖沓。", href: "/planner?style=清透自然&season=冬" },
      "2-3人": { name: "Citywalk感", reason: "冬天几个人一起走，Citywalk 的漫步感比刻意摆拍更活泼。", href: "/planner?style=Citywalk感&season=冬" },
      多人: { name: "多巴胺轻彩", reason: "冬天多人用点颜色，多巴胺轻彩让画面暖起来，活泼有温度。", href: "/planner?style=多巴胺轻彩&season=冬" },
    },
  },
};

const Q1_OPTIONS = ["轻松", "正式", "文艺", "活泼"];
const Q2_OPTIONS = ["春", "夏", "秋", "冬"];
const Q3_OPTIONS = ["独照", "2-3人", "多人"];

function getResult(answers: Answers): StyleResult {
  return (
    STYLE_MAP[answers.vibe]?.[answers.season]?.[answers.group] ?? {
      name: "清透自然",
      reason: "综合来看，清透自然是最稳的起点，光线和场地要求都不高。",
      href: "/planner?style=清透自然",
    }
  );
}

export default function StyleAdvisor() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("q1");
  const [answers, setAnswers] = useState<Partial<Answers>>({});

  function reset() {
    setStep("q1");
    setAnswers({});
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  function pick(field: keyof Answers, value: string) {
    const next = { ...answers, [field]: value } as Answers;
    setAnswers(next);
    if (field === "vibe") setStep("q2");
    else if (field === "season") setStep("q3");
    else setStep("result");
  }

  const result = step === "result" ? getResult(answers as Answers) : null;

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        className="gy-advisor-trigger"
        aria-label="帮我选风格"
        onClick={() => setOpen(true)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 8c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 1.5-1.5 2-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="14" r="1" fill="currentColor" />
        </svg>
        帮我选风格
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="gy-advisor-backdrop"
          aria-hidden
          onClick={close}
        />
      )}

      {/* Panel */}
      <div className={`gy-advisor-panel${open ? " is-open" : ""}`} role="dialog" aria-label="风格推荐助手">
        <div className="gy-advisor-header">
          <span className="gy-advisor-title">找到你的风格</span>
          <button type="button" className="gy-advisor-close" onClick={close} aria-label="关闭">×</button>
        </div>

        <div className="gy-advisor-body">
          {step === "q1" && (
            <>
              <p className="gy-advisor-q">你想要什么感觉的毕业照？</p>
              <div className="gy-advisor-options">
                {Q1_OPTIONS.map((opt) => (
                  <button key={opt} type="button" className="gy-advisor-opt" onClick={() => pick("vibe", opt)}>
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "q2" && (
            <>
              <p className="gy-advisor-breadcrumb">{answers.vibe} →</p>
              <p className="gy-advisor-q">打算什么季节拍？</p>
              <div className="gy-advisor-options">
                {Q2_OPTIONS.map((opt) => (
                  <button key={opt} type="button" className="gy-advisor-opt" onClick={() => pick("season", opt)}>
                    {opt}
                  </button>
                ))}
              </div>
              <button type="button" className="gy-advisor-back" onClick={() => setStep("q1")}>← 重选</button>
            </>
          )}

          {step === "q3" && (
            <>
              <p className="gy-advisor-breadcrumb">{answers.vibe} → {answers.season} →</p>
              <p className="gy-advisor-q">几个人一起拍？</p>
              <div className="gy-advisor-options">
                {Q3_OPTIONS.map((opt) => (
                  <button key={opt} type="button" className="gy-advisor-opt" onClick={() => pick("group", opt)}>
                    {opt}
                  </button>
                ))}
              </div>
              <button type="button" className="gy-advisor-back" onClick={() => setStep("q2")}>← 重选</button>
            </>
          )}

          {step === "result" && result && (
            <div className="gy-advisor-result">
              <p className="gy-advisor-breadcrumb">{answers.vibe} · {answers.season} · {answers.group}</p>
              <p className="gy-advisor-result-label">推荐风格</p>
              <h3 className="gy-advisor-result-name">{result.name}</h3>
              <p className="gy-advisor-result-reason">{result.reason}</p>
              <Link href={result.href} className="gy-primary-button gy-advisor-cta" onClick={close}>
                用这个风格生成路线 →
              </Link>
              <button type="button" className="gy-advisor-back" style={{ marginTop: 10 }} onClick={reset}>
                重新选择
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
