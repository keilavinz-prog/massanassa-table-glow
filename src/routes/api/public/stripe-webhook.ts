import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook de Stripe: escucha `checkout.session.completed`, verifica la firma
 * con STRIPE_WEBHOOK_SECRET, marca el pedido como pagado y dispara el email
 * de confirmación. Si el secret no está configurado, responde 401.
 */
export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.text();
        const { verifyStripeSignature } = await import("@/lib/stripe.server");

        const valid = await verifyStripeSignature(
          payload,
          request.headers.get("stripe-signature"),
        );
        if (!valid) {
          console.error("[stripe-webhook] Firma no válida o secret ausente.");
          return new Response("Invalid signature", { status: 401 });
        }

        let event: { type?: string; data?: { object?: { id?: string } } };
        try {
          event = JSON.parse(payload) as typeof event;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        if (event.type !== "checkout.session.completed") {
          return new Response("ignored", { status: 200 });
        }

        const sessionId = event.data?.object?.id;
        if (!sessionId) return new Response("Missing session id", { status: 400 });

        const { getAdminClient } = await import("@/lib/admin.server");
        const supabase = getAdminClient();

        const { data: order, error } = await supabase
          .from("orders")
          .select("*")
          .eq("stripe_payment_intent_id", sessionId)
          .maybeSingle();

        if (error) {
          console.error("[stripe-webhook] Error leyendo el pedido:", error);
          return new Response("Database error", { status: 500 });
        }
        if (!order) {
          console.error(`[stripe-webhook] Pedido no encontrado para sesión ${sessionId}`);
          return new Response("Order not found", { status: 404 });
        }

        if (order.status !== "paid") {
          const { error: updateError } = await supabase
            .from("orders")
            .update({ status: "paid", updated_at: new Date().toISOString() })
            .eq("id", order.id);
          if (updateError) {
            console.error("[stripe-webhook] Error actualizando el pedido:", updateError);
            return new Response("Database error", { status: 500 });
          }

          const { data: settings } = await supabase
            .from("restaurant_settings")
            .select("address, city")
            .eq("id", 1)
            .maybeSingle();

          const { sendOrderConfirmationEmail } = await import("@/lib/emails.server");
          await sendOrderConfirmationEmail({
            to: order.customer_email,
            customer_name: order.customer_name,
            items: (order.items as unknown as Array<{
              name: string;
              quantity: number;
              price: number;
            }>) ?? [],
            total: Number(order.total),
            address: settings?.address ?? "",
            city: settings?.city ?? "",
          });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
