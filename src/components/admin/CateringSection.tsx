import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Mail, Phone, Users } from "lucide-react";
import {
  assignCateringRequest,
  listCateringRequests,
  type CateringRequest,
} from "@/lib/catering.functions";
import {
  cateringStatusBadge,
  cateringStatusLabel,
  formatEventDate,
  type CateringStatus,
} from "@/lib/catering-schemas";
import { useRealtimeTables } from "@/hooks/useRealtimeTables";
import { Skeleton } from "@/components/ui/skeleton";

const FILTERS: { id: "all" | CateringStatus; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "new", label: "Nuevas" },
  { id: "in_review", label: "En revisión" },
  { id: "quoted", label: "Presupuestadas" },
  { id: "confirmed", label: "Confirmadas" },
  { id: "closed", label: "Cerradas" },
];

export function CateringSection() {
  const [filter, setFilter] = useState<"all" | CateringStatus>("all");
  const queryClient = useQueryClient();

  const fetchAll = useServerFn(listCateringRequests);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["catering", "admin"],
    queryFn: () => fetchAll(),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["catering"] });
  }, [queryClient]);
  useRealtimeTables(["catering_requests"], invalidate);

  const assignFn = useServerFn(assignCateringRequest);
  const assignMut = useMutation({
    mutationFn: (vars: { id: string; providerId: string | null }) =>
      assignFn({ data: vars }),
    onSuccess: () => {
      toast.success("Asignación actualizada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requests = data?.requests ?? [];
  const providers = data?.providers ?? [];
  const visible = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter],
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`transition-warm rounded-full px-4 py-1.5 text-small font-medium ${
              filter === f.id
                ? "bg-primary text-primary-foreground shadow-warm"
                : "border border-input bg-background hover:bg-accent/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-md border border-border/70 bg-card p-5">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-3 h-4 w-64" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p role="alert" className="text-small font-medium text-primary">
          No se pudieron cargar las solicitudes: {(error as Error).message}
        </p>
      )}

      {!isLoading && !isError && visible.length === 0 && (
        <p className="rounded-md border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
          No hay solicitudes con este filtro.
        </p>
      )}

      <div className="space-y-4">
        {visible.map((r) => (
          <CateringCard
            key={r.id}
            request={r}
            providers={providers}
            busy={assignMut.isPending}
            onAssign={(providerId) => assignMut.mutate({ id: r.id, providerId })}
          />
        ))}
      </div>
    </section>
  );
}

function CateringCard({
  request: r,
  providers,
  busy,
  onAssign,
}: {
  request: CateringRequest;
  providers: { id: string; full_name: string | null }[];
  busy: boolean;
  onAssign: (providerId: string | null) => void;
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

      <div className="mt-4">
        <label className="block text-small font-medium" htmlFor={`assign-${r.id}`}>
          Asignar a
        </label>
        <select
          id={`assign-${r.id}`}
          disabled={busy}
          value={r.assigned_to ?? ""}
          onChange={(e) => onAssign(e.target.value ? e.target.value : null)}
          className="transition-warm mt-1 w-full max-w-sm rounded-md border border-input bg-card px-3 py-2 text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
        >
          <option value="">Sin asignar</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name ?? "Proveedor sin nombre"}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}
