import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from "leaflet";
import type { Report } from "@/lib/reports/types";
import { DEFAULT_CENTER, DEFAULT_ZOOM, isValidLatLng, type BoundingBox, type LatLng } from "@/lib/geo";

const TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

type LeafletNS = typeof import("leaflet");

type Props = {
  reports: Report[];
  selectedId: string | null;
  userLocation: LatLng | null;
  dropPin: LatLng | null;
  focusToken: number;
  focusTarget: LatLng | null;
  pinPickMode: boolean;
  onSelect: (id: string) => void;
  onBounds: (b: BoundingBox) => void;
  onPick: (loc: LatLng) => void;
};

export function MapCanvas({
  reports,
  selectedId,
  userLocation,
  dropPin,
  focusToken,
  focusTarget,
  pinPickMode,
  onSelect,
  onBounds,
  onPick,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const LRef = useRef<LeafletNS | null>(null);
  const markersRef = useRef(new Map<string, LeafletMarker>());
  const userRef = useRef<LeafletMarker | null>(null);
  const dropRef = useRef<LeafletMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  const onBoundsRef = useRef(onBounds);
  const onPickRef = useRef(onPick);
  const pinPickRef = useRef(pinPickMode);
  const [ready, setReady] = useState(false);
  onSelectRef.current = onSelect;
  onBoundsRef.current = onBounds;
  onPickRef.current = onPick;
  pinPickRef.current = pinPickMode;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    void (async () => {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !hostRef.current) return;
      const L = leaflet.default;

      const map = L.map(el, {
        zoomControl: false,
        attributionControl: true,
        center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: DEFAULT_ZOOM,
      });
      const tiles = L.tileLayer(TILES, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      map.attributionControl.setPrefix("");

      const emit = () => {
        const b = map.getBounds();
        onBoundsRef.current({
          minLat: b.getSouth(),
          maxLat: b.getNorth(),
          minLng: b.getWest(),
          maxLng: b.getEast(),
        });
      };
      map.on("moveend", emit);
      map.on("click", (e: LeafletMouseEvent) => {
        if (!pinPickRef.current) return;
        onPickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      LRef.current = L;
      mapRef.current = map;
      emit();
      requestAnimationFrame(() => map.invalidateSize());
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(el);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      LRef.current = null;
      markersRef.current.clear();
      userRef.current = null;
      dropRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map) map.getContainer().style.cursor = pinPickMode ? "crosshair" : "";
  }, [pinPickMode, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !ready) return;
    const keep = new Set(reports.map((r) => r.id));

    for (const [id, marker] of markersRef.current) {
      if (!keep.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    for (const report of reports) {
      if (!isValidLatLng(report.lat, report.lng)) continue;
      const html = `<div class="av-marker av-marker--${report.status}${report.id === selectedId ? " av-marker--selected" : ""}"><span></span></div>`;
      const icon = L.divIcon({
        className: "av-marker-wrap",
        html,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      let marker = markersRef.current.get(report.id);
      if (!marker) {
        marker = L.marker([report.lat, report.lng], { icon, zIndexOffset: 200 }).addTo(map);
        marker.on("click", (ev) => {
          L.DomEvent.stopPropagation(ev);
          onSelectRef.current(report.id);
        });
        markersRef.current.set(report.id, marker);
      } else {
        marker.setLatLng([report.lat, report.lng]);
        marker.setIcon(icon);
        marker.setZIndexOffset(report.id === selectedId ? 600 : 200);
      }
    }
  }, [reports, selectedId, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !ready) return;
    if (!userLocation) {
      userRef.current?.remove();
      userRef.current = null;
      return;
    }
    const icon = L.divIcon({
      className: "av-marker-wrap",
      html: `<div class="av-user-dot"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    if (!userRef.current) {
      userRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon,
        interactive: false,
        zIndexOffset: 400,
      }).addTo(map);
    } else {
      userRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !ready) return;
    if (!dropPin) {
      dropRef.current?.remove();
      dropRef.current = null;
      return;
    }
    const icon = L.divIcon({
      className: "av-marker-wrap",
      html: `<div class="av-drop-pin"></div>`,
      iconSize: [22, 28],
      iconAnchor: [11, 22],
    });
    if (!dropRef.current) {
      dropRef.current = L.marker([dropPin.lat, dropPin.lng], {
        icon,
        interactive: false,
        zIndexOffset: 700,
      }).addTo(map);
    } else {
      dropRef.current.setLatLng([dropPin.lat, dropPin.lng]);
      dropRef.current.setIcon(icon);
    }
  }, [dropPin, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !focusTarget || focusToken === 0) return;
    map.flyTo([focusTarget.lat, focusTarget.lng], Math.max(map.getZoom(), 15), { duration: 0.7 });
  }, [focusToken, focusTarget, ready]);

  return <div ref={hostRef} className="absolute inset-0 z-0 h-full w-full" />;
}
