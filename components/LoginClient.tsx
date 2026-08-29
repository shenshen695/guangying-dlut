"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CoralRule, Eyebrow, TopNav } from "@/components/guangying-ui";
import { getBackendUserState, signInWithEmail, signOut, signUpWithEmail, type BackendUserState } from "@/lib/supabase/backend";

export default function LoginClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@dlut.edu.cn");
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
  const currentEmail = state?.user?.email || (demoUser ? email : "");
  const role = state?.profile?.role || (demoUser ? "photographer" : "user");

  return (
    <main className="gy-page">
      <div className="gy-container">
        <TopNav active="主页" actionLabel="返回首页" actionHref="/" />

        <section className="gy-auth-layout">
          <div className="gy-auth-copy">
            <Eyebrow muted>ACCOUNT</Eyebrow>
            <h1 className="gy-page-title">登录光影大工</h1>
            <CoralRule />
            <p className="gy-body-copy">登录后，摄影者可以提交机位和作品，管理员可以进入审核后台。未配置 Supabase 时页面保持演示模式。</p>
            <div className="gy-auth-links">
              <Link href="/contribute">提交新机位</Link>
              <Link href="/works/submit">上传作品</Link>
              <Link href="/admin/submissions">审核后台</Link>
              <Link href="/photographer/dashboard">摄影师管理</Link>
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
                <strong>{currentEmail}</strong>
                <span>当前角色：{role}</span>
                <button type="button" onClick={logout}>退出登录</button>
              </div>
            ) : null}

            <div className="gy-form-grid gy-auth-form-grid">
              {mode === "register" ? (
                <div className="gy-input-card">
                  <label>显示名称</label>
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </div>
              ) : null}
              <div className="gy-input-card">
                <label>邮箱</label>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="gy-input-card">
                <label>密码</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" />
              </div>
            </div>

            {message ? <p className="gy-submit-note">{message}</p> : null}

            <div className="gy-work-submit-actions">
              <button type="submit" className="gy-primary-button" disabled={isSubmitting}>{isSubmitting ? "处理中..." : mode === "login" ? "登录" : "注册"}</button>
              <Link href="/photographer/dashboard" className="gy-secondary-button">进入摄影师管理</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
