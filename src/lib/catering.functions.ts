import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cateringRequestSchema, PROVIDER_STATUSES } from "./catering-schemas";
import type { Database } from "@/integrations/supabase/types";

export type CateringRequest = Database["public"]["Tables"]["catering_requests"]["Row"];
export type ProviderOption = { id: string; full_name: string | null };

const idSchema = z.object({ id: z.string().uuid() });

/** Solicitud pública de catering: sin sesión, validada por completo en servidor. */
export const createCateringRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => cateringRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    const { data: row, error } = await supabase
      .from("catering_requests")
      .insert({
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        event_date: data.event_date ?? null,
        guests: data.guests ?? null,
        event_type: data.event_type ?? null,
        message: data.message ?? null,
        status: "new",
        assigned_to: null,
      })
      .select("id")
      .single();

    if (error) throw new Error(`No se pudo registrar la solicitud: ${error.message}`);
    return { id: row.id };
  });

async function requireAdmin() {
  const { requireAdminUser } = await import("./current-user.server");
  return requireAdminUser();
}

async function requireProvider() {
  const { resolveCurrentUser } = await import("./current-user.server");
  const user = await resolveCurrentUser();
  if (!user) throw new Error("No hay sesión activa.");
  if (user.role !== "proveedor") {
    throw new Error("Acceso denegado: se requiere rol de proveedor.");
  }
  return user;
}

/** Listado completo para administración, con proveedores disponibles. */
export const listCateringRequests = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { getAdminClient } = await import("./admin.server");
  const supabase = getAdminClient();

  const [requestsRes, providersRes] = await Promise.all([
    supabase.from("catering_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").eq("role", "proveedor"),
  ]);
  if (requestsRes.error) throw requestsRes.error;
  if (providersRes.error) throw providersRes.error;

  return {
    requests: (requestsRes.data ?? []) as CateringRequest[],
    providers: (providersRes.data ?? []) as ProviderOption[],
  };
});

export const assignCateringRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({ id: z.string().uuid(), providerId: z.string().uuid().nullable() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    if (data.providerId) {
      const { data: provider, error: providerError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", data.providerId)
        .maybeSingle();
      if (providerError) throw providerError;
      if (!provider || provider.role !== "proveedor") {
        throw new Error("El usuario seleccionado no es un proveedor.");
      }
    }

    const { error } = await supabase
      .from("catering_requests")
      .update({ assigned_to: data.providerId })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Solicitudes visibles para el proveedor: sin asignar y propias. */
export const getProviderCateringRequests = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await requireProvider();
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    const [unassignedRes, mineRes] = await Promise.all([
      supabase
        .from("catering_requests")
        .select("*")
        .is("assigned_to", null)
        .neq("status", "closed")
        .order("created_at", { ascending: false }),
      supabase
        .from("catering_requests")
        .select("*")
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false }),
    ]);
    if (unassignedRes.error) throw unassignedRes.error;
    if (mineRes.error) throw mineRes.error;

    return {
      unassigned: (unassignedRes.data ?? []) as CateringRequest[],
      mine: (mineRes.data ?? []) as CateringRequest[],
    };
  },
);

/** Toma una solicitud solo si sigue libre (UPDATE condicionado, sin carreras). */
export const claimCateringRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireProvider();
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    const { data: rows, error } = await supabase
      .from("catering_requests")
      .update({ assigned_to: user.id, status: "in_review" })
      .eq("id", data.id)
      .is("assigned_to", null)
      .select("id");
    if (error) throw error;
    if (!rows || rows.length === 0) {
      throw new Error("Otro proveedor ya ha tomado esta solicitud.");
    }
    return { ok: true };
  });

export const updateCateringStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(PROVIDER_STATUSES) }).parse(data),
  )
  .handler(async ({ data }) => {
    const user = await requireProvider();
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    const { data: rows, error } = await supabase
      .from("catering_requests")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("assigned_to", user.id)
      .select("id");
    if (error) throw error;
    if (!rows || rows.length === 0) {
      throw new Error("Solo puedes actualizar solicitudes asignadas a ti.");
    }
    return { ok: true };
  });
