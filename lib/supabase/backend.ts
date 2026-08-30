"use client";

import photographersData from "@/data/photographers.json";
import worksData from "@/data/works.json";
import spotsData from "@/data/spots.json";
import mapSpotsData from "@/data/map-spots.json";
import type { Photographer, PhotographerIdentity, PhotographerStatus, PhotographerWork, PhotographerWorkCategory } from "@/types/photographer";
import type { SubmittedWork } from "@/types/work";
import type { MapSpot } from "@/types/map-spot";
import type { Season } from "@/types/spot";
import { demoModeMessage, getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type BackendMode = "supabase" | "demo";
export type Role = "user" | "photographer_pending" | "photographer" | "admin";
export type SignupIntent = "user" | "photographer_pending";
export type SubmissionStatus = "pending" | "approved" | "needs_revision" | "rejected";
export type ReviewTargetType = "spot" | "work" | "photographer";
export type ReviewAction = "approve" | "reject" | "request_revision";

export type BackendProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: Role;
};

export type BackendUserState = {
  mode: BackendMode;
  configured: boolean;
  user: { id: string; email?: string | null } | null;
  profile: BackendProfile | null;
  message?: string;
};

export type SpotSubmissionInput = {
  spotName: string;
  locationDescription: string;
  recommendedTime: string;
  sunDirection: string;
  focalLength: string;
  seasons: string[];
  crowdLevel: string;
  shootingTips: string;
  files: File[];
};

export type WorkSubmissionInput = {
  title: string;
  photographerName: string;
  photographerProfileId?: string | null;
  spotSlug: string;
  routeSlug: string;
  season: string;
  styleTags: string[];
  description: string;
  files: File[];
  rightsConfirmed: boolean;
};

export type PhotographerApplicationInput = {
  identity: string;
  name: string;
  bio: string;
  styles: string[];
  familiarSpots: string[];
  representativeFiles: File[];
  portfolioNote: string;
  contactWechat: string;
  contactEmail: string;
  contactQq: string;
  contactAuthorized: boolean;
  rightsConfirmed: boolean;
};

export type AdminSubmission = {
  id: string;
  type: ReviewTargetType;
  title: string;
  summary: string;
  status: SubmissionStatus;
  createdAt: string;
  imageUrls: string[];
  submittedBy?: string | null;
  reviewNote?: string | null;
  details?: Array<{ label: string; value: string }>;
};

export type DashboardSummary = {
  photographerProfile: PhotographerProfileDraft | null;
  spotSubmissions: AdminSubmission[];
  workSubmissions: AdminSubmission[];
};

export type PhotographerProfileDraft = {
  id?: string;
  slug: string;
  name: string;
  identity: string;
  bio: string;
  familiar_routes: string[];
  familiar_spots: string[];
  styles: string[];
  seasons: string[];
  mutual_status: string;
  contact_authorized: boolean;
  contact_wechat: string;
  contact_email: string;
  contact_qq: string;
  status?: SubmissionStatus;
  review_note?: string;
  representative_image_urls?: string[];
  portfolio_note?: string;
  rights_confirmed?: boolean;
};

const photographers = photographersData as Photographer[];
const seededWorks = worksData as SubmittedWork[];
const localSpots = spotsData as Array<{ slug: string; name: string; shortName?: string }>;
const localMapSpots = mapSpotsData as MapSpot[];
const seasons: Season[] = ["春", "夏", "秋", "冬"];
const identities: PhotographerIdentity[] = ["摄影社成员", "校友摄影者", "在校学生", "摄影爱好者"];
const mutualStatuses: PhotographerStatus[] = ["可互勉", "可约拍", "暂不互勉"];
const workCategories: PhotographerWorkCategory[] = ["毕业照", "湖畔", "人像", "建筑", "夜景", "室内", "胶片感"];
const publicImageFallbacks = [
  "/assets/ui/season-spring.png",
  "/assets/ui/season-summer.png",
  "/assets/ui/season-autumn.png",
  "/assets/ui/season-winter.png",
  "/assets/ui/route-cover-spring.png",
];

export const statusLabel: Record<SubmissionStatus, string> = {
  pending: "待审核",
  approved: "已通过",
  needs_revision: "需补充",
  rejected: "已拒绝",
};

export const roleLabel: Record<Role, string> = {
  user: "普通用户",
  photographer_pending: "摄影师认证中",
  photographer: "摄影师",
  admin: "管理员",
};

const actionToStatus: Record<ReviewAction, SubmissionStatus> = {
  approve: "approved",
  reject: "rejected",
  request_revision: "needs_revision",
};

