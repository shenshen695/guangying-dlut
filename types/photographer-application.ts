export type PhotographerApplicationStatus = "draft" | "submitted" | "reviewing" | "approved" | "rejected";

export type PortfolioImage = {
  id: string;
  name: string;
  dataUrl: string;
};

export type PhotographerApplication = {
  id: string;
  nickname: string;
  avatar: string | null;
  bio: string;
  description: string;
  location: string;
  styles: string[];
  portfolioImages: PortfolioImage[];
  coverImage: string | null;
  copyrightConfirmed: boolean;
  submittedAt: string | null;
  status: PhotographerApplicationStatus;
};
