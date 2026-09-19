export const CATEGORIES = [
  { id: "electricidad", label: "Electricidad", short: "Luz" },
  { id: "agua", label: "Agua", short: "Agua" },
  { id: "aseo", label: "Aseo", short: "Aseo" },
  { id: "telecom", label: "Telecomunicaciones", short: "Señal" },
  { id: "trafico", label: "Tráfico", short: "Vía" },
  { id: "seguridad", label: "Seguridad", short: "Seguridad" },
  { id: "otros", label: "Otros", short: "Otro" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const PROBLEM_TYPES: Record<CategoryId, { id: string; label: string }[]> = {
  electricidad: [
    { id: "sin_electricidad", label: "Sin electricidad" },
    { id: "intermitente", label: "Electricidad intermitente" },
    { id: "voltaje_bajo", label: "Voltaje bajo" },
    { id: "deficiente", label: "Servicio deficiente" },
  ],
  agua: [
    { id: "sin_agua", label: "Sin agua" },
    { id: "poco_caudal", label: "Poco caudal" },
    { id: "intermitente", label: "Servicio intermitente" },
    { id: "deficiente", label: "Agua deficiente" },
  ],
  aseo: [
    { id: "sin_recoleccion", label: "Sin recolección" },
    { id: "irregular", label: "Recolección irregular" },
    { id: "acumulacion", label: "Acumulación de basura" },
    { id: "deficiente", label: "Servicio deficiente" },
  ],
  telecom: [
    { id: "sin_senal", label: "Sin internet o señal" },
    { id: "intermitente", label: "Servicio intermitente" },
    { id: "senal_debil", label: "Señal débil" },
    { id: "deficiente", label: "Servicio deficiente" },
  ],
  trafico: [
    { id: "calle_cerrada", label: "Calle cerrada" },
    { id: "congestion", label: "Congestión" },
    { id: "accidente", label: "Accidente" },
    { id: "obstaculo", label: "Obstáculo en la vía" },
  ],
  seguridad: [
    { id: "insegura", label: "Situación insegura" },
    { id: "robo", label: "Robo o hurto" },
    { id: "disturbio", label: "Disturbio" },
    { id: "otro", label: "Otro incidente" },
  ],
  otros: [{ id: "otro", label: "Otro problema" }],
};

export const SEVERITIES = [
  { id: "total", label: "Total" },
  { id: "parcial", label: "Parcial" },
  { id: "intermitente", label: "Intermitente" },
  { id: "deficiente", label: "Deficiente / débil" },
] as const;

export type SeverityId = (typeof SEVERITIES)[number]["id"];

export const STATUSES = [
  { id: "unconfirmed", label: "Sin confirmar", colorToken: "status-red" },
  { id: "pending", label: "En confirmación", colorToken: "status-yellow" },
  { id: "confirmed", label: "Confirmado", colorToken: "status-green" },
] as const;

export type StatusId = (typeof STATUSES)[number]["id"];

export function categoryById(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

export function problemLabel(category: string, problemType: string) {
  const cat = category as CategoryId;
  const list = PROBLEM_TYPES[cat];
  return list?.find((p) => p.id === problemType)?.label ?? problemType;
}

export function severityLabel(id: string) {
  return SEVERITIES.find((s) => s.id === id)?.label ?? id;
}

export function statusFromVotes(confirm: number, resolved: number): StatusId {
  if (confirm >= 10) return "confirmed";
  if (resolved >= 10 && resolved >= confirm) return "confirmed";
  if (confirm >= 1 || resolved >= 1) return "pending";
  return "unconfirmed";
}

export function statusFromConfirmations(count: number): StatusId {
  return statusFromVotes(count, 0);
}

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}

export function isSeverityId(value: string): value is SeverityId {
  return SEVERITIES.some((s) => s.id === value);
}

export function isValidProblemType(category: CategoryId, problemType: string) {
  return PROBLEM_TYPES[category].some((p) => p.id === problemType);
}
