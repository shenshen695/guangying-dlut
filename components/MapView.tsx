"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Spot } from "@/types/spot";
import type { Route } from "@/types/route";
import type { RouteGeoJSON } from "@/types/geojson";
import { wgs84ToGcj02 } from "@/lib/coordinates";

type Props = { spots: Spot[]; route: Route; selectedSpotId: string | null; sheetExpanded: boolean; onSelect: (id: string) => void };

export default function MapView({ spots, route, selectedSpotId, sheetExpanded, onSelect }: Props) {
  const mapRoot = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any>({ markers: [], route: null });
  const orderedSpots = useMemo(() => route.spots.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean) as Spot[], [route, spots]);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = await import("leaflet");
      if (disposed || !mapRoot.current || mapRef.current) return;
      // AMap's appmaptile raster source is GCJ-02; keep Leaflet's default
      // Web-Mercator projection and convert WGS84 data only at this boundary.
      const mapCenter = wgs84ToGcj02(38.8794, 121.5275);
      const map = L.map(mapRoot.current, { zoomControl: false, attributionControl: true }).setView(mapCenter, 14);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=2&style=8&x={x}&y={y}&z={z}", {
        subdomains: ["1", "2", "3", "4"],
        attribution: "© 高德地图",
        detectRetina: true,
        tileSize: 256,
        zoomOffset: 0,
        minZoom: 3,
        maxZoom: 18,
      }).addTo(map);
      mapRef.current = map;
      renderLayers(L, map);
    })();
    return () => { disposed = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (!mapRef.current) return; import("leaflet").then((L) => renderLayers(L, mapRef.current)); }, [route, selectedSpotId, spots]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let frame = window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    const timer = window.setTimeout(() => map.invalidateSize({ pan: false }), 350);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [sheetExpanded]);

  useEffect(() => {
    const root = mapRoot.current;
    if (!root) return;
    const invalidate = () => mapRef.current?.invalidateSize({ pan: false });
    const observer = new ResizeObserver(invalidate);
    observer.observe(root);
    window.addEventListener("resize", invalidate);
    return () => { observer.disconnect(); window.removeEventListener("resize", invalidate); };
  }, []);

  function renderLayers(L: typeof import("leaflet"), map: any) {
    layersRef.current.markers.forEach((marker: any) => marker.remove());
    if (layersRef.current.route) layersRef.current.route.remove();
    layersRef.current.markers = orderedSpots.map((spot, index) => {
      const icon = L.divIcon({ className: "", html: `<div class="numbered-marker ${selectedSpotId === spot.id ? "is-selected" : ""}">${String(index + 1).padStart(2, "0")}</div>`, iconSize: [36, 36], iconAnchor: [18, 18] });
      const displayPosition = wgs84ToGcj02(spot.latitude, spot.longitude);
      const marker = L.marker(displayPosition, { icon, keyboard: true, title: spot.name }).addTo(map);
      marker.on("click", () => onSelect(spot.id));
      return marker;
    });
    const coordinates = orderedSpots.map((spot) => {
      const [latitude, longitude] = wgs84ToGcj02(spot.latitude, spot.longitude);
      return [longitude, latitude] as [number, number];
    });
    const routeGeoJSON: RouteGeoJSON = { type: "FeatureCollection", features: coordinates.length > 1 ? [{ type: "Feature", properties: { routeId: route.id }, geometry: { type: "LineString", coordinates } }] : [] };
    if (routeGeoJSON.features.length) layersRef.current.route = L.geoJSON(routeGeoJSON as any, { style: { className: "map-route-line", color: "#de8068", weight: 3, opacity: 0.78, dashArray: "4 9", lineCap: "round" } }).addTo(map);
    if (selectedSpotId) { const selected = spots.find((spot) => spot.id === selectedSpotId); if (selected) { const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches; map.flyTo(wgs84ToGcj02(selected.latitude, selected.longitude), Math.max(map.getZoom(), 16), { duration: reduceMotion ? 0 : 0.65 }); } }
  }

  return <div ref={mapRoot} className="h-full min-h-[390px] w-full" aria-label="校园点位地图" />;
}
