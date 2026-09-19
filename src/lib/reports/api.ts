import {
  isBrowserLocal,
  localCreateReport,
  localDeleteReport,
  localGetReport,
  localListReports,
  localVote,
} from "@/lib/local-store";
import type { CategoryId, StatusId } from "@/lib/categories";
import {
  createReport,
  deleteOwnReport,
  getReport,
  listNearbyReports,
  voteOnReport,
} from "./server";
import type { Report, VoteKind } from "./types";

export async function listNearbyReportsApi(input: {
  data: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
    categories?: CategoryId[];
    statuses?: StatusId[];
  };
}): Promise<Report[]> {
  if (isBrowserLocal()) return localListReports(input.data);
  return listNearbyReports(input);
}

export async function getReportApi(input: { data: string }): Promise<Report | null> {
  if (isBrowserLocal()) return localGetReport(input.data);
  return getReport(input);
}

export async function createReportApi(input: {
  data: {
    category: string;
    problemType: string;
    severity: string;
    description: string;
    lat: number;
    lng: number;
    photoData?: string | null;
  };
}): Promise<Report> {
  if (isBrowserLocal()) {
    return localCreateReport({
      category: input.data.category as CategoryId,
      problemType: input.data.problemType,
      severity: input.data.severity,
      description: input.data.description,
      lat: input.data.lat,
      lng: input.data.lng,
      photoData: input.data.photoData,
    });
  }
  return createReport(input);
}

export async function voteOnReportApi(input: {
  data: { reportId: string; vote: VoteKind };
}): Promise<Report> {
  if (isBrowserLocal()) return localVote(input.data.reportId, input.data.vote);
  return voteOnReport(input);
}

export async function deleteOwnReportApi(input: { data: string }) {
  if (isBrowserLocal()) {
    localDeleteReport(input.data);
    return { ok: true as const };
  }
  return deleteOwnReport(input);
}
