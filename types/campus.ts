export type CampusPlaceType = "spot" | "building" | "gate" | "landscape" | "facility";

export type CampusPlace = {
  id: string;
  name: string;
  aliases: string[];
  latitude: number;
  longitude: number;
  type: CampusPlaceType;
};

export type CampusLocationResolution = {
  latitude: number;
  longitude: number;
  nearestPlace: CampusPlace | null;
  distanceMeters: number | null;
  matchedSpotId?: string;
};
