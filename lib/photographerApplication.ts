import type { PhotographerApplication } from "@/types/photographer-application";

const STORAGE_KEY = "guangying-photographer-application";

export function createPhotographerApplication(): PhotographerApplication {
  const application: PhotographerApplication = {
    id: "local-photographer-application",
    nickname: "",
    avatar: null,
    bio: "",
    description: "",
    location: "大连理工大学",
    styles: [],
    portfolioImages: [],
    coverImage: null,
    copyrightConfirmed: false,
    submittedAt: null,
    status: "draft",
  };
  save(application);
  return application;
}

export function getPhotographerApplication(): PhotographerApplication | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try { return JSON.parse(stored) as PhotographerApplication; } catch { return null; }
}

export function updatePhotographerApplication(patch: Partial<PhotographerApplication>): PhotographerApplication {
  const current = getPhotographerApplication() || createPhotographerApplication();
  const updated = { ...current, ...patch };
  save(updated);
  return updated;
}

export function submitPhotographerApplication(): PhotographerApplication {
  return updatePhotographerApplication({ status: "reviewing", submittedAt: new Date().toISOString() });
}

export function withdrawPhotographerApplication(): PhotographerApplication {
  return updatePhotographerApplication({ status: "draft", submittedAt: null });
}

function save(application: PhotographerApplication) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(application));
}
