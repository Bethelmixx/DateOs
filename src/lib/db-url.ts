const URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "NEON_DATABASE_URL",
] as const;

function trimEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

export function forcePooler(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("neon.tech") && !u.hostname.includes("-pooler")) {
      u.hostname = u.hostname.replace(/^(ep-[a-z0-9-]+)(\.)/i, "$1-pooler$2");
    }
    if (!/sslmode=/i.test(u.search)) {
      u.searchParams.set("sslmode", "require");
    }
    return u.toString();
  } catch {
    return url;
  }
}

export function resolveDatabaseUrl(): string | undefined {
  for (const key of URL_KEYS) {
    const value = trimEnv(key);
    if (value) return forcePooler(value);
  }
  return undefined;
}
