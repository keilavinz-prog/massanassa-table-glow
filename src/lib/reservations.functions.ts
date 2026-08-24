import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  publicReservationSchema,
  updateReservationSchema,
} from "./reservation-rules";
import type { Database } from "@/integrations/supabase/types";

export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

const idSchema = z.object({ id: z.string().uuid() });
const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.enum(["day", "upcoming"]).optional().default("day"),
});

/** Reserva pública: sin sesión, pero con validación completa en servidor. */
export const createPublicReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => publicReservationSchema.parse(data))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    const { data: row, error } = await supabase
      .from("reservations")
      .insert({
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        reservation_date: data.reservation_date,
        reservation_time: data.reservation_time,
        party_size: data.party_size,
        notes: data.notes ? data.notes : null,
        status: "pending",
        google_calendar_event_id: null,
      })
      .select("*")
      .single();

    if (error) throw new Error(`No se pudo registrar la reserva: ${error.message}`);
    return row as Reservation;
  });

async function requireTeam() {
  const { resolveCurrentUser } = await import("./current-user.server");
  const user = await resolveCurrentUser();
  if (!user) throw new Error("No hay sesión activa.");
  if (user.role !== "admin" && user.role !== "empleado") {
    throw new Error("Acceso denegado: se requiere rol de equipo.");
  }
  return user;
}

export const getReservationsByDate = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => dateSchema.parse(data))
  .handler(async ({ data }) => {
    await requireTeam();
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    const [dayRes, pendingRes] = await Promise.all([
      supabase
        .from("reservations")
        .select("*")
        .eq("reservation_date", data.date)
        .order("reservation_time", { ascending: true }),
      supabase.from("reservations").select("id").eq("status", "pending"),
    ]);

    if (dayRes.error) throw dayRes.error;
    if (pendingRes.error) throw pendingRes.error;

    return {
      reservations: (dayRes.data ?? []) as Reservation[],
      pendingTotal: pendingRes.data?.length ?? 0,
    };
  });

export const confirmReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }) => {
    await requireTeam();
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    const { data: reservation, error: readError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", data.id)
      .single();
    if (readError) throw readError;

    const { createCalendarEvent } = await import("./google-calendar.server");
    const eventId = await createCalendarEvent({
      customer_name: reservation.customer_name,
      customer_email: reservation.customer_email,
      customer_phone: reservation.customer_phone,
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      party_size: reservation.party_size,
      notes: reservation.notes,
    });

    const { error } = await supabase
      .from("reservations")
      .update({
        status: "confirmed",
        google_calendar_event_id: eventId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;

    const { data: settings } = await supabase
      .from("restaurant_settings")
      .select("address, city")
      .eq("id", 1)
      .maybeSingle();

    const { sendReservationConfirmationEmail } = await import("./emails.server");
    const email = await sendReservationConfirmationEmail({
      to: reservation.customer_email,
      customer_name: reservation.customer_name,
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      party_size: reservation.party_size,
      address: settings?.address ?? "",
      city: settings?.city ?? "",
    });

    return { ok: true, calendarSynced: eventId !== null, emailSent: email.sent };
  });

async function setStatus(id: string, status: "rejected" | "cancelled") {
  await requireTeam();
  const { getAdminClient } = await import("./admin.server");
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("reservations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export const rejectReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }) => setStatus(data.id, "rejected"));

export const cancelReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }) => setStatus(data.id, "cancelled"));

export const updateReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateReservationSchema.parse(data))
  .handler(async ({ data }) => {
    await requireTeam();
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("reservations")
      .update({
        reservation_date: data.reservation_date,
        reservation_time: data.reservation_time,
        party_size: data.party_size,
        notes: data.notes ? data.notes : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
