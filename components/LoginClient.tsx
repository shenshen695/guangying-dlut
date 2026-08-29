"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CoralRule, Eyebrow, TopNav } from "@/components/guangying-ui";
import { getBackendUserState, signInWithEmail, signOut, signUpWithEmail, type BackendUserState } from "@/lib/supabase/backend";

export default function LoginClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("大工摄影者");
  const [state, setState] = useState<BackendUserState | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoUser, setDemoUser] = useState(false);

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
    const result = mode === "login"
      ? await signInWithEmail(email.trim(), password)
      : await signUpWithEmail(email.trim(), password, displayName.trim());
    setIsSubmitting(false);
    setMessage(result.message);
    if (result.ok && "demo" in result && result.demo) setDemoUser(true);
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
  const role = state?.profile?.role || (demoUser ? "photographer" : "user");
  const roleLabel = role === "admin" ? "管理员" : role === "photographer" ? "摄影师" : "普通用户";
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
      : [
          { href: "/", label: "返回首页" },
          { href: "/map", label: "查看地图" },
        ];

  const identities = [
    { title: "普通用户", text: "查看毕业路线、校园影像地图和摄影者档案。" },
    { title: "摄影师", text: "提交机位、上传作品，并维护自己的摄影者主页。" },
    { title: "管理员", text: "审核点位与作品投稿，保持内容真实可用。" },
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
            <p className="gy-body-copy">摄影师可提交点位与作品，管理员可审核共建内容。未登录也可以继续浏览路线、地图和摄影者目录。</p>
            <div className="gy-identity-list" aria-label="账号身份说明">
              {identities.map((item) => (
                <article key={item.title} className="gy-identity-card">
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </article>
              ))}
            </div>
          </div>

          <form className="gy-panel gy-auth-card" onSubmit={submit}>
            <div className="gy-auth-tabs">
              <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>邮箱登录</button>
              <button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => setMode("register")}>注册账号</button>
            </div>

            <p className="gy-backend-note">
              {isDemoMode ? "当前为演示模式，后端未连接；登录动作只展示本地状态。" : state?.configured ? "Supabase 已连接，请使用项目中已创建的账号登录。" : "正在检查后端状态..."}
            </p>

            {currentEmail ? (
              <div className="gy-auth-state">
                <span>当前登录状态</span>
                <strong>{currentEmail}</strong>
                <span>身份：{roleLabel}</span>
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
                <span>当前登录状态</span>
                <strong>未登录</strong>
                <span>登录后可进入投稿、摄影师后台或审核后台。</span>
              </div>
            )}

            <div className="gy-form-grid gy-auth-form-grid">
              {mode === "register" ? (
                <div className="gy-input-card">
                  <label>显示名称</label>
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </div>
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

            <div className="gy-work-submit-actions">
              <button type="submit" className="gy-primary-button" disabled={isSubmitting}>{isSubmitting ? "处理中..." : mode === "login" ? "登录" : "注册"}</button>
              <button type="button" className="gy-secondary-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "注册" : "返回登录"}
              </button>
            </div>

            <div className="gy-auth-links">
              <Link href="/">返回首页</Link>
              <Link href="/photographer/dashboard">摄影师后台</Link>
              <Link href="/admin/submissions">审核后台</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
