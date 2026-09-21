import { envGet, resolveDatabaseUrl } from "./db-url";

export function isLocalMode(): boolean {
  return Boolean(envGet("VERCEL") || envGet("VERCEL_ENV")) && !resolveDatabaseUrl();
}

export function productionConfigError(): string | null {
  return null;
}
