import spotsData from "@/data/spots.json";
import type { Spot } from "@/types/spot";
import type { CampusPlace } from "@/types/campus";

const spots = spotsData as Spot[];

/** Local, keyless campus gazetteer. Coordinates remain WGS84 like formal Spots. */
export const campusPlaces: CampusPlace[] = [
  ...spots.map((spot) => ({
    id: spot.id,
    name: spot.name,
    aliases: [spot.shortName, spot.area],
    latitude: spot.latitude,
    longitude: spot.longitude,
    type: "spot" as const,
  })),
  { id: "stadium", name: "体育场", aliases: ["体育馆", "运动场"], latitude: 38.87955, longitude: 121.5262, type: "facility" },
  { id: "west-gate", name: "西门", aliases: ["校园西门"], latitude: 38.87905, longitude: 121.5146, type: "gate" },
  { id: "south-lake-shore", name: "凌水湖东岸", aliases: ["湖东岸", "湖边"], latitude: 38.88125, longitude: 121.5221, type: "landscape" },
];
