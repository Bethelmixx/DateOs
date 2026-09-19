import { useEffect, useState } from "react";
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

let cachedLocal: AppUser | null = null;
let cachedLocalKey = "__none__";

function readLocalUser(): AppUser | null {
  const session = getLocalSessionUser();
  const key = session ? `${session.id}:${session.displayName ?? ""}` : "";
  if (key === cachedLocalKey) return cachedLocal;
  cachedLocalKey = key;
  cachedLocal = session
    ? {
        id: session.id,
        displayName: session.displayName,
        primaryEmail: null,
        profileImageUrl: null,
        isDevFallback: false,
      }
    : null;
  return cachedLocal;
}

export function useCurrentUserState(): CurrentUserState {
  const [localUser, setLocalUser] = useState<AppUser | null>(() =>
    typeof window === "undefined" ? null : readLocalUser(),
  );
  useEffect(() => {
    if (!isBrowserLocal()) return;
    setLocalUser(readLocalUser());
    return subscribeLocalAuth(() => setLocalUser(readLocalUser()));
  }, []);

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
