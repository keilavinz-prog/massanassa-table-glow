import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Mail, Phone, Users } from "lucide-react";
import {
  claimCateringRequest,
  getProviderCateringRequests,
  updateCateringStatus,
  type CateringRequest,
} from "@/lib/catering.functions";
import {
  PROVIDER_STATUSES,
  cateringStatusBadge,
  cateringStatusLabel,
  formatEventDate,
  type CateringStatus,
} from "@/lib/catering-schemas";
import { useRealtimeTables } from "@/hooks/useRealtimeTables";
import { Skeleton } from "@/components/ui/skeleton";

export function CateringProviderPanel() {
  const queryClient = useQueryClient();
  const fetchRequests = useServerFn(getProviderCateringRequests);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["catering", "provider"],
    queryFn: () => fetchRequests(),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["catering"] });
  }, [queryClient]);
  useRealtimeTables(["catering_requests"], invalidate);

  const claimFn = useServerFn(claimCateringRequest);
  const statusFn = useServerFn(updateCateringStatus);

  const claimMut = useMutation({
    mutationFn: (id: string) => claimFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Solicitud asignada a tu cuenta");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (vars: { id: string; status: CateringStatus }) =>
      statusFn({ data: { id: vars.id, status: vars.status as "in_review" } }),
    onSuccess: () => {
      toast.success("Estado actualizado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-md border border-border/70 bg-card p-5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-3 h-4 w-64" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-small font-medium text-primary">
        No se pudieron cargar las solicitudes: {(error as Error).message}
      </p>
    );
  }

  const unassigned = data?.unassigned ?? [];
  const mine = data?.mine ?? [];

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-display text-h2">Solicitudes sin asignar</h2>
        <div className="mt-6 space-y-4">
          {unassigned.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
              No hay solicitudes sin asignar por ahora.
            </p>
          ) : (
            unassigned.map((r) => (
              <RequestCard key={r.id} request={r}>
                <button
                  type="button"
                  disabled={claimMut.isPending}
                  onClick={() => claimMut.mutate(r.id)}
                  className="transition-warm mt-4 rounded-md bg-primary px-5 py-2 text-small font-medium text-primary-foreground shadow-warm hover:brightness-110 disabled:opacity-60"
                >
                  Tomar solicitud
                </button>
              </RequestCard>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-h2">Mis solicitudes</h2>
        <div className="mt-6 space-y-4">
          {mine.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
              Aún no tienes solicitudes asignadas.
            </p>
          ) : (
            mine.map((r) => (
              <RequestCard key={r.id} request={r}>
                <div className="mt-4">
                  <label className="block text-small font-medium" htmlFor={`status-${r.id}`}>
                    Estado
                  </label>
                  <select
                    id={`status-${r.id}`}
                    disabled={statusMut.isPending}
                    value={PROVIDER_STATUSES.includes(r.status as never) ? r.status : ""}
                    onChange={(e) =>
                      statusMut.mutate({ id: r.id, status: e.target.value as CateringStatus })
                    }
                    className="transition-warm mt-1 w-full max-w-xs rounded-md border border-input bg-card px-3 py-2 text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      Selecciona un estado
                    </option>
                    {PROVIDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {cateringStatusLabel[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </RequestCard>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function RequestCard({
  request: r,
  children,
}: {
  request: CateringRequest;
  children?: React.ReactNode;
}) {
  const status = r.status as CateringStatus;
  return (
    <article className="rounded-md border border-border/70 bg-card p-5 shadow-warm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-h3 text-dark-brown">{r.contact_name}</h3>
          <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
            <Phone className="size-4" /> {r.contact_phone}
          </p>
          <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
            <Mail className="size-4" /> {r.contact_email}
          </p>
          <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
            <CalendarDays className="size-4 text-gold" /> {formatEventDate(r.event_date)}
          </p>
          <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
            <Users className="size-4" /> {r.guests ?? "—"} invitados ·{" "}
            {r.event_type ?? "Sin tipo"}
          </p>
          {r.message && <p className="mt-3 text-small text-muted-foreground">{r.message}</p>}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-small font-medium ${cateringStatusBadge[status]}`}
        >
          {cateringStatusLabel[status] ?? r.status}
        </span>
      </div>
      {children}
    </article>
  );
}
