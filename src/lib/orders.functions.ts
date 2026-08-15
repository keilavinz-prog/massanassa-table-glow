import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { checkoutSchema } from "./order-schemas";
import type { Database } from "@/integrations/supabase/types";

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = { dish_id: string; name: string; price: number; quantity: number };

function originFromRequest() {
  const request = getRequest();
  const origin = request?.headers?.get("origin");
  if (origin) return origin;
  const url = request?.url ? new URL(request.url) : null;
  return url ? url.origin : "";
}

/**
 * Crea el pedido y la sesión de pago. El precio SIEMPRE se revalida contra
 * `dishes`; nunca se confía en lo que envía el cliente.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("./admin.server");
    const {
      createCheckoutSession: createStripeSession,
      PaymentsUnavailableError,
      stripeConfigured,
    } = await import("./stripe.server");

    if (!stripeConfigured()) throw new PaymentsUnavailableError();

    const supabase = getAdminClient();
    const ids = data.items.map((i) => i.dish_id);

    const { data: dishes, error: dishesError } = await supabase
      .from("dishes")
      .select("id, name, price, is_available")
      .in("id", ids);
    if (dishesError) throw new Error(`No se pudo validar la carta: ${dishesError.message}`);

    const items: OrderItem[] = [];
    for (const requested of data.items) {
      const dish = (dishes ?? []).find((d) => d.id === requested.dish_id);
      if (!dish || !dish.is_available) {
        throw new Error("Alguno de los platos ya no está disponible. Revisa tu carrito.");
      }
      items.push({
        dish_id: dish.id,
        name: dish.name,
        price: Number(dish.price),
        quantity: requested.quantity,
      });
    }
    if (items.length === 0) throw new Error("Tu carrito está vacío.");

    const total = Number(
      items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2),
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        order_type: "recogida",
        items,
        total,
        status: "pending",
        notes: data.notes ? data.notes : null,
      })
      .select("id")
      .single();
    if (orderError) throw new Error(`No se pudo registrar el pedido: ${orderError.message}`);

    const origin = originFromRequest();
    const session = await createStripeSession({
      lineItems: items.map((i) => ({
        name: i.name,
        unitAmount: Math.round(i.price * 100),
        quantity: i.quantity,
      })),
      customerEmail: data.customer_email,
      successUrl: `${origin}/pedido/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pedido`,
      metadata: { order_id: order.id },
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    if (updateError) console.error("[orders] No se pudo guardar el id de sesión:", updateError);

    return { checkoutUrl: session.url, orderId: order.id };
  });

/** Consulta pública por session_id de Stripe (no expone datos sensibles). */
export const getOrderBySessionId = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const value = (data as { session_id?: unknown })?.session_id;
    if (typeof value !== "string" || value.length < 10 || value.length > 200) {
      throw new Error("Identificador de pago no válido.");
    }
    return { session_id: value };
  })
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, items, total, status, customer_name, created_at")
      .eq("stripe_payment_intent_id", data.session_id)
      .maybeSingle();
    if (error) throw new Error(`No se pudo recuperar el pedido: ${error.message}`);
    if (!order) return null;

    return {
      id: order.id,
      reference: order.id.slice(0, 8),
      items: (order.items as unknown as OrderItem[]) ?? [],
      total: Number(order.total),
      status: order.status,
      customer_name: order.customer_name,
    };
  });

/* ---------- Gestión operativa de pedidos (equipo) ---------- */

async function requireTeamUser() {
  const { resolveCurrentUser } = await import("./current-user.server");
  const user = await resolveCurrentUser();
  if (!user) throw new Error("No hay sesión activa.");
  if (user.role !== "admin" && user.role !== "empleado") {
    throw new Error("Acceso denegado: se requiere rol de equipo.");
  }
  return user;
}

export type TeamOrder = {
  id: string;
  reference: string;
  created_at: string | null;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total: number;
  status: string;
  notes: string | null;
};

const ACTIVE_STATUSES = ["pending", "paid", "preparing", "ready"];

export const getOrdersByDate = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const value = (data as { date?: unknown })?.date;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error("Fecha no válida.");
    }
    return { date: value };
  })
  .handler(async ({ data }) => {
    await requireTeamUser();
    const { getAdminClient } = await import("./admin.server");
    const supabase = getAdminClient();

    const from = `${data.date}T00:00:00.000Z`;
    const to = `${data.date}T23:59:59.999Z`;
    const today = new Date().toISOString().slice(0, 10);

    const [dayRes, activeRes] = await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id")
        .gte("created_at", `${today}T00:00:00.000Z`)
        .lte("created_at", `${today}T23:59:59.999Z`)
        .in("status", ACTIVE_STATUSES),
    ]);
    if (dayRes.error) throw dayRes.error;
    if (activeRes.error) throw activeRes.error;

    const orders: TeamOrder[] = (dayRes.data ?? []).map((o) => ({
      id: o.id,
      reference: o.id.slice(0, 8),
      created_at: o.created_at,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      items: (o.items as unknown as OrderItem[]) ?? [],
      total: Number(o.total),
      status: o.status,
      notes: o.notes,
    }));

    return { orders, activeToday: activeRes.data?.length ?? 0 };
  });

async function advanceOrder(id: string, from: string[], to: string) {
  await requireTeamUser();
  const { getAdminClient } = await import("./admin.server");
  const supabase = getAdminClient();

  const { data: rows, error } = await supabase
    .from("orders")
    .update({ status: to, updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", from)
    .select("id");
  if (error) throw error;
  if (!rows || rows.length === 0) {
    throw new Error("El pedido ya no está en un estado que permita este cambio.");
  }
  return { ok: true };
}

export const markOrderReady = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const id = (data as { id?: unknown })?.id;
    if (typeof id !== "string") throw new Error("Pedido no válido.");
    return { id };
  })
  .handler(async ({ data }) => advanceOrder(data.id, ["paid", "preparing"], "ready"));

export const markOrderCompleted = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const id = (data as { id?: unknown })?.id;
    if (typeof id !== "string") throw new Error("Pedido no válido.");
    return { id };
  })
  .handler(async ({ data }) => advanceOrder(data.id, ["ready"], "completed"));
