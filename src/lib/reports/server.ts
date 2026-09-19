import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, withTransaction, type Sql } from "@/lib/db";
import {
  isCategoryId,
  isSeverityId,
  isValidProblemType,
  statusFromVotes,
  type CategoryId,
  type StatusId,
} from "@/lib/categories";
import { clampBounds, isValidLatLng } from "@/lib/geo";
import { asBoolean, asNumber, toIso } from "@/lib/format";
import { assertImageDataUrl } from "@/lib/image-data-url";
import { ensureProfile, refreshReputation } from "@/lib/profiles/server";
import type { Report, VoteKind } from "./types";

type ReportRow = {
  id: string;
  user_id: string;
  category: string;
  problem_type: string;
  severity: string;
  description: string;
  lat: unknown;
  lng: unknown;
  confirmation_count: unknown;
  resolved_count: unknown;
  created_at: unknown;
  has_photo: unknown;
  photo_data?: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  reputation: unknown;
  my_vote: string | null;
};

function mapReport(row: ReportRow, viewerId: string, includePhoto: boolean): Report | null {
  const lat = asNumber(row.lat, Number.NaN);
  const lng = asNumber(row.lng, Number.NaN);
  if (!isValidLatLng(lat, lng)) return null;
  const confirmations = asNumber(row.confirmation_count, 0);
  const resolved = asNumber(row.resolved_count, 0);
  const category = (isCategoryId(row.category) ? row.category : "otros") as CategoryId;
  const vote = row.my_vote === "confirm" || row.my_vote === "resolved" ? row.my_vote : null;
  return {
    id: row.id,
    category,
    problemType: row.problem_type,
    severity: isSeverityId(row.severity) ? row.severity : "parcial",
    description: row.description,
    lat,
    lng,
    hasPhoto: asBoolean(row.has_photo),
    photoData: includePhoto ? (row.photo_data ?? null) : null,
    confirmationCount: confirmations,
    resolvedCount: resolved,
    status: statusFromVotes(confirmations, resolved),
    createdAt: toIso(row.created_at),
    author: {
      userId: row.user_id,
      username: row.username ?? "vecino",
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      reputation: asNumber(row.reputation, 3),
    },
    isOwner: row.user_id === viewerId,
    myVote: vote,
  };
}

async function fetchReport(sql: Sql, id: string, viewerId: string): Promise<Report | null> {
  const rows = await sql<ReportRow>`
    select r.id, r.user_id, r.category, r.problem_type, r.severity, r.description,
           r.lat, r.lng, r.confirmation_count, r.resolved_count, r.created_at,
           (r.photo_data is not null) as has_photo, r.photo_data,
           p.username, p.display_name, p.avatar_url, p.reputation,
           v.vote as my_vote
    from reports r
    left join profiles p on p.user_id = r.user_id
    left join report_votes v on v.report_id = r.id and v.user_id = ${viewerId}
    where r.id = ${id}
    limit 1
  `;
  return rows[0] ? mapReport(rows[0], viewerId, true) : null;
}

export const listNearbyReports = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
      categories?: CategoryId[];
      statuses?: StatusId[];
    }) => {
      if (
        ![input.minLat, input.maxLat, input.minLng, input.maxLng].every((n) => Number.isFinite(n))
      ) {
        throw new Error("Área de mapa inválida");
      }
      return {
        ...clampBounds({
          minLat: input.minLat,
          maxLat: input.maxLat,
          minLng: input.minLng,
          maxLng: input.maxLng,
        }),
        categories: (input.categories ?? []).filter(isCategoryId),
        statuses: (input.statuses ?? []).filter(
          (s): s is StatusId => s === "unconfirmed" || s === "pending" || s === "confirmed",
        ),
      };
    },
  )
  .handler(async ({ context, data }): Promise<Report[]> => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId);
    const cats = data.categories;
    const statuses = data.statuses;
    const rows = await sql.query<ReportRow>(
      `select r.id, r.user_id, r.category, r.problem_type, r.severity, r.description,
              r.lat, r.lng, r.confirmation_count, r.resolved_count, r.created_at,
              (r.photo_data is not null) as has_photo,
              p.username, p.display_name, null::text as avatar_url, p.reputation,
              v.vote as my_vote
       from reports r
       left join profiles p on p.user_id = r.user_id
       left join report_votes v on v.report_id = r.id and v.user_id = $1
       where r.lat between $2 and $3
         and r.lng between $4 and $5
         and ($6::int = 0 or r.category = any($7::text[]))
         and (
           $8::int = 0 or (
             case
               when r.confirmation_count >= 10 then 'confirmed'
               when r.resolved_count >= 10 and r.resolved_count >= r.confirmation_count then 'confirmed'
               when r.confirmation_count >= 1 or r.resolved_count >= 1 then 'pending'
               else 'unconfirmed'
             end
           ) = any($9::text[])
         )
       order by r.created_at desc
       limit 400`,
      [
        context.userId,
        data.minLat,
        data.maxLat,
        data.minLng,
        data.maxLng,
        cats.length,
        cats,
        statuses.length,
        statuses,
      ],
    );
    return rows.map((row) => mapReport(row, context.userId, false)).filter((r): r is Report => r !== null);
  });

