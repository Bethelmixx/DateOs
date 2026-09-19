import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { pgliteDialect } from "./pglite-dialect";

void ensureDbReady();

const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

const globalAuthRef = globalThis as typeof globalThis & {
  __dateosAuthSecret__?: string;
};

function localAuthSecret(): string {
  globalAuthRef.__dateosAuthSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__dateosAuthSecret__;
}

export const authConfigured = true;

const vercelUrl = env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : undefined;
const explicitBaseURL = env("BETTER_AUTH_URL") ?? vercelUrl;
const LOCAL_DEV_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];

const trustedOrigins = Array.from(
  new Set(
    [explicitBaseURL, vercelUrl, ...LOCAL_DEV_ORIGINS].filter(
      (v): v is string => Boolean(v),
    ),
  ),
);

const databaseUrl = env("DATABASE_URL");
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

export const SESSION_TOKEN_COOKIE = "dateos.session_token";

export const auth = betterAuth({
  baseURL: explicitBaseURL ?? "http://localhost:8080",
  secret: env("BETTER_AUTH_SECRET") ?? localAuthSecret(),
  database,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 72,
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
    },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "dateos.session_data" },
    },
  },
  plugins: [tanstackStartCookies()],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}
