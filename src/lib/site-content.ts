/** Textos por defecto de navegación e historia (fallbacks si el admin no los rellena). */

export const NAV_KEYS = ["inicio", "carta", "restaurantes", "reservar", "catering"] as const;
export type NavKey = (typeof NAV_KEYS)[number];

export const DEFAULT_NAV_LABELS: Record<NavKey, string> = {
  inicio: "Inicio",
  carta: "Carta",
  restaurantes: "Restaurantes",
  reservar: "Reservar",
  catering: "Catering",
};

export const NAV_KEY_ROUTES: Record<NavKey, string> = {
  inicio: "/",
  carta: "/carta",
  restaurantes: "/restaurantes",
  reservar: "/reservar",
  catering: "/catering",
};

export const DEFAULT_HISTORIA_TEXTO = `Chicken Garden nació cerca de la estación de Cercanías de Massanassa, con una idea sencilla: combinar la tradición del pollo asado y la parrilla con influencias europeas y asiáticas en la preparación de carnes. Esa mezcla marcó desde el principio la identidad del local.

Hoy, Chicken Garden es punto de referencia en Massanassa para quienes buscan pollo rotisserie, churrasco y parrilladas mixtas con raciones generosas, acompañadas de postres caseros. Su terraza cubierta, sus salas climatizadas y su amplio parking lo convierten en una opción habitual para familias y grupos, con servicio para llevar y organización de eventos privados.`;

/** Normaliza el jsonb de nav_labels con fallback a los textos por defecto. */
export function resolveNavLabels(raw: unknown): Record<NavKey, string> {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_NAV_LABELS };
  for (const key of NAV_KEYS) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim();
  }
  return out;
}

/** Devuelve los párrafos de la historia, con fallback al texto por defecto. */
export function resolveHistoriaParagraphs(raw: string | null | undefined): string[] {
  const text = raw && raw.trim() ? raw : DEFAULT_HISTORIA_TEXTO;
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
