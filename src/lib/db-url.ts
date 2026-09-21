const URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "NEON_DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

function runtimeEnv(): Record<string, string | undefined> {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env ?? {};
}

export function envGet(name: string): string | undefined {
  const raw = runtimeEnv()[name];
  if (typeof raw !== "string") return undefined;
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value || undefined;
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

function fromPgPieces(): string | undefined {
  const host = envGet("PGHOST") ?? envGet("POSTGRES_HOST");
  const user = envGet("PGUSER") ?? envGet("POSTGRES_USER");
  const password = envGet("PGPASSWORD") ?? envGet("POSTGRES_PASSWORD");
  const database = envGet("PGDATABASE") ?? envGet("POSTGRES_DATABASE") ?? envGet("POSTGRES_DB") ?? "neondb";
  if (!host || !user || !password) return undefined;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${database}?sslmode=require`;
}

export function resolveDatabaseUrl(): string | undefined {
  for (const key of URL_KEYS) {
    const value = envGet(key);
    if (value) return forcePooler(value);
  }
  const pieced = fromPgPieces();
  return pieced ? forcePooler(pieced) : undefined;
}

export function envStatus(): { vercel: boolean; database: boolean; keys: string[] } {
  const env = runtimeEnv();
  const keys = [
    ...URL_KEYS,
    "PGHOST",
    "PGUSER",
    "PGPASSWORD",
    "PGDATABASE",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
  ].filter((key) => Boolean(envGet(key)));
  return {
    vercel: Boolean(env.VERCEL || env.VERCEL_ENV),
    database: Boolean(resolveDatabaseUrl()),
    keys,
  };
}
