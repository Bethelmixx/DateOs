import { isBrowserLocal, localGetProfile, localUpdateProfile } from "@/lib/local-store";
import { getMyProfile, updateMyProfile } from "./server";
import type { Profile } from "@/lib/reports/types";

export async function getMyProfileApi(): Promise<Profile> {
  if (isBrowserLocal()) return localGetProfile();
  return getMyProfile();
}

export async function updateMyProfileApi(input: {
  data: { username: string; displayName: string; avatarUrl?: string | null };
}): Promise<Profile> {
  if (isBrowserLocal()) return localUpdateProfile(input.data);
  return updateMyProfile(input);
}
