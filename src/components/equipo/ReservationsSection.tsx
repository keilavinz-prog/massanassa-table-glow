import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Clock, Phone, StickyNote, Users, X } from "lucide-react";
import {
  cancelReservation,
  confirmReservation,
  getReservationsByDate,
  rejectReservation,
  updateReservation,
  type Reservation,
} from "@/lib/reservations.functions";
import {
  DINNER_SLOTS,
  LUNCH_SLOTS,
  MAX_PARTY_SIZE,
  NOTES_MAX,
  fieldErrors,
  formatLongDate,
  normalizeTime,
  todayISO,
  updateReservationSchema,
  type ReservationStatus,
} from "@/lib/reservation-rules";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeTables } from "@/hooks/useRealtimeTables";

const statusLabel: Record<ReservationStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

const statusBadge: Record<ReservationStatus, string> = {
  pending: "bg-gold text-dark-brown",
  confirmed: "bg-olive text-white",
  rejected: "bg-muted text-muted-foreground line-through",
  cancelled: "bg-muted text-muted-foreground line-through",
};

const inputClass =
  "transition-warm mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/25";

export function ReservationsSection({ extraSummary }: { extraSummary?: ReactNode }) {
  const [date, setDate] = useState<string>(todayISO());
  const [mode, setMode] = useState<"upcoming" | "day">("upcoming");
  const [editing, setEditing] = useState<Reservation | null>(null);
  const queryClient = useQueryClient();

  const fetchByDate = useServerFn(getReservationsByDate);
  const queryKey = ["reservations", mode, date] as const;

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => fetchByDate({ data: { date, mode } }),
  });

  const confirmFn = useServerFn(confirmReservation);
  const rejectFn = useServerFn(rejectReservation);
  const cancelFn = useServerFn(cancelReservation);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["reservations"] });
  }, [queryClient]);

  // Realtime: cualquier cambio en reservas refresca la vista sin recargar.
  useRealtimeTables(["reservations"], invalidate);

  const confirmMut = useMutation({
    mutationFn: (id: string) => confirmFn({ data: { id } }),
    onSuccess: (result) => {
      toast.success(
        result.calendarSynced
          ? "Reserva confirmada y añadida a Google Calendar"
          : "Reserva confirmada (Google Calendar no configurado)",
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Reserva rechazada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Reserva cancelada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reservations = data?.reservations ?? [];
  const confirmedToday = useMemo(
    () =>
      date === todayISO()
        ? reservations.filter((r) => r.status === "confirmed").length
        : reservations.filter((r) => r.status === "confirmed").length,
    [reservations, date],
  );

  const busy = confirmMut.isPending || rejectMut.isPending || cancelMut.isPending;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          value={data?.pendingTotal ?? 0}
          label="reservas pendientes"
          badgeClass="bg-gold text-dark-brown"
        />
        <SummaryCard
          value={confirmedToday}
          label={date === todayISO() ? "confirmadas para hoy" : "confirmadas ese día"}
          badgeClass="bg-olive text-white"
        />
        {extraSummary}
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-md border border-border/70 bg-card p-4 shadow-warm">
        <div>
          <span className="block text-small font-medium">Vista</span>
          <div className="mt-1 flex gap-2">
            {(
              [
                { id: "upcoming", label: "Próximas" },
                { id: "day", label: "Por día" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`transition-warm rounded-md px-4 py-2 text-small font-medium ${
                  mode === m.id
                    ? "bg-terracota text-white shadow-warm"
                    : "border border-input bg-background hover:bg-accent/20"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-small font-medium" htmlFor="filter-date">
            {mode === "upcoming" ? "Desde el día" : "Día"}
          </label>
          <input
            id="filter-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || todayISO())}
            className={inputClass}
          />
        </div>
        <p className="flex items-center gap-2 pb-2 text-small text-muted-foreground">
          <CalendarDays className="size-4 text-gold" />
          {mode === "upcoming" ? `Desde ${formatLongDate(date)}` : formatLongDate(date)}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md border border-border/70 bg-card p-5">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-3 h-4 w-56" />
              <Skeleton className="mt-2 h-4 w-40" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p role="alert" className="text-small font-medium text-primary">
          No se pudieron cargar las reservas: {(error as Error).message}
        </p>
      )}

      {!isLoading && !isError && reservations.length === 0 && (
        <p className="rounded-md border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground">
          No hay reservas para este día.
        </p>
      )}

      <div className="space-y-4">
        {reservations.map((r) => {
          const status = r.status as ReservationStatus;
          const inactive = status === "rejected" || status === "cancelled";
          return (
            <article
              key={r.id}
              className={`rounded-md border border-border/70 bg-card p-5 shadow-warm ${
                inactive ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-h3 text-dark-brown">
                    {normalizeTime(r.reservation_time)}
                  </h3>
                  <p className="mt-1 font-medium">{r.customer_name}</p>
                  <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
                    <Phone className="size-4" /> {r.customer_phone}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-small text-muted-foreground">
                    <Users className="size-4" /> {r.party_size} comensales
                  </p>
                  {r.notes && (
                    <p className="mt-2 flex items-start gap-2 text-small text-muted-foreground">
                      <StickyNote className="mt-0.5 size-4 shrink-0 text-gold" />
                      {r.notes}
                    </p>
                  )}
                  {status === "confirmed" && (
                    <p className="mt-2 text-small text-muted-foreground">
                      Google Calendar:{" "}
                      {r.google_calendar_event_id ? "sincronizada" : "sin sincronizar"}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-small font-medium ${statusBadge[status]}`}
                >
                  {statusLabel[status]}
                </span>
              </div>

              {status === "pending" && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirmMut.mutate(r.id)}
                    className="transition-warm rounded-md bg-olive px-5 py-2 text-small font-medium text-white hover:brightness-110 disabled:opacity-60"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => rejectMut.mutate(r.id)}
                    className="transition-warm rounded-md border border-primary bg-transparent px-5 py-2 text-small font-medium text-dark-brown hover:bg-primary/10 disabled:opacity-60"
                  >
                    Rechazar
                  </button>
                </div>
              )}

              {status === "confirmed" && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    className="transition-warm rounded-md bg-olive px-5 py-2 text-small font-medium text-white hover:brightness-110"
                  >
                    Modificar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => cancelMut.mutate(r.id)}
                    className="transition-warm rounded-md border border-primary bg-transparent px-5 py-2 text-small font-medium text-dark-brown hover:bg-primary/10 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {editing && (
        <EditReservationModal
          reservation={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}
    </section>
  );
}

function SummaryCard({
  value,
  label,
  badgeClass,
}: {
  value: number;
  label: string;
  badgeClass: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-md border border-border/70 bg-card p-4 shadow-warm">
      <span
        className={`flex size-11 items-center justify-center rounded-full font-display text-h3 ${badgeClass}`}
      >
        {value}
      </span>
      <p className="text-small text-muted-foreground">{label}</p>
    </div>
  );
}

function EditReservationModal({
  reservation,
  onClose,
  onSaved,
}: {
  reservation: Reservation;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(reservation.reservation_date);
  const [time, setTime] = useState(normalizeTime(reservation.reservation_time));
  const [party, setParty] = useState(String(reservation.party_size));
  const [notes, setNotes] = useState(reservation.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFn = useServerFn(updateReservation);
  const mutation = useMutation({
    mutationFn: (values: {
      id: string;
      reservation_date: string;
      reservation_time: string;
      party_size: number;
      notes?: string | undefined;
    }) => updateFn({ data: values }),
    onSuccess: () => {
      toast.success("Reserva actualizada");
      onSaved();
    },
    onError: (e: Error) => setErrors({ form: e.message }),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = updateReservationSchema.safeParse({
      id: reservation.id,
      reservation_date: date,
      reservation_time: time,
      party_size: party === "" ? Number.NaN : Number(party),
      notes,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    mutation.mutate(parsed.data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-brown/60 p-4">
      <div className="w-full max-w-md rounded-md border border-border/70 bg-card p-6 shadow-warm">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-h3">Modificar reserva</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="transition-warm rounded-sm p-1 text-muted-foreground hover:text-primary"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-1 text-small text-muted-foreground">
          {reservation.customer_name} · {reservation.customer_phone}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label className="block text-small font-medium" htmlFor="edit-date">
              Fecha
            </label>
            <input
              id="edit-date"
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
            {errors["reservation_date"] && (
              <p className="mt-1 text-small font-medium text-primary">
                {errors["reservation_date"]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-small font-medium" htmlFor="edit-time">
              <Clock className="mr-1 inline size-4" /> Hora
            </label>
            <select
              id="edit-time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona una hora</option>
              <optgroup label="Comidas">
                {LUNCH_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Cenas">
                {DINNER_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
            </select>
            {errors["reservation_time"] && (
              <p className="mt-1 text-small font-medium text-primary">
                {errors["reservation_time"]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-small font-medium" htmlFor="edit-party">
              Comensales
            </label>
            <input
              id="edit-party"
              type="number"
              min={1}
              max={MAX_PARTY_SIZE}
              value={party}
              onChange={(e) => setParty(e.target.value)}
              className={inputClass}
            />
            {errors["party_size"] && (
              <p className="mt-1 text-small font-medium text-primary">
                {errors["party_size"]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-small font-medium" htmlFor="edit-notes">
              Notas
            </label>
            <textarea
              id="edit-notes"
              rows={3}
              maxLength={NOTES_MAX}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-right text-small text-muted-foreground">
              {notes.length}/{NOTES_MAX}
            </p>
          </div>

          {errors["form"] && (
            <p role="alert" className="text-small font-medium text-primary">
              {errors["form"]}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="transition-warm rounded-md bg-primary px-5 py-2.5 text-small font-medium text-primary-foreground shadow-warm hover:brightness-110 disabled:opacity-60"
            >
              {mutation.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="transition-warm rounded-md border border-input px-5 py-2.5 text-small font-medium hover:bg-accent/20"
            >
              Descartar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
