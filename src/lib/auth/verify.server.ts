import { getRequest } from "@tanstack/react-start/server";
import { auth, authConfigured } from "./server";
import { ensureNeonReady } from "../db";
import { resolveDatabaseUrl } from "../db-url";

const databaseConfigured = Boolean(resolveDatabaseUrl());

export { authConfigured };

export const DEV_USER_ID = "dev-user";

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export type VerifiedUser = { id: string; email: string | null };

export async function getSessionUser(): Promise<VerifiedUser | null> {
  if (!authConfigured) return null;
  if (databaseConfigured) await ensureNeonReady();
  try {
    const request = getRequest();
    if (!request) return null;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return null;
    return { id: session.user.id, email: session.user.email ?? null };
  } catch (err) {
    console.error("[auth] getSessionUser failed", err);
    return null;
  }
}

export async function requireUserId(): Promise<string> {
  if (!authConfigured) {
    if (databaseConfigured) throw new UnauthorizedError();
    return DEV_USER_ID;
  }
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user.id;
}
