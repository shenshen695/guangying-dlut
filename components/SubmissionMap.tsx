"use client";

import { useEffect, useRef } from "react";
import type { Spot } from "@/types/spot";
import type { CameraSpotSubmission } from "@/types/submission";
import { gcj02ToWgs84, wgs84ToGcj02 } from "@/lib/coordinates";

type Props = {
  spot?: Spot;
  initialCenter?: { latitude: number; longitude: number };
  cameraSpot: CameraSpotSubmission | null;
  onChange: (cameraSpot: CameraSpotSubmission) => void;
};

export default function SubmissionMap({ spot, initialCenter, cameraSpot, onChange }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = await import("leaflet");
      if (disposed || !root.current || mapRef.current) return;
      const center = initialCenter ?? (spot ? { latitude: spot.latitude, longitude: spot.longitude } : { latitude: 38.8794, longitude: 121.5275 });
      const map = L.map(root.current, { zoomControl: false, attributionControl: true }).setView(wgs84ToGcj02(center.latitude, center.longitude), 16);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=2&style=8&x={x}&y={y}&z={z}", {
        subdomains: ["1", "2", "3", "4"], attribution: "© 高德地图", detectRetina: true, maxZoom: 18,
      }).addTo(map);

      if (spot) {
        const spotIcon = L.divIcon({ className: "", html: '<div class="submission-spot-marker">点位</div>', iconSize: [42, 42], iconAnchor: [21, 21] });
        L.marker(wgs84ToGcj02(spot.latitude, spot.longitude), { icon: spotIcon, interactive: false }).addTo(map);
      }
      mapRef.current = map;

      const setCameraMarker = (latlng: { lat: number; lng: number }) => {
        if (!markerRef.current) {
          const icon = L.divIcon({ className: "", html: '<div class="submission-camera-marker">⌖</div>', iconSize: [42, 42], iconAnchor: [21, 21] });
          markerRef.current = L.marker(latlng, { icon, draggable: true, title: "这是摄影师站的位置" }).addTo(map);
          markerRef.current.on("dragend", () => {
            const point = markerRef.current.getLatLng();
            const [latitude, longitude] = gcj02ToWgs84(point.lat, point.lng);
            onChangeRef.current({ latitude, longitude, label: spot ? `${spot.name}附近拍摄机位` : "自定义摄影机位", source: "user" });
          });
        } else markerRef.current.setLatLng(latlng);
      };

      map.on("click", (event: any) => {
        setCameraMarker(event.latlng);
        const [latitude, longitude] = gcj02ToWgs84(event.latlng.lat, event.latlng.lng);
        onChangeRef.current({ latitude, longitude, label: spot ? `${spot.name}附近拍摄机位` : "自定义摄影机位", source: "user" });
      });
      if (cameraSpot) setCameraMarker({ lat: wgs84ToGcj02(cameraSpot.latitude, cameraSpot.longitude)[0], lng: wgs84ToGcj02(cameraSpot.latitude, cameraSpot.longitude)[1] });
      map.whenReady(() => map.invalidateSize({ pan: false }));
    })();
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; markerRef.current = null; };
  }, [spot?.latitude, spot?.longitude, initialCenter?.latitude, initialCenter?.longitude]);

  useEffect(() => {
    if (!mapRef.current || !cameraSpot) return;
    // Both formal Spots and submission candidates are stored as WGS84;
    // conversion occurs only at the AMap display boundary.
    if (markerRef.current) markerRef.current.setLatLng(wgs84ToGcj02(cameraSpot.latitude, cameraSpot.longitude));
  }, [cameraSpot]);

  return <div ref={root} className="h-[350px] w-full sm:h-[480px]" aria-label={`${spot ? `${spot.name}附近` : "校园"}的摄影机位地图`} />;
}
