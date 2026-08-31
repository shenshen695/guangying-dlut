"use client";

import Link from "next/link";
import { useState } from "react";
import photographersData from "@/data/photographers.json";
import type { Photographer } from "@/types/photographer";

const photographers = photographersData as Photographer[];

export default function HomePhotographers() {
  const [following, setFollowing] = useState<string[]>([]);

  return (
    <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {photographers.slice(0, 5).map((photographer) => {
        const isFollowing = following.includes(photographer.slug);
        const works = photographer.portfolio.slice(0, 3);

        return (
          <article key={photographer.slug} className="w-[78vw] max-w-[320px] shrink-0 rounded-[16px] border border-slate-200 bg-white p-3 shadow-[0_3px_12px_rgba(15,23,42,.035)]">
            <div className="flex items-center gap-2.5">
              <Link href={`/photographers/${photographer.slug}/`} className="flex min-w-0 flex-1 items-center gap-2.5">
                <img src={photographer.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <strong className="truncate text-[12px]">{photographer.name}</strong>
                    <small className="rounded bg-slate-100 px-1 py-0.5 text-[8px] text-slate-500">{photographer.identity}</small>
                  </span>
                  <span className="mt-0.5 block truncate text-[9px] text-slate-400">{photographer.styles.slice(0, 3).join(" · ")}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setFollowing((current) => isFollowing ? current.filter((id) => id !== photographer.slug) : [...current, photographer.slug])}
                className={`h-7 shrink-0 rounded-full px-3 text-[10px] font-semibold ${isFollowing ? "border border-slate-200 text-slate-500" : "border border-sea/35 text-sea"}`}
              >
                {isFollowing ? "已关注" : "关注"}
              </button>
            </div>
            <div className="mt-2.5 flex items-center gap-5 border-y border-slate-100 py-2 text-center">
              <Stat value={photographer.portfolio.length} label="作品" />
              <Stat value={photographer.seasons.join("/")} label="季节" />
              <Stat value={photographer.mutualStatus} label="状态" />
            </div>
            <Link href={`/photographers/${photographer.slug}/`} className="mt-2.5 grid grid-cols-3 gap-1.5">
              {works.map((work) => (
                <img key={work.id} src={work.image} alt={work.title} className="aspect-[1.25] w-full rounded-[7px] object-cover" />
              ))}
            </Link>
          </article>
        );
      })}
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <span>
      <strong className="block text-[11px]">{value}</strong>
      <small className="mt-0.5 block text-[8px] text-slate-400">{label}</small>
    </span>
  );
}
