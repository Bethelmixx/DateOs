import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { createHash, randomBytes } from "node:crypto";
import { ensureDbReady, getPglite, getSharedPool } from "../db";
import { resolveDatabaseUrl } from "../db-url";
import { isValidUsername, normalizeUsername, usernameToEmail } from "./credentials";
import { pgliteDialect } from "./pglite-dialect";

void ensureDbReady();

const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

const onVercel = Boolean(env("VERCEL"));

const globalAuthRef = globalThis as typeof globalThis & {
  __dateosAuthSecret__?: string;
};

function localAuthSecret(): string {
  globalAuthRef.__dateosAuthSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__dateosAuthSecret__;
}

function stableSecret(): string {
  const explicit = env("BETTER_AUTH_SECRET");
  if (explicit) return explicit;
  if (onVercel) {
    const seed = env("VERCEL_PROJECT_ID") ?? env("VERCEL_URL") ?? "dateos";
    return createHash("sha256").update(`dateos-auth:${seed}`).digest("hex");
  }
  return localAuthSecret();
}

export const authConfigured = true;

const LOCAL_DEV_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];

function addOrigin(out: Set<string>, raw: string | undefined) {
  if (!raw) return;
  const value = raw.startsWith("http") ? raw : `https://${raw}`;
  try {
    const u = new URL(value);
    const origin = `${u.protocol}//${u.host}`;
    out.add(origin);
    if (u.hostname.startsWith("www.")) {
      out.add(`${u.protocol}//${u.hostname.slice(4)}`);
    } else if (u.hostname.includes(".")) {
      out.add(`${u.protocol}//www.${u.hostname}`);
    }
  } catch {
    /* ignore malformed */
  }
}

function trustedOriginList(): string[] {
  const out = new Set<string>(LOCAL_DEV_ORIGINS);
  addOrigin(out, env("BETTER_AUTH_URL"));
  addOrigin(out, env("VERCEL_URL"));
  addOrigin(out, env("VERCEL_PROJECT_PRODUCTION_URL"));
  addOrigin(out, env("VERCEL_BRANCH_URL"));
  env("BETTER_AUTH_TRUSTED_ORIGINS")
    ?.split(",")
    .forEach((item) => addOrigin(out, item.trim()));
  out.add("https://*.vercel.app");
  out.add("*.vercel.app");
  return Array.from(out);
}

const vercelUrl = env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : undefined;
const explicitBaseURL =
  env("BETTER_AUTH_URL") ??
  (env("VERCEL_PROJECT_PRODUCTION_URL")
    ? `https://${env("VERCEL_PROJECT_PRODUCTION_URL")}`
    : vercelUrl);

const databaseUrl = resolveDatabaseUrl();

const database = databaseUrl
  ? getSharedPool()
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

export const SESSION_TOKEN_COOKIE = "dateos.session_token";

export const auth = betterAuth({
  baseURL: explicitBaseURL ?? "http://localhost:8080",
  secret: stableSecret(),
  database,
  trustedOrigins: async (request) => {
    const origins = trustedOriginList();
    const header = request?.headers.get("origin");
    if (header) {
      try {
        const host = new URL(header).hostname;
        if (host.endsWith(".vercel.app") || host === "vercel.app") origins.push(header);
      } catch {
        /* ignore */
      }
    }
    return origins;
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 72,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const name = normalizeUsername(user.name ?? "");
          if (!isValidUsername(name) || user.email !== usernameToEmail(name)) {
            throw new APIError("BAD_REQUEST", {
              message: "Usa 3 a 20 letras, números o _",
            });
          }
          return { data: { ...user, name, email: usernameToEmail(name) } };
        },
      },
    },
  },
  session: { cookieCache: { enabled: true, maxAge: 300 } },
  user: {
    changeEmail: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    customRules: {
      "/sign-in/email": { window: 10, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      path: "/",
      secure: onVercel ? true : undefined,
    },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "dateos.session_data" },
    },
  },
  plugins: [tanstackStartCookies()],
});

export function readSessionToken(): string | null {
  try {
    return getCookie(SESSION_TOKEN_COOKIE) ?? null;
  } catch {
    return null;
  }
}
