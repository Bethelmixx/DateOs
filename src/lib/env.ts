import { resolveDatabaseUrl } from "./db-url";

export function isLocalMode(): boolean {
  return Boolean(process.env.VERCEL) && !resolveDatabaseUrl();
}

export function productionConfigError(): string | null {
  return null;
}