const fallbackSpotSubmissions: AdminSubmission[] = [
  {
    id: "demo-spot-flower",
    type: "spot",
    title: "花墙侧逆光机位",
    summary: "17:00-18:30 / 西南侧逆光 / 50mm / 等待确认坐标和图片授权。",
    status: "pending",
    createdAt: "今天 14:20",
    imageUrls: ["/assets/ui/season-spring.png"],
    submittedBy: "demo@dlut.edu.cn",
    reviewNote: "需要确认坐标和图片授权。",
  },
  {
    id: "demo-spot-lake",
    type: "spot",
    title: "凌水湖木桥侧影",
    summary: "16:30-18:30 / 西侧逆光 / 85mm / 已进入春季路线候选点位。",
    status: "approved",
    createdAt: "昨天 19:12",
    imageUrls: ["/assets/ui/season-winter.png"],
    submittedBy: "demo@dlut.edu.cn",
  },
  {
    id: "demo-spot-bochuan",
    type: "spot",
    title: "伯川台阶低机位",
    summary: "08:30-09:30 / 东南侧光 / 35mm / 缺少第二张参考成片。",
    status: "needs_revision",
    createdAt: "8 月 26 日",
    imageUrls: ["/assets/ui/season-autumn.png"],
    submittedBy: "demo@dlut.edu.cn",
    reviewNote: "请补充第二张参考成片。",
  },
];

const fallbackWorkSubmissions: AdminSubmission[] = seededWorks.map((work) => ({
  id: work.id,
  type: "work",
  title: work.title,
  summary: `${work.photographerName} / ${work.spotName} / ${work.season} / ${work.styleTags.join("、")}`,
  status: fromDisplayStatus(work.status),
  createdAt: work.submittedAt,
  imageUrls: work.images,
  submittedBy: "demo@dlut.edu.cn",
  reviewNote: work.note,
}));

const fallbackPhotographerSubmissions: AdminSubmission[] = photographers.slice(0, 3).map((photographer, index) => ({
  id: `demo-photographer-${photographer.slug}`,
  type: "photographer",
  title: photographer.name,
  summary: `${photographer.identity} / ${photographer.familiarRoutes.join("、")} / ${photographer.styles.join("、")}`,
  status: index === 0 ? "approved" : "pending",
  createdAt: index === 0 ? "8 月 26 日" : "今天",
  imageUrls: [photographer.avatar],
  submittedBy: "demo@dlut.edu.cn",
}));

function fromDisplayStatus(status: SubmittedWork["status"]): SubmissionStatus {
  if (status === "已通过") return "approved";
  if (status === "需补充") return "needs_revision";
  return "pending";
}

function normalizeList(value: string | string[]) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return value.split(/[、,/，\s]+/).map((item) => item.trim()).filter(Boolean);
}

function arrayValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return normalizeList(value);
  return [];
}

function validSeasons(value: unknown): Season[] {
  const list = arrayValue(value).filter((item): item is Season => seasons.includes(item as Season));
  return list.length ? list : ["春", "夏"];
}

function validIdentity(value: unknown): PhotographerIdentity {
  const next = String(value || "");
  return identities.includes(next as PhotographerIdentity) ? next as PhotographerIdentity : "摄影爱好者";
}

function validMutualStatus(value: unknown): PhotographerStatus {
  const next = String(value || "");
  return mutualStatuses.includes(next as PhotographerStatus) ? next as PhotographerStatus : "可互勉";
}

function pickImages(value: unknown, fallbackIndex = 0) {
  const images = arrayValue(value);
  return images.length ? images : [publicImageFallbacks[fallbackIndex % publicImageFallbacks.length]];
}

function slugify(value: string, fallback: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || fallback;
}

function findSpotName(slug?: string | null) {
  if (!slug) return "未关联点位";
  return localSpots.find((spot) => spot.slug === slug)?.name || localMapSpots.find((spot) => spot.slug === slug)?.name || slug;
}

function deriveCategories(styleTags: string[], spotName: string, description?: string | null): PhotographerWorkCategory[] {
  const text = `${styleTags.join(" ")} ${spotName} ${description || ""}`;
  const categories = new Set<PhotographerWorkCategory>(["毕业照"]);
  if (text.includes("湖")) categories.add("湖畔");
  if (text.includes("人像") || text.includes("肖像")) categories.add("人像");
  if (text.includes("建筑") || text.includes("主楼") || text.includes("伯川") || text.includes("一馆")) categories.add("建筑");
  if (text.includes("夜") || text.includes("蓝调")) categories.add("夜景");
  if (text.includes("室内")) categories.add("室内");
  if (text.includes("胶片")) categories.add("胶片感");
  return Array.from(categories).filter((item) => workCategories.includes(item)).slice(0, 4);
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-\u4e00-\u9fa5]/g, "-").replace(/-+/g, "-");
}

