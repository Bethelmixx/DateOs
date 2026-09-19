import { statusFromVotes, type CategoryId, type StatusId } from "@/lib/categories";
import type { Profile, Report, VoteKind } from "@/lib/reports/types";
import { isValidPassword, isValidUsername, normalizeUsername } from "@/lib/auth/credentials";

const KEY = "dateos.local.v1";
const AUTH_EVENT = "dateos-auth";

type LocalUser = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

type LocalProfile = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number;
  createdAt: string;
};

type LocalReport = {
  id: string;
  userId: string;
  category: CategoryId;
  problemType: string;
  severity: string;
  description: string;
  lat: number;
  lng: number;
  photoData: string | null;
  createdAt: string;
};

type LocalVote = { reportId: string; userId: string; vote: VoteKind; createdAt: string };

type State = {
  users: LocalUser[];
  sessionUserId: string | null;
  profiles: LocalProfile[];
  reports: LocalReport[];
  votes: LocalVote[];
};

const empty = (): State => ({
  users: [],
  sessionUserId: null,
  profiles: [],
  reports: [],
  votes: [],
});

function load(): State {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    return empty();
  }
}

function save(state: State) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(`dateos:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function mapReport(row: LocalReport, state: State, viewerId: string, includePhoto: boolean): Report {
  const confirm = state.votes.filter((v) => v.reportId === row.id && v.vote === "confirm").length;
  const resolved = state.votes.filter((v) => v.reportId === row.id && v.vote === "resolved").length;
  const profile = state.profiles.find((p) => p.userId === row.userId);
  const mine = state.votes.find((v) => v.reportId === row.id && v.userId === viewerId);
  return {
    id: row.id,
    category: row.category,
    problemType: row.problemType,
    severity: row.severity as Report["severity"],
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    hasPhoto: Boolean(row.photoData),
    photoData: includePhoto ? row.photoData : null,
    confirmationCount: confirm,
    resolvedCount: resolved,
    status: statusFromVotes(confirm, resolved),
    createdAt: row.createdAt,
    author: {
      userId: row.userId,
      username: profile?.username ?? "vecino",
      displayName: profile?.displayName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      reputation: profile?.reputation ?? 3,
    },
    isOwner: row.userId === viewerId,
    myVote: mine?.vote ?? null,
  };
}

export function isBrowserLocal() {
  return typeof window !== "undefined" && Boolean((window as Window & { __DATEOS_LOCAL__?: boolean }).__DATEOS_LOCAL__);
}

export function subscribeLocalAuth(cb: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(AUTH_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(AUTH_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function getLocalSessionUser(): { id: string; displayName: string | null } | null {
  const state = load();
  if (!state.sessionUserId) return null;
  const profile = state.profiles.find((p) => p.userId === state.sessionUserId);
  const user = state.users.find((u) => u.id === state.sessionUserId);
  if (!user) return null;
  return { id: user.id, displayName: profile?.displayName ?? user.username };
}

export async function localSignUp(username: string, password: string) {
  const name = normalizeUsername(username);
  if (!isValidUsername(name)) throw new Error("Usa 3 a 20 letras, números o _");
  if (!isValidPassword(password)) throw new Error("La contraseña debe tener al menos 8 caracteres");
  const state = load();
  if (state.users.some((u) => u.username === name)) throw new Error("Ese usuario ya existe");
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  state.users.push({ id, username: name, passwordHash: await hashPassword(password), createdAt: now });
  state.profiles.push({
    userId: id,
    username: name,
    displayName: name,
    avatarUrl: null,
    reputation: 3,
    createdAt: now,
  });
  state.sessionUserId = id;
  save(state);
}

export async function localSignIn(username: string, password: string) {
  const name = normalizeUsername(username);
  if (!isValidUsername(name)) throw new Error("Usa 3 a 20 letras, números o _");
  const state = load();
  const user = state.users.find((u) => u.username === name);
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw new Error("Usuario o contraseña incorrectos");
  }
  state.sessionUserId = user.id;
  save(state);
}

export function localSignOut() {
  const state = load();
  state.sessionUserId = null;
  save(state);
}

function requireUser(state: State) {
  if (!state.sessionUserId) throw new Error("Inicia sesión");
  return state.sessionUserId;
}

export function localListReports(input: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  categories?: CategoryId[];
  statuses?: StatusId[];
}): Report[] {
  const state = load();
  const viewer = state.sessionUserId ?? "";
  return state.reports
    .filter(
      (r) =>
        r.lat >= input.minLat &&
        r.lat <= input.maxLat &&
        r.lng >= input.minLng &&
        r.lng <= input.maxLng,
    )
    .map((r) => mapReport(r, state, viewer, false))
    .filter((r) => {
      if (input.categories?.length && !input.categories.includes(r.category)) return false;
      if (input.statuses?.length && !input.statuses.includes(r.status)) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 400);
}

export function localGetReport(id: string): Report | null {
  const state = load();
  const row = state.reports.find((r) => r.id === id);
  if (!row) return null;
  return mapReport(row, state, state.sessionUserId ?? "", true);
}

export function localCreateReport(input: {
  category: CategoryId;
  problemType: string;
  severity: string;
  description: string;
  lat: number;
  lng: number;
  photoData?: string | null;
}): Report {
  const state = load();
  const userId = requireUser(state);
  const recent = state.reports.filter(
    (r) => r.userId === userId && Date.now() - new Date(r.createdAt).getTime() < 10 * 60_000,
  );
  if (recent.length >= 5) throw new Error("Demasiados reportes seguidos. Espera unos minutos.");
  const row: LocalReport = {
    id: crypto.randomUUID(),
    userId,
    category: input.category,
    problemType: input.problemType,
    severity: input.severity,
    description: input.description,
    lat: input.lat,
    lng: input.lng,
    photoData: input.photoData ?? null,
    createdAt: new Date().toISOString(),
  };
  state.reports.unshift(row);
  save(state);
  return mapReport(row, state, userId, true);
}

export function localVote(reportId: string, vote: VoteKind): Report {
  const state = load();
  const userId = requireUser(state);
  const row = state.reports.find((r) => r.id === reportId);
  if (!row) throw new Error("Ese reporte ya no existe.");
  if (row.userId === userId) throw new Error("No puedes verificar tu propio reporte.");
  const existing = state.votes.find((v) => v.reportId === reportId && v.userId === userId);
  if (existing) existing.vote = vote;
  else state.votes.push({ reportId, userId, vote, createdAt: new Date().toISOString() });
  save(state);
  return mapReport(row, state, userId, true);
}

export function localDeleteReport(id: string) {
  const state = load();
  const userId = requireUser(state);
  const before = state.reports.length;
  state.reports = state.reports.filter((r) => !(r.id === id && r.userId === userId));
  if (state.reports.length === before) throw new Error("No puedes borrar ese reporte.");
  state.votes = state.votes.filter((v) => v.reportId !== id);
  save(state);
}

export function localGetProfile(): Profile {
  const state = load();
  const userId = requireUser(state);
  const p = state.profiles.find((x) => x.userId === userId);
  if (!p) throw new Error("No se pudo cargar el perfil");
  return {
    ...p,
    reportCount: state.reports.filter((r) => r.userId === userId).length,
  };
}

export function localUpdateProfile(input: {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}): Profile {
  const state = load();
  const userId = requireUser(state);
  const username = normalizeUsername(input.username);
  if (!isValidUsername(username)) {
    throw new Error("El usuario debe tener 3–20 caracteres (letras, números o _).");
  }
  if (state.users.some((u) => u.username === username && u.id !== userId)) {
    throw new Error("Ese nombre de usuario ya está en uso.");
  }
  const user = state.users.find((u) => u.id === userId);
  const profile = state.profiles.find((p) => p.userId === userId);
  if (!user || !profile) throw new Error("No se pudo actualizar el perfil");
  user.username = username;
  profile.username = username;
  profile.displayName = input.displayName.trim().slice(0, 48);
  if (input.avatarUrl !== undefined) profile.avatarUrl = input.avatarUrl;
  save(state);
  return localGetProfile();
}
