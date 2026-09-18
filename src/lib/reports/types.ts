import type { CategoryId, SeverityId, StatusId } from "@/lib/categories";

export type VoteKind = "confirm" | "resolved";

export type ReportAuthor = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number;
};

export type Report = {
  id: string;
  category: CategoryId;
  problemType: string;
  severity: SeverityId;
  description: string;
  lat: number;
  lng: number;
  hasPhoto: boolean;
  photoData: string | null;
  confirmationCount: number;
  resolvedCount: number;
  status: StatusId;
  createdAt: string;
  author: ReportAuthor;
  isOwner: boolean;
  myVote: VoteKind | null;
};

export type Profile = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number;
  createdAt: string;
  reportCount: number;
};
