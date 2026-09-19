/** Caracas — default center when GPS is unavailable. */
export const DEFAULT_CENTER = { lat: 10.4806, lng: -66.9036 };
export const DEFAULT_ZOOM = 13;

export type LatLng = { lat: number; lng: number };

export type BoundingBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export function padBounds(b: BoundingBox, factor = 0.15): BoundingBox {
  const latPad = (b.maxLat - b.minLat) * factor || 0.04;
  const lngPad = (b.maxLng - b.minLng) * factor || 0.04;
  return {
    minLat: b.minLat - latPad,
    maxLat: b.maxLat + latPad,
    minLng: b.minLng - lngPad,
    maxLng: b.maxLng + lngPad,
  };
}

export function clampBounds(b: BoundingBox): BoundingBox {
  let minLat = Math.min(90, Math.max(-90, b.minLat));
  let maxLat = Math.min(90, Math.max(-90, b.maxLat));
  let minLng = Math.min(180, Math.max(-180, b.minLng));
  let maxLng = Math.min(180, Math.max(-180, b.maxLng));
  if (minLat > maxLat) [minLat, maxLat] = [maxLat, minLat];
  if (minLng > maxLng) [minLng, maxLng] = [maxLng, minLng];
  return { minLat, maxLat, minLng, maxLng };
}

export function isValidLatLng(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
