import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

export function timeAgo(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
  } catch {
    return "";
  }
}

export function formatStamp(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy · HH:mm", { locale: es });
  } catch {
    return iso;
  }
}

export function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    return value;
  }
  return new Date().toISOString();
}

export function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value === "t" || value === "true" || value === 1 || value === "1") return true;
  return false;
}

export function initials(name: string | null | undefined) {
  const t = (name ?? "").trim();
  if (!t) return "V";
  const parts = t.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}
