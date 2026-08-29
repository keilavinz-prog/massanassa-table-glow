import type { PublicCategory, RestaurantSettings } from "./restaurant.functions";

export type CachedMenu = {
  settings: RestaurantSettings | null;
  categories: PublicCategory[];
};

type Envelope = { savedAt: number; data: CachedMenu };

const KEY = "chicken-garden-carta-cache-v1";
/** La carta cacheada se considera utilizable 7 días (solo lectura, sin pedir). */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Guarda la última carta cargada para que /carta siga visible sin conexión. */
export function saveMenuCache(data: CachedMenu) {
  if (typeof window === "undefined") return;
  try {
    const envelope: Envelope = { savedAt: Date.now(), data };
    window.localStorage.setItem(KEY, JSON.stringify(envelope));
  } catch {
    /* cuota llena o almacenamiento bloqueado: la caché es opcional */
  }
}

/** Lee la carta cacheada, o `null` si no existe o está caducada. */
export function readMenuCache(): { data: CachedMenu; savedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      !parsed.data ||
      !Array.isArray(parsed.data.categories)
    ) {
      return null;
    }
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    return { data: parsed.data, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}
