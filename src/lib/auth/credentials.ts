const EMAIL_DOMAIN = "users.dateos.local";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(raw: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(normalizeUsername(raw));
}

export function usernameToEmail(raw: string): string {
  return `${normalizeUsername(raw)}@${EMAIL_DOMAIN}`;
}

export function isValidPassword(raw: string): boolean {
  return raw.length >= 8 && raw.length <= 72;
}
