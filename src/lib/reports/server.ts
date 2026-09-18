import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  isCategoryId,
  isSeverityId,
  isValidProblemType,
  statusFromConfirmations,
  type CategoryId,
} from "@/lib/categories";
import { isValidLatLng } from "@/lib/geo";
import { asBoolean, asNumber, toIso } from "@/lib/format";
import { ensureProfile } from "@/lib/profiles/server";
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

function mapReport(row: ReportRow, viewerId: string, includePhoto: boolean): Report {
  const confirmations = asNumber(row.confirmation_count, 0);
  const category = (isCategoryId(row.category) ? row.category : "otros") as CategoryId;
  const vote = row.my_vote === "confirm" || row.my_vote === "resolved" ? row.my_vote : null;
  return {
    id: row.id,
    category,
    problemType: row.problem_type,
    severity: isSeverityId(row.severity) ? row.severity : "parcial",
    description: row.description,
    lat: asNumber(row.lat),
    lng: asNumber(row.lng),
    hasPhoto: asBoolean(row.has_photo),
    photoData: includePhoto ? (row.photo_data ?? null) : null,
    confirmationCount: confirmations,
    resolvedCount: asNumber(row.resolved_count, 0),
    status: statusFromConfirmations(confirmations),
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

export const listNearbyReports = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
    if (
      ![input.minLat, input.maxLat, input.minLng, input.maxLng].every((n) => Number.isFinite(n))
    ) {
      throw new Error("Área de mapa inválida");
    }
    return input;
  })
  .handler(async ({ context, data }): Promise<Report[]> => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId);
    const rows = await sql<ReportRow>`
      select r.id, r.user_id, r.category, r.problem_type, r.severity, r.description,
             r.lat, r.lng, r.confirmation_count, r.resolved_count, r.created_at,
             (r.photo_data is not null) as has_photo,
             p.username, p.display_name, p.avatar_url, p.reputation,
             v.vote as my_vote
      from reports r
      left join profiles p on p.user_id = r.user_id
      left join report_votes v on v.report_id = r.id and v.user_id = ${context.userId}
      where r.lat between ${data.minLat} and ${data.maxLat}
        and r.lng between ${data.minLng} and ${data.maxLng}
      order by r.created_at desc
      limit 250
    `;
    return rows.map((row) => mapReport(row, context.userId, false));
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
    const rows = await sql<ReportRow>`
      select r.id, r.user_id, r.category, r.problem_type, r.severity, r.description,
             r.lat, r.lng, r.confirmation_count, r.resolved_count, r.created_at,
             (r.photo_data is not null) as has_photo, r.photo_data,
             p.username, p.display_name, p.avatar_url, p.reputation,
             v.vote as my_vote
      from reports r
      left join profiles p on p.user_id = r.user_id
      left join report_votes v on v.report_id = r.id and v.user_id = ${context.userId}
      where r.id = ${id}
      limit 1
    `;
    const row = rows[0];
    return row ? mapReport(row, context.userId, true) : null;
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
      if (!isValidLatLng(input.lat, input.lng)) throw new Error("Ubicación inválida");
      const photoData = input.photoData?.trim() ? input.photoData : null;
      if (photoData && photoData.length > 380_000) {
        throw new Error("La foto es demasiado pesada.");
      }
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
    const sql = await getSql();
    await ensureProfile(sql, context.userId);
    const id = crypto.randomUUID();
    await sql`
      insert into reports (
        id, user_id, category, problem_type, severity, description, lat, lng, photo_data
      ) values (
        ${id}, ${context.userId}, ${data.category}, ${data.problemType}, ${data.severity},
        ${data.description}, ${data.lat}, ${data.lng}, ${data.photoData}
      )
    `;
    const rows = await sql<ReportRow>`
      select r.id, r.user_id, r.category, r.problem_type, r.severity, r.description,
             r.lat, r.lng, r.confirmation_count, r.resolved_count, r.created_at,
             (r.photo_data is not null) as has_photo, r.photo_data,
             p.username, p.display_name, p.avatar_url, p.reputation,
             null as my_vote
      from reports r
      left join profiles p on p.user_id = r.user_id
      where r.id = ${id}
      limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("No se pudo crear el reporte");
    return mapReport(row, context.userId, true);
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
    const sql = await getSql();
    await ensureProfile(sql, context.userId);

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

    const rows = await sql<ReportRow>`
      select r.id, r.user_id, r.category, r.problem_type, r.severity, r.description,
             r.lat, r.lng, r.confirmation_count, r.resolved_count, r.created_at,
             (r.photo_data is not null) as has_photo, r.photo_data,
             p.username, p.display_name, p.avatar_url, p.reputation,
             v.vote as my_vote
      from reports r
      left join profiles p on p.user_id = r.user_id
      left join report_votes v on v.report_id = r.id and v.user_id = ${context.userId}
      where r.id = ${data.reportId}
      limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("No se pudo actualizar el reporte");
    return mapReport(row, context.userId, true);
  });
