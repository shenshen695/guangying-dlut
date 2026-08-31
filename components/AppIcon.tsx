import type { SVGProps } from "react";

// 光影大工 Product V2：统一使用同一套 24px 线性 SVG 图标，替代字符模拟图标。
export type AppIconName = "home" | "map" | "planner" | "user" | "search" | "camera" | "upload" | "arrow" | "clock" | "route" | "close" | "send" | "bookmark" | "plus" | "sparkles" | "chevronDown" | "heart" | "location" | "rotate" | "sun" | "graduation" | "building" | "moon" | "check";

const paths: Record<AppIconName, React.ReactNode> = {
  home: <><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.7V21h13V9.7"/><path d="M9.5 21v-6h5v6"/></>,
  map: <><path d="m3.5 6 5-2.5 7 2.5 5-2.5v14l-5 2.5-7-2.5-5 2.5z"/><path d="M8.5 3.5v14M15.5 6v14"/></>,
  planner: <><rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M8 10h8M8 14h5"/></>,
  user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6"/></>,
  search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
  camera: <><path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></>,
  upload: <><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5"/><path d="M5 13v7h14v-7"/></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  route: <><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h2a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  send: <><path d="m5 12 7-7 7 7M12 5v14"/></>,
  bookmark: <path d="M6 3.5h12v17L12 16l-6 4.5z"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z"/><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7zM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z"/></>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  heart: <path d="M20.8 5.8c-1.9-2-5-2-6.9 0L12 7.7l-1.9-1.9a4.8 4.8 0 0 0-6.9 6.8L12 21l8.8-8.4a4.8 4.8 0 0 0 0-6.8z"/>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></>,
  rotate: <><path d="M20 7v5h-5"/><path d="M19 12a7.5 7.5 0 1 0-1.6 5"/></>,
  sun: <><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  graduation: <><path d="m3 9 9-5 9 5-9 5z"/><path d="M7 12v4c2.8 2 7.2 2 10 0v-4M21 9v6"/></>,
  building: <><path d="M4 21V8l7-3v16M11 21V3l9 4v14M2 21h20"/><path d="M7 11h1M7 15h1M14 8h2M14 12h2M14 16h2"/></>,
  moon: <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2z"/>,
  check: <path d="m5 12 4 4L19 6"/>,
};

export default function AppIcon({ name, ...props }: { name: AppIconName } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
