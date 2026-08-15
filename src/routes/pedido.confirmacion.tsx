import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getOrderBySessionId } from "@/lib/orders.functions";
import { clearCart } from "@/lib/cart";

type OrderSummary = Awaited<ReturnType<typeof getOrderBySessionId>>;

export const Route = createFileRoute("/pedido/confirmacion")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Pedido confirmado — El Fogó de Massanassa" },
      {
        name: "description",
        content:
          "Confirmación de tu pedido en El Fogó de Massanassa: resumen de platos, total y datos de recogida.",
      },
      { property: "og:title", content: "Pedido confirmado — El Fogó de Massanassa" },
      {
        property: "og:description",
        content: "Tu pedido está confirmado y listo para recoger en el restaurante.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfirmacionPage,
});

function ConfirmacionPage() {
  const { session_id: sessionId } = Route.useSearch();
  const [order, setOrder] = useState<OrderSummary>(null);
  const [attempts, setAttempts] = useState(0);
  const [waiting, setWaiting] = useState(true);
  const cleared = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setWaiting(false);
      return;
    }
    let cancelled = false;

    async function poll(attempt: number) {
      try {
        const result = await getOrderBySessionId({ data: { session_id: sessionId } });
        if (cancelled) return;
        if (result) {
          setOrder(result);
          if (!cleared.current) {
            clearCart();
            cleared.current = true;
          }
        }
        if (result?.status === "paid" || attempt >= 3) {
          setWaiting(false);
          return;
        }
      } catch {
        if (attempt >= 3) {
          setWaiting(false);
          return;
        }
      }
      setAttempts(attempt);
      window.setTimeout(() => {
        if (!cancelled) void poll(attempt + 1);
      }, 2000);
    }

    void poll(1);
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const paid = order?.status === "paid";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-lg rounded-lg bg-card p-8 shadow-warm">
        {paid ? (
          <CheckCircle2 className="size-12 text-olive" />
        ) : (
          <Loader2 className="size-8 animate-spin text-gold" />
        )}

        <h1 className="mt-4 font-display text-h1 leading-tight">
          {paid ? "¡Pedido confirmado!" : waiting ? "Confirmando tu pago…" : "Pedido registrado"}
        </h1>

        {!paid && (
          <p className="mt-2 text-small text-muted-foreground">
            {waiting
              ? `Estamos comprobando el pago con la pasarela (intento ${attempts}/3).`
              : "Aún no hemos recibido la confirmación del pago. Si ya has pagado, te avisaremos por email en unos minutos."}
          </p>
        )}

        {order ? (
          <>
            <p className="mt-4 text-small text-muted-foreground">
              Nº de pedido <span className="font-medium text-foreground">{order.reference}</span>
            </p>
            <ul className="mt-6 space-y-2">
              {order.items.map((item) => (
                <li key={item.dish_id} className="flex justify-between text-small">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{(item.price * item.quantity).toFixed(2)} €</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-display text-h3 font-bold text-primary">
                {order.total.toFixed(2)} €
              </span>
            </div>
          </>
        ) : (
          !waiting && (
            <p className="mt-4 text-small text-muted-foreground">
              No encontramos un pedido asociado a este pago.
            </p>
          )
        )}

        {paid && (
          <p className="mt-6 text-small">
            Te avisaremos por email cuando esté listo para recoger.
          </p>
        )}

        <Link
          to="/carta"
          className="transition-warm mt-8 inline-flex rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
        >
          Volver a la carta
        </Link>
      </div>
    </div>
  );
}
