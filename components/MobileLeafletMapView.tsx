"use client";

import { useEffect, useMemo, useRef } from "react";
import type { MapSpot as Spot } from "@/types/map-spot";
import type { Route } from "@/types/route";
import mapPointsData from "@/data/map-points.json";

type Props = {
  spots: Spot[];
  route: Route | null;
  selectedSpotId: string | null;
  sheetExpanded: boolean;
  onSelect: (id: string) => void;
};

type MapPoint = { id: string; x: number; y: number; name: string };

const MAP_WIDTH = 3227;
const MAP_HEIGHT = 2603;
const mapBounds: [[number, number], [number, number]] = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];
const anchors = Object.fromEntries((mapPointsData as MapPoint[]).map((point) => [point.id, point])) as Record<string, MapPoint>;

function anchorPosition(point: MapPoint): [number, number] {
  return [MAP_HEIGHT * (1 - point.y / 100), MAP_WIDTH * (point.x / 100)];
}

export default function MobileLeafletMapView({ spots, route, selectedSpotId, sheetExpanded, onSelect }: Props) {
  const mapRoot = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any>({ markers: [], route: null });
  const lastFittedRoute = useRef<string | null>(null);
  const orderedSpots = useMemo(() => route ? route.spots.map((id) => spots.find((spot) => spot.id === id)).filter(Boolean) as Spot[] : [], [route, spots]);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = await import("leaflet");
      if (disposed || !mapRoot.current || mapRef.current) return;
      const map = L.map(mapRoot.current, {
        crs: L.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
        minZoom: -3,
        maxZoom: 2,
        zoomSnap: 0.25,
        maxBoundsViscosity: 1,
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.imageOverlay("/images/map/campus-screenshot-mosaic.jpg", mapBounds, { alt: "大工凌水校区校园鸟瞰图", interactive: false }).addTo(map);
      const imageBounds = L.latLngBounds(mapBounds);
      const coverZoom = map.getBoundsZoom(imageBounds, true);
      map.setMaxBounds(imageBounds);
      map.setMinZoom(coverZoom);
      map.setView(imageBounds.getCenter(), coverZoom, { animate: false });
      mapRef.current = map;
      renderLayers(L, map);
    })();
    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => renderLayers(L, mapRef.current));
  }, [route, selectedSpotId, spots]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const frame = window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    const timer = window.setTimeout(() => map.invalidateSize({ pan: false }), 350);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [sheetExpanded]);

  useEffect(() => {
    const root = mapRoot.current;
    if (!root) return;
    const invalidate = () => {
      const map = mapRef.current;
      if (!map) return;
      map.invalidateSize({ pan: false });
      const coverZoom = map.getBoundsZoom(mapBounds, true);
      map.setMinZoom(coverZoom);
      if (map.getZoom() < coverZoom) map.setView([MAP_HEIGHT / 2, MAP_WIDTH / 2], coverZoom, { animate: false });
    };
    const observer = new ResizeObserver(invalidate);
    observer.observe(root);
    window.addEventListener("resize", invalidate);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, []);

  function renderLayers(L: typeof import("leaflet"), map: any) {
    layersRef.current.markers.forEach((marker: any) => marker.remove());
    if (layersRef.current.route) layersRef.current.route.remove();

    layersRef.current.markers = spots.map((spot) => {
      const anchor = anchors[spot.id];
      if (!anchor) return null;
      const routeIndex = route?.spots.indexOf(spot.id) ?? -1;
      const onRoute = routeIndex >= 0;
      const classes = [
        "photo-marker",
        selectedSpotId === spot.id ? "is-selected" : "",
        route && !onRoute ? "is-muted" : "",
        onRoute ? "is-route" : "",
        onRoute && routeIndex === 0 ? "is-start" : "",
        onRoute && routeIndex === (route?.spots.length || 0) - 1 ? "is-end" : "",
      ].filter(Boolean).join(" ");
      const content = onRoute ? `<span class="route-number">${routeIndex + 1}</span>` : `<span class="photo-dot"></span>`;
      const iconWidth = Math.max(68, Array.from(anchor.name).length * 10 + 18);
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-photo-marker-wrap"><div class="${classes}">${content}</div><span class="map-photo-marker-label">${anchor.name}</span></div>`,
        iconSize: [iconWidth, 58],
        iconAnchor: [iconWidth / 2, 22],
      });
      const marker = L.marker(anchorPosition(anchor), { icon, keyboard: true, title: anchor.name }).addTo(map);
      marker.on("click", () => onSelect(spot.id));
      return marker;
    }).filter(Boolean);

    const routePositions = orderedSpots.map((spot) => anchors[spot.id]).filter(Boolean).map(anchorPosition);
    if (route && routePositions.length > 1) {
      layersRef.current.route = L.polyline(routePositions, { className: "map-route-line", color: "#287f8d", weight: 4, opacity: 0.9, dashArray: "2 10", lineCap: "round" }).addTo(map);
    }
    if (route && routePositions.length > 1 && lastFittedRoute.current !== route.id) {
      const bounds = L.latLngBounds(routePositions);
      map.fitBounds(bounds, { paddingTopLeft: [35, 135], paddingBottomRight: [35, 140], maxZoom: 0.25, animate: true });
      lastFittedRoute.current = route.id;
    }
    if (!route) lastFittedRoute.current = null;
    if (selectedSpotId) {
      const anchor = anchors[selectedSpotId];
      if (anchor) {
        const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        map.flyTo(anchorPosition(anchor), Math.max(map.getZoom(), 0), { duration: reduceMotion ? 0 : 0.65 });
      }
    }
  }

  return <div ref={mapRoot} className="h-full min-h-[390px] w-full" aria-label="校园点位地图" />;
}
