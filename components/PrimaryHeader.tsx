import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  right?: ReactNode;
  className?: string;
};

// P0 Bug Fix：一级页面 Header 只保留品牌；仅地图可传入真正可操作的路线菜单。
export default function PrimaryHeader({ right, className = "" }: Props) {
  return <header className={`flex h-11 items-center justify-between border-b border-ink/10 bg-[#f3f7f7] px-3 ${className}`}>
    <Link href="/" className="text-[17px] font-bold tracking-[.12em] text-ink">光影大工</Link>
    {right}
  </header>;
}
