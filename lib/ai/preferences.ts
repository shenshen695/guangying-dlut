"use client";

import type { GraduationStyle, RealSpot } from "@/lib/ai/prompts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type UserPreferences = {
  user_id: string;
  preferred_style: GraduationStyle | null;
  preferred_colors: string[] | null;
  preferred_scenes: RealSpot[] | null;
  people_preference: string | null;
  clothing_mentioned: string | null;
  disliked_styles: GraduationStyle[] | null;
  updated_at?: string;
};

export type PreferenceUpdate = {
  user_id: string;
  preferred_style: GraduationStyle;
  preferred_colors: string[];
  preferred_scenes: RealSpot[];
  people_preference: string;
  clothing_mentioned: string;
  disliked_styles?: GraduationStyle[];
};

export async function getPreferences(userId: string): Promise<UserPreferences | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("user_id, preferred_style, preferred_colors, preferred_scenes, people_preference, clothing_mentioned, disliked_styles, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return null;
  return data as UserPreferences | null;
}

export async function upsertPreferences(update: PreferenceUpdate): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !update.user_id) return;

  const existing = await getPreferences(update.user_id);
  const dislikedStyles = Array.from(new Set([...(existing?.disliked_styles ?? []), ...(update.disliked_styles ?? [])]));

  await supabase.from("user_preferences").upsert(
    {
      user_id: update.user_id,
      preferred_style: update.preferred_style,
      preferred_colors: update.preferred_colors,
      preferred_scenes: update.preferred_scenes,
      people_preference: update.people_preference,
      clothing_mentioned: update.clothing_mentioned,
      disliked_styles: dislikedStyles,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export async function updateDisliked(userId: string, styles: GraduationStyle[]): Promise<GraduationStyle[]> {
  const uniqueStyles = Array.from(new Set(styles));
  if (!userId || uniqueStyles.length === 0) return uniqueStyles;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return uniqueStyles;

  const existing = await getPreferences(userId);
  const dislikedStyles = Array.from(new Set([...(existing?.disliked_styles ?? []), ...uniqueStyles]));

  await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      preferred_style: existing?.preferred_style ?? null,
      preferred_colors: existing?.preferred_colors ?? null,
      preferred_scenes: existing?.preferred_scenes ?? null,
      people_preference: existing?.people_preference ?? null,
      clothing_mentioned: existing?.clothing_mentioned ?? null,
      disliked_styles: dislikedStyles,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return dislikedStyles;
}
