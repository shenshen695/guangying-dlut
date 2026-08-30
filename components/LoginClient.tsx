"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CoralRule, Eyebrow, TopNav } from "@/components/guangying-ui";
import { getBackendUserState, roleLabel, signInWithEmail, signOut, signUpWithEmail, type BackendUserState, type Role, type SignupIntent } from "@/lib/supabase/backend";

type RegisterChoice = "user" | "photographer" | "club";

const registerOptions: Array<{ value: RegisterChoice; label: string; description: string }> = [
  { value: "user", label: "普通用户", description: "查看路线、地图和摄影者目录。" },
  { value: "photographer", label: "申请成为摄影师", description: "提交认证资料后等待管理员审核。" },
  { value: "club", label: "摄影社成员", description: "以摄影社成员身份提交认证申请。" },
];

export default function LoginClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("大工摄影者");
  const [registerChoice, setRegisterChoice] = useState<RegisterChoice>("user");
  const [state, setState] = useState<BackendUserState | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoUser, setDemoUser] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>("user");

  async function refreshState() {
    const nextState = await getBackendUserState();
    setState(nextState);
  }

  useEffect(() => {
    refreshState();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    const requestedRole: SignupIntent = registerChoice === "user" ? "user" : "photographer_pending";
    const identityType = registerChoice === "club" ? "摄影社成员" : registerChoice === "photographer" ? "摄影爱好者" : "普通用户";
    const result = mode === "login"
      ? await signInWithEmail(email.trim(), password)
      : await signUpWithEmail(email.trim(), password, displayName.trim(), requestedRole, identityType);
    setIsSubmitting(false);
    setMessage(result.message);
    if (result.ok && "demo" in result && result.demo) {
      setDemoUser(true);
      setDemoRole(mode === "register" ? requestedRole : "user");
    }
    if (result.ok) await refreshState();
  }

  async function logout() {
    await signOut();
    setDemoUser(false);
    setMessage("已退出登录。");
    await refreshState();
  }

  const isDemoMode = state?.mode === "demo";
  const currentEmail = state?.user?.email || (demoUser ? email || "demo@dlut.edu.cn" : "");
  const role = state?.profile?.role || (demoUser ? demoRole : "user");
  const selectedRegister = registerOptions.find((option) => option.value === registerChoice) || registerOptions[0];
  const roleActions = role === "admin"
    ? [
        { href: "/admin/submissions", label: "进入审核后台" },
        { href: "/contribute", label: "查看投稿入口" },
      ]
    : role === "photographer"
      ? [
          { href: "/photographer/dashboard", label: "进入摄影师后台" },
          { href: "/works/submit", label: "上传作品" },
          { href: "/contribute", label: "提交新机位" },
        ]
      : role === "photographer_pending"
        ? [
            { href: "/photographer/apply", label: "查看认证申请" },
            { href: "/", label: "返回首页" },
          ]
      : [
          { href: "/", label: "返回首页" },
          { href: "/map", label: "查看地图" },
          { href: "/photographer/apply", label: "申请成为摄影师" },
        ];

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="主页" actionLabel="返回首页" actionHref="/" />

        <section className="gy-auth-layout">
          <div className="gy-auth-copy">
            <Eyebrow muted>ACCOUNT</Eyebrow>
            <h1 className="gy-page-title">登录光影大工</h1>
            <CoralRule />
            <p className="gy-body-copy">用邮箱进入投稿、摄影师认证和审核后台；未登录也可以继续浏览路线与地图。</p>
          </div>

          <form className="gy-panel gy-auth-card" onSubmit={submit}>
            <div className="gy-auth-tabs">
              <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>邮箱登录</button>
              <button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => setMode("register")}>注册账号</button>
            </div>

            <p className="gy-backend-note">
              {isDemoMode ? "后端未连接，当前为演示状态。" : state?.configured ? "Supabase 已连接。" : "正在连接后端..."}
            </p>

            {currentEmail ? (
              <div className="gy-auth-state">
                <strong>{currentEmail}</strong>
                <span>身份：{roleLabel[role]}</span>
                <div className="gy-auth-entry-list">
                  {roleActions.map((item) => (
                    <Link key={item.href} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </div>
                <button type="button" onClick={logout}>退出登录</button>
              </div>
            ) : (
              <div className="gy-auth-state is-quiet">
                <strong>未登录</strong>
                <span>登录后进入对应身份入口。</span>
              </div>
            )}

            <div className="gy-form-grid gy-auth-form-grid">
              {mode === "register" ? (
                <>
                  <div className="gy-input-card">
                    <label>显示名称</label>
                    <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                  </div>
                  <div className="gy-input-card">
                    <label>注册身份</label>
                    <select value={registerChoice} onChange={(event) => setRegisterChoice(event.target.value as RegisterChoice)}>
                      {registerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </>
              ) : null}
              <div className="gy-input-card">
                <label>邮箱</label>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required={!isDemoMode} />
              </div>
              <div className="gy-input-card">
                <label>密码</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" required={!isDemoMode} />
              </div>
            </div>

            {message ? <p className="gy-submit-note">{message}</p> : null}
            {mode === "register" ? (
              <p className="gy-auth-register-note">
                {selectedRegister.label}：{selectedRegister.description}
                {registerChoice !== "user" ? " 还需要补充认证资料。" : ""}
              </p>
            ) : null}

            <div className="gy-work-submit-actions">
              <button type="submit" className="gy-primary-button" disabled={isSubmitting}>{isSubmitting ? "处理中..." : mode === "login" ? "登录" : "注册"}</button>
              <button type="button" className="gy-secondary-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "注册" : "返回登录"}
              </button>
            </div>

            <div className="gy-auth-links">
              <Link href="/photographer/apply">摄影师认证</Link>
              <Link href="/photographer/dashboard">摄影师后台</Link>
              <Link href="/admin/submissions">审核后台</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
