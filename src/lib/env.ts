const trim = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

export function missingProductionEnv(): string[] {
  if (!trim("VERCEL")) return [];
  const missing: string[] = [];
  if (!trim("DATABASE_URL")) missing.push("DATABASE_URL");
  if (!trim("BETTER_AUTH_SECRET")) missing.push("BETTER_AUTH_SECRET");
  return missing;
}

export function productionConfigError(): string | null {
  const missing = missingProductionEnv();
  if (!missing.length) return null;
  return `Falta ${missing.join(" y ")} en Vercel → Settings → Environment Variables. Después: Redeploy.`;
}
