import { useSyncExternalStore } from "react";
import { authClient, authEnabled } from "./client";
import { getLocalSessionUser, isBrowserLocal, subscribeLocalAuth } from "@/lib/local-store";

export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  isDevFallback: boolean;
};

export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
};

export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};

function getLocalSnapshot(): AppUser | null {
  const session = getLocalSessionUser();
  if (!session) return null;
  return {
    id: session.id,
    displayName: session.displayName,
    primaryEmail: null,
    profileImageUrl: null,
    isDevFallback: false,
  };
}

export function useCurrentUserState(): CurrentUserState {
  const localUser = useSyncExternalStore(subscribeLocalAuth, getLocalSnapshot, () => null);
  const { data, isPending } = authClient.useSession();
  if (isBrowserLocal()) return { user: localUser, isPending: false };
  if (!authEnabled) return { user: DEV_USER, isPending: false };
  const user = data?.user;
  return {
    user: user
      ? {
          id: user.id,
          displayName: user.name ?? null,
          primaryEmail: user.email?.endsWith("@users.dateos.local") ? null : (user.email ?? null),
          profileImageUrl: user.image ?? null,
          isDevFallback: false,
        }
      : null,
    isPending,
  };
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