function makeProfileSlug(name: string, userId: string) {
  const cleanName = sanitizeFileName(name.trim().toLowerCase()).replace(/\./g, "-").replace(/^-|-$/g, "");
  return `${cleanName || "photographer"}-${userId.slice(0, 8)}`;
}

function isMissingColumnError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  const message = error.message || "";
  return error.code === "42703" || error.code === "PGRST204" || message.includes("Could not find") || message.includes("column");
}

async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function getBackendUserState(): Promise<BackendUserState> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { mode: "demo", configured: false, user: null, profile: null, message: demoModeMessage };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { mode: "supabase", configured: true, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,display_name,role")
    .eq("id", userData.user.id)
    .maybeSingle();

  return {
    mode: "supabase",
    configured: true,
    user: { id: userData.user.id, email: userData.user.email },
    profile: profile as BackendProfile | null,
  };
}

export async function listApprovedPhotographers() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { mode: "demo" as const, photographers, message: demoModeMessage };
  }

  const { data, error } = await supabase
    .from("photographer_profiles")
    .select("*")
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { mode: "demo" as const, photographers, message: `读取已审核摄影师失败，已使用演示数据：${error.message}` };
  }

  return {
    mode: "supabase" as const,
    photographers: (data || []).map(mapPublicPhotographer),
    message: (data || []).length ? "已显示 Supabase 已审核摄影师。" : "Supabase 暂无已审核摄影师，页面保留演示数据。",
  };
}

export async function getApprovedPhotographerBySlug(slug: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { mode: "demo" as const, photographer: photographers.find((item) => item.slug === slug) || null, message: demoModeMessage };
  }

  const { data, error } = await supabase
    .from("photographer_profiles")
    .select("*")
    .eq("status", "approved")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { mode: "demo" as const, photographer: photographers.find((item) => item.slug === slug) || null, message: `读取摄影师主页失败：${error.message}` };
  }

  return {
    mode: "supabase" as const,
    photographer: data ? mapPublicPhotographer(data) : null,
    message: data ? "已读取 Supabase 已审核摄影师主页。" : "未找到已审核摄影师，使用本地占位内容。",
  };
}

export async function listApprovedWorksForPhotographer(photographer: Pick<Photographer, "sourceId" | "slug" | "name">) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { mode: "demo" as const, works: [] as PhotographerWork[], message: demoModeMessage };

  const { data, error } = await supabase
    .from("work_submissions")
    .select("*")
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) return { mode: "demo" as const, works: [] as PhotographerWork[], message: `读取已审核作品失败：${error.message}` };

  const name = photographer.name.trim().toLowerCase();
  const works = (data || [])
    .filter((row) => {
      if (photographer.sourceId && row.photographer_profile_id === photographer.sourceId) return true;
      return String(row.photographer_name || "").trim().toLowerCase() === name;
    })
    .map(mapPublicWork);

  return { mode: "supabase" as const, works, message: works.length ? "已读取 Supabase 已审核作品。" : "暂无 Supabase 已审核作品。" };
}

export async function listApprovedMapSpots() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { mode: "demo" as const, spots: [] as MapSpot[], message: demoModeMessage };

  const { data, error } = await supabase
    .from("spot_submissions")
    .select("*")
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) return { mode: "demo" as const, spots: [] as MapSpot[], message: `读取已审核共建点位失败：${error.message}` };

  return {
    mode: "supabase" as const,
    spots: (data || []).map(mapPublicMapSpot),
    message: (data || []).length ? "已合并 Supabase 已审核共建点位。" : "暂无 Supabase 已审核共建点位。",
  };
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: true, demo: true, message: `${demoModeMessage}，已展示本地登录状态。` };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "登录成功。" };
}

