import { z } from "zod";

export const CATERING_MESSAGE_MAX = 500;

export const EVENT_TYPES = [
  "Boda",
  "Comunión",
  "Cumpleaños",
  "Evento de empresa",
  "Otro",
] as const;

export const CATERING_STATUSES = [
  "new",
  "in_review",
  "quoted",
  "confirmed",
  "closed",
] as const;

export type CateringStatus = (typeof CATERING_STATUSES)[number];

export const cateringStatusLabel: Record<CateringStatus, string> = {
  new: "Nueva",
  in_review: "En revisión",
  quoted: "Presupuestada",
  confirmed: "Confirmada",
  closed: "Cerrada",
};

export const cateringStatusBadge: Record<CateringStatus, string> = {
  new: "bg-gold text-dark-brown",
  in_review: "border border-primary text-primary bg-transparent",
  quoted: "border border-olive text-olive bg-transparent",
  confirmed: "bg-olive text-white",
  closed: "bg-muted text-muted-foreground",
};

/** Estados que un proveedor puede fijar sobre sus solicitudes. */
export const PROVIDER_STATUSES = ["in_review", "quoted", "confirmed", "closed"] as const;

export function todayISO(): string {
  const now = new Date();
  const tz = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const cateringRequestSchema = z.object({
  contact_name: z.string().trim().min(3, "Indica nombre y apellidos").max(120),
  contact_email: z.string().trim().email("Email no válido").max(255),
  contact_phone: z
    .string()
    .trim()
    .min(9, "El teléfono debe tener entre 9 y 12 caracteres")
    .max(12, "El teléfono debe tener entre 9 y 12 caracteres"),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  guests: z
    .number({ invalid_type_error: "Indica un número de invitados" })
    .int()
    .min(1, "Mínimo 1 invitado")
    .max(1000)
    .optional(),
  event_type: z.enum(EVENT_TYPES).optional(),
  message: optionalText(CATERING_MESSAGE_MAX),
});

export type CateringRequestInput = z.infer<typeof cateringRequestSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function formatEventDate(value: string | null): string {
  if (!value) return "Fecha por definir";
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
