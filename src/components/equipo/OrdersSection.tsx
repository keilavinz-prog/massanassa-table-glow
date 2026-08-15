import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Clock, Phone, StickyNote } from "lucide-react";
import {
  getOrdersByDate,
  markOrderCompleted,
  markOrderReady,
} from "@/lib/orders.functions";
import { todayISO } from "@/lib/catering-schemas";
import { formatLongDate } from "@/lib/reservation-rules";
import { useRealtimeTables } from "@/hooks/useRealtimeTables";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabel: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  preparing: "En preparación",
  ready: "Listo",
  completed: "Entregado",
  cancelled: "Cancelado",
};

const statusBadge: Record<string, string> = {
  pending: "bg-gold text-dark-brown",
  paid: "bg-olive text-white",
  preparing: "bg-gold text-dark-brown",
  ready: "bg-olive text-white border-4 border-olive/40",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
};

const inputClass =
  "transition-warm mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/25";

export function OrdersSection() {
  const [date, setDate] = useState<string>(todayISO());
  const queryClient = useQueryClient();

  const fetchOrders = useServerFn(getOrdersByDate);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["orders", date],
    queryFn: () => fetchOrders({ data: { date } }),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  useRealtimeTables(["orders"], invalidate);

  const readyFn = useServerFn(markOrderReady);
  const completedFn = useServerFn(markOrderCompleted);

  const readyMut = useMutation({
    mutationFn: (id: string) => readyFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Pedido marcado como listo");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const completedMut = useMutation({
    mutationFn: (id: string) => completedFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Pedido entregado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const busy = readyMut.isPending || completedMut.isPending;
  const orders = data?.orders ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-md border border-border/70 bg-card p-4 shadow-warm">
        <div>
          <label className="block text-small font-medium" htmlFor="orders-date">
            Día
          </label>
          <input
            id="orders-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || todayISO())}
            className={inputClass}
          />
        </div>
        <p className="flex items-center gap-2 pb-2 text-small text-muted-foreground">
          <CalendarDays className="size-4 text-gold" />
          {formatLongDate(date)}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-md border border-border/70 bg-card p-5">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="mt-3 h-4 w-56" />
              <Skeleton className="mt-2 h-4 w-40" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p role="alert" className="text-small font-medium text-primary">
          No se pudieron cargar los pedidos: {(error as Error).message}
        </p>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <p className="rounded-md border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
          No hay pedidos para este día.
        </p>
      )}

      <div className="space-y-4">
        {orders.map((o) => {
          const inactive = o.status === "completed" || o.status === "cancelled";
          return (
            <article
              key={o.id}
              className={`rounded-md border border-border/70 bg-card p-5 shadow-warm ${
                inactive ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-h3 text-dark-brown">#{o.reference}</h3>
                  <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
                    <Clock className="size-4" />
                    {o.created_at
                      ? new Date(o.created_at).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                  <p className="mt-1 font-medium">{o.customer_name}</p>
                  <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
                    <Phone className="size-4" /> {o.customer_phone}
                  </p>
                  <ul className="mt-3 space-y-1 text-small text-muted-foreground">
                    {o.items.map((i, idx) => (
                      <li key={`${o.id}-${i.dish_id}-${idx}`}>
                        {i.name} x {i.quantity}
                      </li>
                    ))}
                  </ul>
                  {o.notes && (
                    <p className="mt-2 flex items-start gap-2 text-small text-muted-foreground">
                      <StickyNote className="mt-0.5 size-4 shrink-0 text-gold" />
                      {o.notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display text-h3 font-bold text-primary">
                    {o.total.toFixed(2)} €
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-small font-medium ${
                      statusBadge[o.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {statusLabel[o.status] ?? o.status}
                  </span>
                </div>
              </div>

              {(o.status === "paid" || o.status === "preparing") && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => readyMut.mutate(o.id)}
                  className="transition-warm mt-4 rounded-md bg-olive px-5 py-2 text-small font-medium text-white hover:brightness-110 disabled:opacity-60"
                >
                  Marcar como listo
                </button>
              )}

              {o.status === "ready" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => completedMut.mutate(o.id)}
                  className="transition-warm mt-4 rounded-md border border-primary px-5 py-2 text-small font-medium text-dark-brown hover:bg-primary/10 disabled:opacity-60"
                >
                  Marcar como entregado
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Tarjeta de resumen: pedidos activos hoy (pending+paid+preparing+ready). */
export function ActiveOrdersCard() {
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(getOrdersByDate);
  const today = todayISO();

  const { data } = useQuery({
    queryKey: ["orders", today],
    queryFn: () => fetchOrders({ data: { date: today } }),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);
  useRealtimeTables(["orders"], invalidate);

  return (
    <div className="flex items-center gap-4 rounded-md border border-border/70 bg-card p-4 shadow-warm">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary font-display text-h3 text-primary-foreground">
        {data?.activeToday ?? 0}
      </span>
      <p className="text-small text-muted-foreground">pedidos activos hoy</p>
    </div>
  );
}
