"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/AppIcon";
import { createPhotographerApplication, getPhotographerApplication, submitPhotographerApplication, updatePhotographerApplication } from "@/lib/photographerApplication";
import type { PhotographerApplication, PortfolioImage } from "@/types/photographer-application";

const styleOptions = ["校园风光", "建筑", "人像", "毕业照", "夜景", "秋景", "纪实", "活动", "情侣", "静物"];
const steps = ["基本资料", "摄影方向", "代表作品", "提交审核"];

export default function PhotographerApplicationClient() {
  const [application, setApplication] = useState<PhotographerApplication | null>(null);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => { setApplication(getPhotographerApplication() || createPhotographerApplication()); }, []);

  function patch(next: Partial<PhotographerApplication>) {
    try { setApplication(updatePhotographerApplication(next)); setMessage(""); }
    catch { setMessage("本地存储空间不足，请删除部分图片后重试。 "); }
  }

  async function selectAvatar(file?: File) {
    if (!file) return;
    patch({ avatar: await imageToDataUrl(file, 360) });
  }

  async function addPortfolio(files: FileList | null) {
    if (!files || !application) return;
    const remaining = 6 - application.portfolioImages.length;
    if (remaining <= 0) { setMessage("代表作品最多 6 张。 "); return; }
    const selected = Array.from(files).slice(0, remaining);
    const images: PortfolioImage[] = await Promise.all(selected.map(async (file, index) => ({ id: `${Date.now()}-${index}`, name: file.name, dataUrl: await imageToDataUrl(file, 960) })));
    const portfolioImages = [...application.portfolioImages, ...images];
    patch({ portfolioImages, coverImage: application.coverImage || images[0]?.id || null });
    if (files.length > remaining) setMessage("已保留前 6 张代表作品。 ");
  }

  function removeImage(id: string) {
    if (!application) return;
    const portfolioImages = application.portfolioImages.filter((image) => image.id !== id);
    patch({ portfolioImages, coverImage: application.coverImage === id ? portfolioImages[0]?.id || null : application.coverImage });
  }

  function toggleStyle(style: string) {
    if (!application) return;
    const selected = application.styles.includes(style);
    if (!selected && application.styles.length >= 4) { setMessage("摄影方向最多选择 4 项。 "); return; }
    patch({ styles: selected ? application.styles.filter((item) => item !== style) : [...application.styles, style] });
  }

  if (!application) return <div className="py-24 text-center text-sm text-slate-400">正在读取申请…</div>;
  if (application.status === "reviewing" || application.status === "submitted" || application.status === "approved") return <ApplicationStatus application={application} />;

  const canContinue = step === 1 ? Boolean(application.nickname.trim() && application.bio.trim()) : step === 2 ? application.styles.length > 0 : step === 3 ? application.portfolioImages.length >= 3 && application.portfolioImages.length <= 6 && application.copyrightConfirmed : true;

  return <>
    <header className="py-2"><h1 className="text-[24px] font-bold tracking-tight">成为摄影师</h1><p className="mt-1 text-xs text-slate-500">分享你的视角，让更多人看到大工。</p></header>
    <ol className="mt-5 grid grid-cols-4 gap-1 border-b border-slate-200 pb-3">{steps.map((label, index) => { const number = index + 1; return <li key={label} className={`flex min-w-0 items-center gap-1.5 text-[9px] font-semibold ${number <= step ? "text-sea" : "text-slate-400"}`}><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${number <= step ? "bg-sea text-white" : "bg-slate-200"}`}>{number}</span><span className="truncate">{label}</span></li>; })}</ol>

    <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_3px_14px_rgba(15,23,42,.035)] sm:p-5">
      {step === 1 && <div><StepTitle number="01" title="基本资料" /><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="摄影师昵称 *"><input value={application.nickname} onChange={(event) => patch({ nickname: event.target.value })} className="field-input" placeholder="你的摄影师昵称" /></Field><Field label="所在地"><input value={application.location} onChange={(event) => patch({ location: event.target.value })} className="field-input" /></Field><Field label="一句简介 *" wide><input value={application.bio} onChange={(event) => patch({ bio: event.target.value })} className="field-input" placeholder="一句话介绍你的摄影视角" /></Field><Field label="个人介绍" wide><textarea value={application.description} onChange={(event) => patch({ description: event.target.value })} className="field-input min-h-24 resize-none py-3" placeholder="可以补充你的拍摄经验与偏好" /></Field><Field label="头像"><label className="flex h-16 cursor-pointer items-center gap-3 rounded-[12px] border border-dashed border-slate-300 px-3"><input type="file" accept="image/*" className="sr-only" onChange={(event) => void selectAvatar(event.target.files?.[0])} />{application.avatar ? <img src={application.avatar} alt="头像预览" className="h-11 w-11 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8f3f3] text-sea"><AppIcon name="camera" className="h-5 w-5" /></span>}<span className="text-[11px] font-semibold text-sea">{application.avatar ? "重新选择" : "选择头像"}</span></label></Field></div></div>}

      {step === 2 && <div><StepTitle number="02" title="摄影方向" /><p className="mt-2 text-[11px] text-slate-500">选择 1–4 项</p><div className="mt-4 flex flex-wrap gap-2">{styleOptions.map((style) => <button key={style} type="button" onClick={() => toggleStyle(style)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${application.styles.includes(style) ? "border-sea bg-sea text-white" : "border-slate-200 bg-white text-slate-500"}`}>{style}</button>)}</div></div>}

      {step === 3 && <div><StepTitle number="03" title="代表作品" /><div className="mt-2 flex items-center justify-between"><p className="text-[11px] text-slate-500">至少 3 张，最多 6 张</p><label className="cursor-pointer rounded-full border border-sea/35 px-3 py-2 text-[10px] font-semibold text-sea"><input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { void addPortfolio(event.target.files); event.target.value = ""; }} />{application.portfolioImages.length ? "继续添加" : "选择图片"}</label></div>{application.portfolioImages.length ? <div className="mt-4 grid grid-cols-3 gap-2">{application.portfolioImages.map((image) => <figure key={image.id} className={`relative aspect-[.9] overflow-hidden rounded-[10px] border ${application.coverImage === image.id ? "border-coral ring-2 ring-coral/20" : "border-slate-200"}`}><img src={image.dataUrl} alt={image.name} className="h-full w-full object-cover" />{application.coverImage === image.id && <figcaption className="absolute left-1.5 top-1.5 rounded-full bg-coral px-2 py-1 text-[8px] font-semibold text-white">封面</figcaption>}<span className="absolute inset-x-1.5 bottom-1.5 flex gap-1"><button type="button" onClick={() => patch({ coverImage: image.id })} className="flex-1 rounded-md bg-black/60 px-1 py-1 text-[8px] text-white">设为封面</button><button type="button" onClick={() => removeImage(image.id)} className="rounded-md bg-black/60 px-2 py-1 text-[8px] text-white">删除</button></span></figure>)}</div> : <label className="mt-4 grid h-36 cursor-pointer place-items-center rounded-[14px] border-2 border-dashed border-slate-200 bg-mist text-center"><input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => void addPortfolio(event.target.files)} /><span><AppIcon name="upload" className="mx-auto h-6 w-6 text-sea" /><strong className="mt-2 block text-xs">选择 3–6 张代表作品</strong></span></label>}<label className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-slate-600"><input type="checkbox" checked={application.copyrightConfirmed} onChange={(event) => patch({ copyrightConfirmed: event.target.checked })} className="mt-1 accent-[#155e63]" />我确认作品由本人拍摄或拥有使用权</label></div>}

      {step === 4 && <div><StepTitle number="04" title="提交审核" /><div className="mt-4 flex items-center gap-3">{application.avatar ? <img src={application.avatar} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-full bg-[#e8f3f3] text-sea"><AppIcon name="user" className="h-6 w-6" /></span>}<span><strong className="block text-[15px]">{application.nickname}</strong><small className="mt-1 block text-slate-500">{application.bio}</small></span></div><div className="mt-4 flex flex-wrap gap-1.5">{application.styles.map((style) => <span key={style} className="rounded-full bg-[#e8f3f3] px-2.5 py-1 text-[10px] font-semibold text-sea">{style}</span>)}</div><div className="mt-4 grid grid-cols-3 gap-2">{application.portfolioImages.map((image) => <img key={image.id} src={image.dataUrl} alt={image.name} className="aspect-[.9] w-full rounded-[9px] object-cover" />)}</div><p className="mt-4 text-[11px] leading-5 text-slate-500">提交后进入人工审核，不会自动出现在摄影师列表。</p></div>}

      {message && <p role="alert" className="mt-4 text-[11px] text-coral">{message}</p>}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1} className="h-10 rounded-full border border-slate-200 px-4 text-xs font-semibold text-slate-500 disabled:invisible">上一步</button>{step < 4 ? <button type="button" disabled={!canContinue} onClick={() => setStep((current) => Math.min(4, current + 1))} className="h-10 rounded-full bg-sea px-5 text-xs font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400">下一步</button> : <button type="button" onClick={() => setApplication(submitPhotographerApplication())} className="h-10 rounded-full bg-sea px-5 text-xs font-semibold text-white">提交申请</button>}</div>
    </section>
  </>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-[11px] font-semibold text-slate-600">{label}</span>{children}</label>; }
function StepTitle({ number, title }: { number: string; title: string }) { return <div className="flex items-center gap-2"><span className="text-[10px] font-bold tracking-wider text-sea">STEP {number}</span><h2 className="text-[17px] font-semibold">{title}</h2></div>; }

function ApplicationStatus({ application }: { application: PhotographerApplication }) {
  const cover = application.portfolioImages.find((image) => image.id === application.coverImage) || application.portfolioImages[0];
  return <section className="mt-6 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_3px_14px_rgba(15,23,42,.035)]">{cover && <img src={cover.dataUrl} alt="申请封面" className="h-40 w-full object-cover" />}<div className="p-5"><span className="inline-flex rounded-full bg-[#fff3e6] px-3 py-1.5 text-[10px] font-semibold text-[#c8753e]">审核中</span><h1 className="mt-3 text-[22px] font-bold">申请已提交</h1><p className="mt-2 text-xs leading-5 text-slate-500">{application.nickname} 的摄影师身份正在审核中。通过前不会进入摄影师列表。</p><Link href="/photographers/" className="mt-5 inline-flex h-10 items-center gap-1 rounded-full border border-sea/35 px-4 text-xs font-semibold text-sea">返回摄影师<AppIcon name="arrow" className="h-4 w-4" /></Link></div></section>;
}

async function imageToDataUrl(file: File, maxEdge: number): Promise<string> {
  const source = await readFile(file);
  const image = await loadImage(source);
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function readFile(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }); }
function loadImage(src: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
