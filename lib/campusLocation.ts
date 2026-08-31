import { campusPlaces } from "@/data/campusPlaces";
import type { CampusLocationResolution, CampusPlace } from "@/types/campus";

const EARTH_RADIUS_METERS = 6_371_000;
export const CAMPUS_MATCH_THRESHOLD_METERS = 180;

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const lat1 = aLat * rad;
  const lat2 = bLat * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function localCampusResolver(latitude: number, longitude: number): CampusLocationResolution {
  let nearestPlace: CampusPlace | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const place of campusPlaces) {
    const distance = distanceMeters(latitude, longitude, place.latitude, place.longitude);
    if (distance < nearestDistance) { nearestDistance = distance; nearestPlace = place; }
  }
  const matchedSpotId = nearestPlace?.type === "spot" && nearestDistance <= CAMPUS_MATCH_THRESHOLD_METERS ? nearestPlace.id : undefined;
  return {
    latitude,
    longitude,
    nearestPlace: nearestPlace && nearestDistance <= CAMPUS_MATCH_THRESHOLD_METERS ? nearestPlace : null,
    distanceMeters: nearestPlace && nearestDistance <= CAMPUS_MATCH_THRESHOLD_METERS ? nearestDistance : null,
    matchedSpotId,
  };
}

/** Stable application seam for a future amapReverseGeocoder implementation. */
export function resolveCampusLocation(latitude: number, longitude: number) {
  return localCampusResolver(latitude, longitude);
}

export function getCampusPlace(id: string) { return campusPlaces.find((place) => place.id === id) ?? null; }
