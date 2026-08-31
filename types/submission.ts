export type AIFieldSource = "exif" | "ai" | "user" | "inferred";

export type AIField<T = string> = {
  value: T;
  source: AIFieldSource;
  confidence?: number;
  userConfirmed: boolean;
};

export type SubmissionImage = {
  id: string;
  name: string;
  previewUrl: string;
  isCover: boolean;
};

/** A camera position proposed within one photographer's submission, never a formal Spot coordinate. */
export type CameraSpotSubmission = {
  latitude: number;
  longitude: number;
  label: string;
  source: "user";
  nearbyPlaceId?: string;
  spotId?: string;
};

export type Submission = {
  id: string;
  spotId?: string;
  locationName: string;
  latitude: number;
  longitude: number;
  nearbyPlaceId?: string;
  images: SubmissionImage[];
  cameraSpot: CameraSpotSubmission | null;
  fields: {
    location: AIField;
    style: AIField<string[]>;
    capturedAt: AIField;
    recommendedTime: AIField;
    focalLength: AIField;
    light: AIField;
    composition: AIField;
    advice: AIField;
    crowd: AIField;
  };
  rightsConfirmed: boolean;
  peopleConsentConfirmed: boolean;
  status: "draft" | "submitted";
};