export async function signUpWithEmail(email: string, password: string, displayName: string, intent: SignupIntent = "user", identityType = "普通用户") {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: true, demo: true, message: `${demoModeMessage}，已展示本地注册状态。` };
  const requestedRole: SignupIntent = intent === "photographer_pending" ? "photographer_pending" : "user";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        requested_role: requestedRole,
        identity_type: identityType,
      },
    },
  });
  if (error) return { ok: false, message: error.message };
  if (requestedRole === "photographer_pending" && data.user) {
    await requestPhotographerPendingRole();
  }
  return {
    ok: true,
    message: requestedRole === "photographer_pending"
      ? "注册成功，账号已进入摄影师申请流程。请继续填写摄影师认证资料。"
      : "注册成功。如果 Supabase 开启邮件确认，请先完成邮箱确认。",
    requestedRole,
  };
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

async function requestPhotographerPendingRole() {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) return;
  const { error } = await supabase.rpc("request_photographer_role");
  if (!error) return;
  await supabase
    .from("profiles")
    .update({ role: "photographer_pending" })
    .eq("id", user.id);
}

async function uploadSubmissionImages(kind: "spot-submissions" | "work-submissions" | "photographers", files: File[]) {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user || files.length === 0) return [];

  const imageUrls: string[] = [];
  for (const file of files) {
    const path = `${kind}/${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from("gy-submissions").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("gy-submissions").getPublicUrl(path);
    if (data.publicUrl) imageUrls.push(data.publicUrl);
  }
  return imageUrls;
}

export async function submitSpotSubmission(input: SpotSubmissionInput) {
  const { supabase, user } = await getCurrentUser();
  if (!supabase) {
    return { mode: "demo" as const, id: `demo-spot-${Date.now()}`, message: `${demoModeMessage}，已加入本地待审核状态。` };
  }
  if (!user) return { mode: "supabase" as const, error: "请先登录后提交机位。" };

  try {
    const imageUrls = await uploadSubmissionImages("spot-submissions", input.files);
    const { data, error } = await supabase
      .from("spot_submissions")
      .insert({
        submitted_by: user.id,
        spot_name: input.spotName,
        location_description: input.locationDescription,
        recommended_time: input.recommendedTime,
        sun_direction: input.sunDirection,
        focal_length: input.focalLength,
        seasons: input.seasons,
        crowd_level: input.crowdLevel,
        shooting_tips: input.shootingTips,
        image_urls: imageUrls,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) return { mode: "supabase" as const, error: error.message };
    return { mode: "supabase" as const, id: data?.id as string, message: "已提交到 Supabase 待审核队列。" };
  } catch (error) {
    return { mode: "supabase" as const, error: error instanceof Error ? error.message : "提交失败。" };
  }
}

export async function submitWorkSubmission(input: WorkSubmissionInput) {
  const { supabase, user } = await getCurrentUser();
  if (!supabase) {
    return { mode: "demo" as const, id: `demo-work-${Date.now()}`, message: `${demoModeMessage}，已加入本地待审核状态。` };
  }
  if (!user) return { mode: "supabase" as const, error: "请先登录后上传作品。" };
  if (!input.rightsConfirmed) return { mode: "supabase" as const, error: "请先确认作品为本人拍摄或已获授权。" };

  try {
    const imageUrls = await uploadSubmissionImages("work-submissions", input.files);
    const payload = {
      submitted_by: user.id,
      photographer_profile_id: input.photographerProfileId || null,
      title: input.title,
      photographer_name: input.photographerName,
      spot_slug: input.spotSlug,
      route_slug: input.routeSlug,
      season: input.season,
      style_tags: input.styleTags,
      image_urls: imageUrls,
      description: input.description,
      rights_confirmed: input.rightsConfirmed,
      status: "pending",
    };
    const { data, error } = await supabase
      .from("work_submissions")
      .insert(payload)
      .select("id")
      .single();

    if (error && isMissingColumnError(error)) {
      const { rights_confirmed: _rightsConfirmed, ...legacyPayload } = payload;
      const legacyResult = await supabase.from("work_submissions").insert(legacyPayload).select("id").single();
      if (legacyResult.error) return { mode: "supabase" as const, error: legacyResult.error.message };
      return { mode: "supabase" as const, id: legacyResult.data?.id as string, message: "作品已提交到 Supabase 待审核队列。" };
    }
    if (error) return { mode: "supabase" as const, error: error.message };
    return { mode: "supabase" as const, id: data?.id as string, message: "作品已提交到 Supabase 待审核队列。" };
  } catch (error) {
    return { mode: "supabase" as const, error: error instanceof Error ? error.message : "上传失败。" };
  }
}

export async function submitPhotographerApplication(input: PhotographerApplicationInput) {
  const { supabase, user } = await getCurrentUser();
  if (!supabase) {
    return { mode: "demo" as const, id: `demo-photographer-${Date.now()}`, message: `${demoModeMessage}，摄影师认证已进入本地待审核状态。` };
  }
  if (!user) return { mode: "supabase" as const, error: "请先登录后提交摄影师认证。" };
  if (!input.rightsConfirmed) return { mode: "supabase" as const, error: "请确认代表作品为本人拍摄或已获授权。" };

  try {
    await requestPhotographerPendingRole();
    const imageUrls = await uploadSubmissionImages("photographers", input.representativeFiles.slice(0, 3));
    const payload = {
      user_id: user.id,
      slug: makeProfileSlug(input.name, user.id),
      name: input.name,
      identity: input.identity,
      bio: input.bio,
      familiar_routes: [],
      familiar_spots: input.familiarSpots,
      styles: input.styles,
      seasons: ["春", "夏", "秋", "冬"],
      mutual_status: "可互勉",
      contact_authorized: input.contactAuthorized,
      contact_wechat: input.contactWechat,
      contact_email: input.contactEmail,
      contact_qq: input.contactQq,
      representative_image_urls: imageUrls,
      portfolio_note: input.portfolioNote,
      rights_confirmed: input.rightsConfirmed,
      status: "pending",
    };

    const result = await supabase
      .from("photographer_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("id")
      .single();

    if (result.error && isMissingColumnError(result.error)) {
      const {
        representative_image_urls: _representativeImageUrls,
        portfolio_note: _portfolioNote,
        rights_confirmed: _rightsConfirmed,
        ...legacyPayload
      } = payload;
      const legacyResult = await supabase
        .from("photographer_profiles")
        .upsert(legacyPayload, { onConflict: "user_id" })
        .select("id")
        .single();
      if (legacyResult.error) return { mode: "supabase" as const, error: legacyResult.error.message };
      return { mode: "supabase" as const, id: legacyResult.data?.id as string, message: "摄影师认证已提交，等待管理员审核。" };
    }
    if (result.error) return { mode: "supabase" as const, error: result.error.message };
    return { mode: "supabase" as const, id: result.data?.id as string, message: "摄影师认证已提交，等待管理员审核。" };
  } catch (error) {
    return { mode: "supabase" as const, error: error instanceof Error ? error.message : "摄影师认证提交失败。" };
  }
}

export async function listAdminSubmissions() {
  const state = await getBackendUserState();
  if (!isSupabaseConfigured) {
    return {
      mode: "demo" as const,
      allowed: true,
      message: `${demoModeMessage}，当前展示审核演示数据。`,
      spots: fallbackSpotSubmissions,
      works: fallbackWorkSubmissions,
      photographers: fallbackPhotographerSubmissions,
    };
  }
  if (state.profile?.role !== "admin") {
    return { mode: "supabase" as const, allowed: false, message: "当前账号不是管理员，无法进入审核后台。", spots: [], works: [], photographers: [] };
  }

  const supabase = getSupabaseBrowserClient()!;
  const [spotsResult, worksResult, photographersResult] = await Promise.all([
    supabase.from("spot_submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("work_submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("photographer_profiles").select("*").order("created_at", { ascending: false }),
  ]);

  return {
    mode: "supabase" as const,
    allowed: true,
    message: spotsResult.error?.message || worksResult.error?.message || photographersResult.error?.message,
    spots: (spotsResult.data || []).map(mapSpotSubmission),
    works: (worksResult.data || []).map(mapWorkSubmission),
    photographers: (photographersResult.data || []).map(mapPhotographerSubmission),
  };
}

export async function reviewSubmission(targetType: ReviewTargetType, id: string, action: ReviewAction, note: string) {
  const state = await getBackendUserState();
  if (!isSupabaseConfigured) return { ok: true, demo: true, status: actionToStatus[action], message: "演示模式下已更新本地审核状态。" };
  if (state.profile?.role !== "admin") return { ok: false, message: "当前账号没有审核权限。" };

  const supabase = getSupabaseBrowserClient()!;
  const table = targetType === "spot" ? "spot_submissions" : targetType === "work" ? "work_submissions" : "photographer_profiles";
  const nextStatus = actionToStatus[action];
  let photographerOwnerId = "";
  if (targetType === "photographer") {
    const { data } = await supabase.from("photographer_profiles").select("user_id").eq("id", id).maybeSingle();
    photographerOwnerId = data?.user_id || "";
  }
  const { error } = await supabase
    .from(table)
    .update({
      status: nextStatus,
      review_note: note,
      reviewed_by: state.user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  if (targetType === "photographer" && photographerOwnerId) {
    const nextRole: Role = nextStatus === "approved" ? "photographer" : nextStatus === "rejected" ? "user" : "photographer_pending";
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", photographerOwnerId);
    if (profileError) return { ok: false, message: `审核状态已更新，但角色同步失败：${profileError.message}` };
  }

  await supabase.from("review_logs").insert({
    target_type: targetType,
    target_id: id,
    action,
    note,
    reviewer_id: state.user?.id,
  });

  return { ok: true, status: nextStatus, message: "审核状态已更新。" };
}

export async function getPhotographerDashboard(): Promise<{ mode: BackendMode; allowed: boolean; message?: string; data: DashboardSummary }> {
  const state = await getBackendUserState();
  if (!isSupabaseConfigured) {
    return {
      mode: "demo",
      allowed: true,
      message: `${demoModeMessage}，当前展示摄影师管理演示数据。`,
      data: {
        photographerProfile: photographerToDraft(photographers[0]),
        spotSubmissions: fallbackSpotSubmissions.slice(0, 2),
        workSubmissions: fallbackWorkSubmissions.slice(0, 2),
      },
    };
  }
  if (!state.user || (state.profile?.role !== "photographer" && state.profile?.role !== "admin")) {
    const pendingData = state.user && state.profile?.role === "photographer_pending"
      ? await getOwnPhotographerDashboardData(state.user.id)
      : { photographerProfile: null, spotSubmissions: [], workSubmissions: [] };
    return {
      mode: "supabase",
      allowed: false,
      message: state.profile?.role === "photographer_pending"
        ? "摄影师认证审核中。审核通过前不能进入正式摄影师后台，也不会公开展示主页。"
        : "请先完成摄影师认证申请，审核通过后再进入摄影师后台。",
      data: pendingData,
    };
  }

  const data = await getOwnPhotographerDashboardData(state.user.id);
  if (state.profile.role !== "admin" && data.photographerProfile?.status !== "approved") {
    return {
      mode: "supabase",
      allowed: false,
      message: "摄影师认证审核中。审核通过前不能进入正式摄影师后台，也不会公开展示主页。",
      data,
    };
  }

  return {
    mode: "supabase",
    allowed: true,
    message: "已连接 Supabase 摄影师管理后台。",
    data,
  };
}

async function getOwnPhotographerDashboardData(userId: string): Promise<DashboardSummary> {
  const supabase = getSupabaseBrowserClient()!;
  const [profileResult, spotsResult, worksResult] = await Promise.all([
    supabase.from("photographer_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("spot_submissions").select("*").eq("submitted_by", userId).order("created_at", { ascending: false }),
    supabase.from("work_submissions").select("*").eq("submitted_by", userId).order("created_at", { ascending: false }),
  ]);

  return {
    photographerProfile: profileResult.data ? mapPhotographerProfileDraft(profileResult.data) : null,
    spotSubmissions: (spotsResult.data || []).map(mapSpotSubmission),
    workSubmissions: (worksResult.data || []).map(mapWorkSubmission),
  };
}

export async function savePhotographerProfile(input: PhotographerProfileDraft) {
  const state = await getBackendUserState();
  if (!isSupabaseConfigured) return { ok: true, demo: true, message: `${demoModeMessage}，已保存到本地演示状态。` };
  if (!state.user || (state.profile?.role !== "photographer" && state.profile?.role !== "admin")) {
    return { ok: false, message: "请使用摄影师或管理员账号保存主页。" };
  }

  const supabase = getSupabaseBrowserClient()!;
  const payload = {
    user_id: state.user.id,
    slug: input.slug,
    name: input.name,
    identity: input.identity,
    bio: input.bio,
    familiar_routes: input.familiar_routes,
    familiar_spots: input.familiar_spots,
    styles: input.styles,
    seasons: input.seasons,
    mutual_status: input.mutual_status,
    contact_authorized: input.contact_authorized,
    contact_wechat: input.contact_wechat,
    contact_email: input.contact_email,
    contact_qq: input.contact_qq,
    status: input.status || "pending",
  };

  const { error } = await supabase.from("photographer_profiles").upsert(payload, { onConflict: "user_id" });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "摄影师主页已保存，等待审核或展示。" };
}

export function parseList(value: string) {
  return normalizeList(value);
}

function photographerToDraft(photographer: Photographer): PhotographerProfileDraft {
  return {
    slug: photographer.slug,
    name: photographer.name,
    identity: photographer.identity,
    bio: photographer.intro,
    familiar_routes: photographer.familiarRoutes,
    familiar_spots: photographer.familiarSpots,
    styles: photographer.styles,
    seasons: photographer.seasons,
    mutual_status: photographer.mutualStatus,
    contact_authorized: photographer.authorized,
    contact_wechat: photographer.contact.wechat || "",
    contact_email: photographer.contact.email || "",
    contact_qq: photographer.contact.qq || "",
    status: "approved",
    review_note: "",
  };
}

function mapSpotSubmission(row: Record<string, any>): AdminSubmission {
  return {
    id: row.id,
    type: "spot",
    title: row.spot_name || "未命名机位",
    summary: `${row.location_description || "位置待补充"} / ${row.recommended_time || "时间待补充"} / ${row.focal_length || "焦段待补充"}`,
    status: row.status || "pending",
    createdAt: formatDate(row.created_at),
    imageUrls: row.image_urls || [],
    submittedBy: row.submitted_by,
    reviewNote: row.review_note,
    details: [
      { label: "位置描述", value: row.location_description || "待补充" },
      { label: "推荐时间", value: row.recommended_time || "待补充" },
      { label: "太阳方向", value: row.sun_direction || "待补充" },
      { label: "推荐焦段", value: row.focal_length || "待补充" },
      { label: "适合季节", value: (row.seasons || []).join(" / ") || "待补充" },
      { label: "拥挤度", value: row.crowd_level || "待补充" },
      { label: "技巧说明", value: row.shooting_tips || "待补充" },
    ],
  };
}

function mapWorkSubmission(row: Record<string, any>): AdminSubmission {
  return {
    id: row.id,
    type: "work",
    title: row.title || row.description?.slice(0, 18) || "作品投稿",
    summary: `${row.photographer_name || "摄影者待补充"} / ${row.spot_slug || "未关联点位"} / ${row.route_slug || "未关联路线"} / ${row.season || "季节待补充"} / ${(row.style_tags || []).join("、")}`,
    status: row.status || "pending",
    createdAt: formatDate(row.created_at),
    imageUrls: row.image_urls || [],
    submittedBy: row.submitted_by,
    reviewNote: row.review_note,
    details: [
      { label: "摄影者", value: row.photographer_name || "待补充" },
      { label: "关联点位", value: row.spot_slug || "待补充" },
      { label: "关联路线", value: row.route_slug || "待补充" },
      { label: "季节", value: row.season || "待补充" },
      { label: "风格标签", value: (row.style_tags || []).join(" / ") || "待补充" },
      { label: "授权确认", value: row.rights_confirmed ? "已确认" : "未记录" },
      { label: "拍摄说明", value: row.description || "待补充" },
    ],
  };
}

function mapPhotographerSubmission(row: Record<string, any>): AdminSubmission {
  return {
    id: row.id,
    type: "photographer",
    title: row.name || "摄影师主页",
    summary: `${row.identity || "身份待补充"} / ${(row.familiar_routes || []).join("、")} / ${(row.styles || []).join("、")}`,
    status: row.status || "pending",
    createdAt: formatDate(row.created_at),
    imageUrls: row.representative_image_urls || [],
    submittedBy: row.user_id,
    reviewNote: row.review_note,
    details: [
      { label: "身份类型", value: row.identity || "待补充" },
      { label: "熟悉点位", value: (row.familiar_spots || []).join(" / ") || "待补充" },
      { label: "擅长风格", value: (row.styles || []).join(" / ") || "待补充" },
      { label: "联系方式授权", value: row.contact_authorized ? "授权展示" : "不公开展示" },
      { label: "作品授权确认", value: row.rights_confirmed ? "已确认" : "未记录" },
      { label: "作品说明", value: row.portfolio_note || "待补充" },
      { label: "简介", value: row.bio || "待补充" },
    ],
  };
}

function mapPhotographerProfileDraft(row: Record<string, any>): PhotographerProfileDraft {
  return {
    id: row.id,
    slug: row.slug || "",
    name: row.name || "",
    identity: row.identity || "摄影爱好者",
    bio: row.bio || "",
    familiar_routes: row.familiar_routes || [],
    familiar_spots: row.familiar_spots || [],
    styles: row.styles || [],
    seasons: row.seasons || [],
    mutual_status: row.mutual_status || "可互勉",
    contact_authorized: Boolean(row.contact_authorized),
    contact_wechat: row.contact_wechat || "",
    contact_email: row.contact_email || "",
    contact_qq: row.contact_qq || "",
    status: row.status || "pending",
    review_note: row.review_note || "",
    representative_image_urls: row.representative_image_urls || [],
    portfolio_note: row.portfolio_note || "",
    rights_confirmed: Boolean(row.rights_confirmed),
  };
}

function mapPublicPhotographer(row: Record<string, any>, index = 0): Photographer {
  const representativeImages = pickImages(row.representative_image_urls, index);
  const styles = arrayValue(row.styles);
  const familiarSpots = arrayValue(row.familiar_spots);
  const familiarRoutes = arrayValue(row.familiar_routes);
  const profileName = row.name || "已认证摄影者";

  return {
    source: "supabase",
    sourceId: row.id,
    slug: row.slug || slugify(profileName, `photographer-${String(row.id || "").slice(0, 8)}`),
    name: profileName,
    identity: validIdentity(row.identity),
    intro: row.bio || "已通过光影大工管理员审核，熟悉校园毕业照点位与拍摄流程。",
    familiarRoutes: familiarRoutes.length ? familiarRoutes : ["春日花阶线"],
    familiarSpots: familiarSpots.length ? familiarSpots : ["南门", "主楼"],
    styles: styles.length ? styles : ["清透自然"],
    seasons: validSeasons(row.seasons),
    mutualStatus: validMutualStatus(row.mutual_status),
    authorized: Boolean(row.contact_authorized),
    contact: Boolean(row.contact_authorized)
      ? {
          wechat: row.contact_wechat || undefined,
          email: row.contact_email || undefined,
          qq: row.contact_qq || undefined,
        }
      : {},
    avatar: representativeImages[0],
    portfolio: representativeImages.slice(0, 3).map((image, imageIndex) => ({
      id: `${row.id || row.slug}-portfolio-${imageIndex + 1}`,
      title: imageIndex === 0 ? "代表作品" : `代表作品 ${imageIndex + 1}`,
      image,
      spot: familiarSpots[imageIndex % Math.max(familiarSpots.length, 1)] || "大工校园",
      season: validSeasons(row.seasons)[imageIndex % validSeasons(row.seasons).length],
      style: styles[imageIndex % Math.max(styles.length, 1)] || "清透自然",
      categories: deriveCategories(styles, familiarSpots.join(" "), row.portfolio_note),
      description: row.portfolio_note || "摄影师认证时提交的代表作品，已通过管理员审核。",
    })),
  };
}

function mapPublicWork(row: Record<string, any>): PhotographerWork {
  const spotName = findSpotName(row.spot_slug);
  const styleTags = arrayValue(row.style_tags);
  const images = pickImages(row.image_urls);
  const season = seasons.includes(row.season as Season) ? row.season as Season : "春";

  return {
    id: row.id,
    title: row.title || `${spotName}毕业作品`,
    image: images[0],
    spot: spotName,
    season,
    style: styleTags[0] || "清透自然",
    categories: deriveCategories(styleTags, spotName, row.description),
    description: row.description || `${spotName} 已审核作品。`,
  };
}

function mapPublicMapSpot(row: Record<string, any>, index: number): MapSpot {
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const spotName = row.spot_name || "共建机位";
  const slug = `community-${slugify(spotName, String(row.id || index).slice(0, 8))}`;
  const images = pickImages(row.image_urls, index);

  return {
    source: "supabase",
    sourceId: row.id,
    id: `community-${row.id || slug}`,
    slug,
    name: spotName,
    shortName: spotName.slice(0, 4),
    area: row.location_description || "共建点位",
    latitude: hasCoordinates ? latitude : 38.881,
    longitude: hasCoordinates ? longitude : 121.526,
    description: row.location_description || "管理员审核通过的共建机位，位置描述待补充。",
    bestTime: row.recommended_time || "待补充",
    crowdLevel: row.crowd_level === "低" || row.crowd_level === "高" ? row.crowd_level : "中",
    shootingTips: row.shooting_tips || "拍摄建议待补充。",
    tags: [...validSeasons(row.seasons), "共建机位"],
    recommendedTimeSlots: ["morning", "afternoon"],
    hasIndoorBackup: false,
    walkingRank: 2,
    images: images.map((src, imageIndex) => ({ src, alt: `${spotName}共建样片 ${imageIndex + 1}` })),
    photoPlaceholder: `${spotName}共建样片`,
    seasonNote: hasCoordinates ? "共建审核通过" : "共建审核通过 · 坐标待补充",
    coordinatesPending: !hasCoordinates,
    verified: true,
    cameraSpots: [],
  };
}

function formatDate(value?: string | null) {
  if (!value) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
