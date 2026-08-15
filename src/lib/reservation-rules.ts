import { z } from "zod";

/** Franjas de servicio derivadas del horario real (última entrada incluida). */
export const LUNCH_SLOTS = buildSlots("12:00", "16:00");
export const DINNER_SLOTS = buildSlots("20:00", "23:00");
export const ALL_SLOTS = [...LUNCH_SLOTS, ...DINNER_SLOTS];

function buildSlots(from: string, to: string): string[] {
  const slots: string[] = [];
  let minutes = toMinutes(from);
  const end = toMinutes(to);
  while (minutes <= end) {
    slots.push(fromMinutes(minutes));
    minutes += 30;
  }
  return slots;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const MAX_PARTY_SIZE = 12;
export const BIG_GROUP_PHONE = "961 25 43 21";
export const BIG_GROUP_MESSAGE = `Para grupos grandes o eventos, llámanos al ${BIG_GROUP_PHONE}`;
export const CLOSED_DAY_MESSAGE = "Cerramos los lunes";
export const NOTES_MAX = 300;

/** YYYY-MM-DD del día de hoy en horario local. */
export function todayISO(): string {
  const now = new Date();
  return toISODate(now);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Interpreta una fecha ISO como fecha local sin desplazamiento de zona. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function isMondayISO(iso: string): boolean {
  return parseISODate(iso).getDay() === 1;
}

export function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

export function formatLongDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const phoneRegex = /^[0-9\s]{9,12}$/;

/** Reglas de negocio compartidas entre cliente y servidor. */
export const reservationCoreSchema = z.object({
  reservation_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Selecciona una fecha válida" })
    .refine((iso) => iso >= todayISO(), { message: "La fecha no puede ser pasada" })
    .refine((iso) => !isMondayISO(iso), { message: CLOSED_DAY_MESSAGE }),
  reservation_time: z
    .string()
    .transform(normalizeTime)
    .refine((t) => ALL_SLOTS.includes(t), {
      message: "Elige una hora dentro del horario de servicio",
    }),
  party_size: z
    .number({ invalid_type_error: "Indica el número de comensales" })
    .int()
    .min(1, { message: "Mínimo 1 comensal" })
    .max(MAX_PARTY_SIZE, { message: BIG_GROUP_MESSAGE }),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX, { message: `Máximo ${NOTES_MAX} caracteres` })
    .optional()
    .or(z.literal("")),
});

export const publicReservationSchema = reservationCoreSchema.extend({
  customer_name: z
    .string()
    .trim()
    .min(3, { message: "Indica nombre y apellidos (mín. 3 caracteres)" })
    .max(120),
  customer_email: z
    .string()
    .trim()
    .email({ message: "Email no válido" })
    .max(255),
  customer_phone: z
    .string()
    .trim()
    .regex(phoneRegex, { message: "Teléfono no válido (9-12 dígitos)" }),
});

export const updateReservationSchema = reservationCoreSchema.extend({
  id: z.string().uuid(),
});

export type PublicReservationInput = z.infer<typeof publicReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

export type ReservationStatus = "pending" | "confirmed" | "rejected" | "cancelled";

/** Devuelve errores por campo para pintar validación en el formulario. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
