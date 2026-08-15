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
