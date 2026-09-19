import { createAuthClient } from "better-auth/react";
import {
  isValidPassword,
  isValidUsername,
  normalizeUsername,
  usernameToEmail,
} from "./credentials";

export const authClient = createAuthClient();

export const authEnabled = true;

function authErrorMessage(error: { message?: string; status?: number; code?: string } | null) {
  const text = (error?.message ?? "").toLowerCase();
  const code = (error?.code ?? "").toLowerCase();
  if (code.includes("already") || text.includes("already") || text.includes("exists")) {
    return "Ese usuario ya existe";
  }
  if (
    code.includes("invalid") ||
    text.includes("invalid") ||
    text.includes("incorrect") ||
    text.includes("credential")
  ) {
    return "Usuario o contraseña incorrectos";
  }
  return error?.message ?? "No se pudo completar";
}

export async function signUpWithPassword(username: string, password: string): Promise<void> {
  const name = normalizeUsername(username);
  if (!isValidUsername(name)) {
    throw new Error("Usa 3 a 20 letras, números o _");
  }
  if (!isValidPassword(password)) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }
  const { error } = await authClient.signUp.email({
    email: usernameToEmail(name),
    password,
    name,
  });
  if (error) throw new Error(authErrorMessage(error));
  window.location.href = "/";
}

export async function signInWithPassword(username: string, password: string): Promise<void> {
  const name = normalizeUsername(username);
  if (!isValidUsername(name)) {
    throw new Error("Usa 3 a 20 letras, números o _");
  }
  if (!password) {
    throw new Error("Escribe usuario y contraseña");
  }
  const { error } = await authClient.signIn.email({
    email: usernameToEmail(name),
    password,
  });
  if (error) throw new Error(authErrorMessage(error));
  window.location.href = "/";
}

export async function signOut(redirectTo = "/"): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) throw new Error(error.message ?? "No se pudo cerrar sesión");
  window.location.href = redirectTo;
}
