"use client";

import photographersData from "@/data/photographers.json";
import worksData from "@/data/works.json";
import type { Photographer } from "@/types/photographer";
import type { SubmittedWork } from "@/types/work";
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
  representative_image_urls?: string[];
  portfolio_note?: string;
  rights_confirmed?: boolean;
};

const photographers = photographersData as Photographer[];
const seededWorks = worksData as SubmittedWork[];

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
    representative_image_urls: row.representative_image_urls || [],
    portfolio_note: row.portfolio_note || "",
    rights_confirmed: Boolean(row.rights_confirmed),
  };
}

function formatDate(value?: string | null) {
  if (!value) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
