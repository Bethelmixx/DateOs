import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const authEnabled = true;

export async function signIn(
  _provider = "google",
  opts: { callbackURL?: string; errorCallbackURL?: string } = {},
): Promise<void> {
  const { data, error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: opts.callbackURL ?? "/",
    errorCallbackURL: opts.errorCallbackURL ?? "/",
  });
  if (error) throw new Error(error.message ?? "No se pudo iniciar sesión");
  if (data?.url) window.location.href = data.url;
}

export async function signOut(redirectTo = "/"): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) throw new Error(error.message ?? "No se pudo cerrar sesión");
  window.location.href = redirectTo;
}
