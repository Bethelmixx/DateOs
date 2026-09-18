import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { asNumber, toIso } from "@/lib/format";
import type { Profile } from "@/lib/reports/types";

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  reputation: unknown;
  created_at: unknown;
  report_count: unknown;
};

function slugify(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  return base || "vecino";
}

export async function ensureProfile(sql: Sql, userId: string): Promise<void> {
  const existing = await sql<{ user_id: string }>`
    select user_id from profiles where user_id = ${userId} limit 1
  `;
  if (existing[0]) return;

  const authRows = await sql<{ name: string | null; image: string | null }>`
    select name, image from "user" where id = ${userId} limit 1
  `;
  const auth = authRows[0];
  const base = slugify(auth?.name ?? "vecino");
  let username = base;
  for (let i = 0; i < 30; i += 1) {
    const clash = await sql<{ username: string }>`
      select username from profiles where username = ${username} limit 1
    `;
    if (!clash[0]) break;
    username = `${base}${Math.floor(10 + Math.random() * 89)}`;
  }

  await sql`
    insert into profiles (user_id, username, display_name, avatar_url)
    values (${userId}, ${username}, ${auth?.name ?? null}, ${auth?.image ?? null})
  `;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    reputation: asNumber(row.reputation, 3),
    createdAt: toIso(row.created_at),
    reportCount: asNumber(row.report_count, 0),
  };
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Profile> => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId);
    const rows = await sql<ProfileRow>`
      select p.user_id, p.username, p.display_name, p.avatar_url, p.reputation, p.created_at,
             (select count(*) from reports r where r.user_id = p.user_id) as report_count
      from profiles p
      where p.user_id = ${context.userId}
      limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("No se pudo cargar el perfil");
    return mapProfile(row);
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { username: string; displayName: string; avatarUrl?: string | null }) => {
    const username = input.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      throw new Error("El usuario debe tener 3–24 caracteres (letras, números o _).");
    }
    const displayName = input.displayName.trim().slice(0, 48);
    if (!displayName) throw new Error("Escribe un nombre para mostrar.");
    const avatarUrl = input.avatarUrl === undefined ? undefined : input.avatarUrl;
    if (avatarUrl && avatarUrl.length > 380_000) {
      throw new Error("La foto de perfil es demasiado pesada.");
    }
    return { username, displayName, avatarUrl };
  })
  .handler(async ({ context, data }): Promise<Profile> => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId);

    const clash = await sql<{ user_id: string }>`
      select user_id from profiles
      where username = ${data.username} and user_id <> ${context.userId}
      limit 1
    `;
    if (clash[0]) throw new Error("Ese nombre de usuario ya está en uso.");

    if (data.avatarUrl === undefined) {
      await sql`
        update profiles
        set username = ${data.username},
            display_name = ${data.displayName},
            updated_at = now()
        where user_id = ${context.userId}
      `;
    } else {
      await sql`
        update profiles
        set username = ${data.username},
            display_name = ${data.displayName},
            avatar_url = ${data.avatarUrl},
            updated_at = now()
        where user_id = ${context.userId}
      `;
    }

    const rows = await sql<ProfileRow>`
      select p.user_id, p.username, p.display_name, p.avatar_url, p.reputation, p.created_at,
             (select count(*) from reports r where r.user_id = p.user_id) as report_count
      from profiles p
      where p.user_id = ${context.userId}
      limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("No se pudo actualizar el perfil");
    return mapProfile(row);
  });