export const getReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => {
    if (!id || id.length > 80) throw new Error("Reporte inválido");
    return id;
  })
  .handler(async ({ context, data: id }): Promise<Report | null> => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId);
    return fetchReport(sql, id, context.userId);
  });

export const createReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      category: string;
      problemType: string;
      severity: string;
      description: string;
      lat: number;
      lng: number;
      photoData?: string | null;
    }) => {
      if (!isCategoryId(input.category)) throw new Error("Categoría inválida");
      if (!isValidProblemType(input.category, input.problemType)) {
        throw new Error("Tipo de problema inválido");
      }
      if (!isSeverityId(input.severity)) throw new Error("Nivel inválido");
      const description = input.description.trim();
      if (description.length < 4) throw new Error("Describe el problema (mínimo 4 caracteres).");
      if (description.length > 280) throw new Error("La descripción es demasiado larga.");
      if (!isValidLatLng(input.lat, input.lng)) throw new Error("Ubica el pin en el mapa.");
      const photoData = input.photoData?.trim() ? input.photoData : null;
      if (photoData) assertImageDataUrl(photoData, "La foto");
      return {
        category: input.category,
        problemType: input.problemType,
        severity: input.severity,
        description,
        lat: input.lat,
        lng: input.lng,
        photoData,
      };
    },
  )
  .handler(async ({ context, data }): Promise<Report> => {
    const id = crypto.randomUUID();
    return withTransaction(async (sql) => {
      await ensureProfile(sql, context.userId);
      const recent = await sql<{ n: number }>`
        select count(*)::int as n from reports
        where user_id = ${context.userId}
          and created_at > now() - interval '10 minutes'
      `;
      if (asNumber(recent[0]?.n, 0) >= 5) {
        throw new Error("Demasiados reportes seguidos. Espera unos minutos.");
      }
      await sql`
        insert into reports (
          id, user_id, category, problem_type, severity, description, lat, lng, photo_data
        ) values (
          ${id}, ${context.userId}, ${data.category}, ${data.problemType}, ${data.severity},
          ${data.description}, ${data.lat}, ${data.lng}, ${data.photoData}
        )
      `;
      const created = await fetchReport(sql, id, context.userId);
      if (!created) throw new Error("No se pudo crear el reporte");
      return created;
    });
  });

export const voteOnReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { reportId: string; vote: VoteKind }) => {
    if (!input.reportId || input.reportId.length > 80) throw new Error("Reporte inválido");
    if (input.vote !== "confirm" && input.vote !== "resolved") {
      throw new Error("Voto inválido");
    }
    return input;
  })
  .handler(async ({ context, data }): Promise<Report> => {
    return withTransaction(async (sql) => {
      await ensureProfile(sql, context.userId);
      const recent = await sql<{ n: number }>`
        select count(*)::int as n from report_votes
        where user_id = ${context.userId}
          and created_at > now() - interval '5 minutes'
      `;
      if (asNumber(recent[0]?.n, 0) >= 20) {
        throw new Error("Demasiados votos seguidos. Espera un momento.");
      }
      const owner = await sql<{ user_id: string }>`
        select user_id from reports where id = ${data.reportId} limit 1
      `;
      if (!owner[0]) throw new Error("Ese reporte ya no existe.");
      if (owner[0].user_id === context.userId) {
        throw new Error("No puedes verificar tu propio reporte.");
      }
      await sql`
        insert into report_votes (report_id, user_id, vote)
        values (${data.reportId}, ${context.userId}, ${data.vote})
        on conflict (report_id, user_id)
        do update set vote = excluded.vote, created_at = now()
      `;
      await sql`
        update reports
        set confirmation_count = (
              select count(*) from report_votes
              where report_id = ${data.reportId} and vote = 'confirm'
            ),
            resolved_count = (
              select count(*) from report_votes
              where report_id = ${data.reportId} and vote = 'resolved'
            )
        where id = ${data.reportId}
      `;
      await refreshReputation(sql, owner[0].user_id);
      const updated = await fetchReport(sql, data.reportId, context.userId);
      if (!updated) throw new Error("No se pudo actualizar el reporte");
      return updated;
    });
  });

export const deleteOwnReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => {
    if (!id || id.length > 80) throw new Error("Reporte inválido");
    return id;
  })
  .handler(async ({ context, data: id }): Promise<{ ok: true }> => {
    const sql = await getSql();
    const rows = await sql<{ id: string }>`
      delete from reports
      where id = ${id} and user_id = ${context.userId}
      returning id
    `;
    if (!rows[0]) throw new Error("No puedes borrar ese reporte.");
    return { ok: true };
  });
