export type LineStringFeature = {
  type: "Feature";
  properties: { routeId: string };
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

export type RouteGeoJSON = {
  type: "FeatureCollection";
  features: LineStringFeature[];
};
