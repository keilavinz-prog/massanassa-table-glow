import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { queryOptions, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { createPublicReservation } from "@/lib/reservations.functions";
import { getLandingData } from "@/lib/restaurant.functions";
import {
  BIG_GROUP_MESSAGE,
  CLOSED_DAY_MESSAGE,
  DINNER_SLOTS,
  LUNCH_SLOTS,
  MAX_PARTY_SIZE,
  NOTES_MAX,
  fieldErrors,
  formatLongDate,
  parseISODate,
  publicReservationSchema,
  type PublicReservationInput,
  toISODate,
  todayISO,
} from "@/lib/reservation-rules";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { cn } from "@/lib/utils";

const landingQuery = queryOptions({
  queryKey: ["landing"],
  queryFn: () => getLandingData(),
});

export const Route = createFileRoute("/reservar")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(landingQuery);
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center">
      No se pudo cargar el formulario de reserva: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Sin datos.</div>,
  head: () => ({
    meta: [
      { title: "Reservar mesa — El Fogó de Massanassa" },
      {
        name: "description",
        content:
          "Reserva tu mesa en El Fogó de Massanassa: elige día, hora y comensales y te confirmamos en breve.",
      },
      { property: "og:title", content: "Reservar mesa — El Fogó de Massanassa" },
      {
        property: "og:description",
        content:
          "Solicita tu mesa en nuestra taberna valenciana de Massanassa. Comidas y cenas, martes a domingo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReservarPage,
});

type FormState = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  reservation_date: string;
  reservation_time: string;
  party_size: string;
  notes: string;
};

const emptyForm: FormState = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  reservation_date: "",
  reservation_time: "",
  party_size: "",
  notes: "",
};

const labelClass = "block text-small font-medium text-foreground";
const inputClass =
  "transition-warm mt-1 w-full rounded-md border border-input bg-card px-4 py-2.5 text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/25";

function ReservarPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<FormState | null>(null);
  const { data: landing } = useSuspenseQuery(landingQuery);

  const submit = useServerFn(createPublicReservation);
  const mutation = useMutation({
    mutationFn: (values: PublicReservationInput) => submit({ data: values }),
    onSuccess: () => {
      setConfirmed(form);
      setForm(emptyForm);
      setErrors({});
    },
    onError: (error: Error) => setErrors({ form: error.message }),
  });

  const partySize = Number(form.party_size);
  const bigGroup = form.party_size !== "" && partySize > MAX_PARTY_SIZE;

  const selectedDate = useMemo(
    () => (form.reservation_date ? parseISODate(form.reservation_date) : undefined),
    [form.reservation_date],
  );

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next["form"];
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = publicReservationSchema.safeParse({
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      reservation_date: form.reservation_date,
      reservation_time: form.reservation_time,
      party_size: form.party_size === "" ? Number.NaN : Number(form.party_size),
      notes: form.notes,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    mutation.mutate(parsed.data);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-5" />
            </span>
            <span className="font-display text-h3 font-semibold leading-none">
              {landing.settings?.name ?? "El Fogó de Massanassa"}
            </span>
          </div>
          <Link
            to="/"
            className="transition-warm inline-flex items-center gap-2 rounded-sm px-3 py-2 text-small text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-h1">Reservar mesa</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Elige día, hora y comensales. Te confirmamos la mesa por email o teléfono en
          cuanto la revisemos.
        </p>

        {confirmed ? (
          <ConfirmationPanel data={confirmed} onReset={() => setConfirmed(null)} />
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-8 space-y-6 rounded-md border border-border/70 bg-card p-6 shadow-warm sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="customer_name">
                  Nombre completo *
                </label>
                <input
                  id="customer_name"
                  className={inputClass}
                  placeholder="Nombre y apellidos"
                  value={form.customer_name}
                  onChange={(e) => update("customer_name", e.target.value)}
                />
                <FieldError message={errors["customer_name"]} />
              </div>

              <div>
                <label className={labelClass} htmlFor="customer_email">
                  Email *
                </label>
                <input
                  id="customer_email"
                  type="email"
                  className={inputClass}
                  placeholder="tucorreo@email.com"
                  value={form.customer_email}
                  onChange={(e) => update("customer_email", e.target.value)}
                />
                <FieldError message={errors["customer_email"]} />
              </div>

              <div>
                <label className={labelClass} htmlFor="customer_phone">
                  Teléfono *
                </label>
                <input
                  id="customer_phone"
                  type="tel"
                  inputMode="tel"
                  className={inputClass}
                  placeholder="612 34 56 78"
                  value={form.customer_phone}
                  onChange={(e) => update("customer_phone", e.target.value)}
                />
                <FieldError message={errors["customer_phone"]} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <span className={labelClass}>Fecha *</span>
                <p className="mt-1 text-small text-muted-foreground">
                  {CLOSED_DAY_MESSAGE}: los lunes aparecen deshabilitados.
                </p>
                <div className="mt-2 rounded-md border border-border/70 bg-background">
                  <Calendar
                    mode="single"
                    locale={es}
                    selected={selectedDate}
                    onSelect={(date) =>
                      update("reservation_date", date ? toISODate(date) : "")
                    }
                    disabled={[
                      { dayOfWeek: [1] },
                      { before: parseISODate(todayISO()) },
                    ]}
                    modifiers={{ closed: { dayOfWeek: [1] } }}
                    modifiersClassNames={{ closed: "line-through" }}
                    className="pointer-events-auto p-3"
                    title={CLOSED_DAY_MESSAGE}
                  />
                </div>
                {form.reservation_date && (
                  <p className="mt-2 text-small text-muted-foreground">
                    Seleccionado: {formatLongDate(form.reservation_date)}
                  </p>
                )}
                <FieldError message={errors["reservation_date"]} />
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClass} htmlFor="reservation_time">
                    Hora *
                  </label>
                  <select
                    id="reservation_time"
                    className={inputClass}
                    value={form.reservation_time}
                    onChange={(e) => update("reservation_time", e.target.value)}
                  >
                    <option value="">Selecciona una hora</option>
                    <optgroup label="Comidas (cierre 16:30)">
                      {LUNCH_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Cenas (cierre 23:30)">
                      {DINNER_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <FieldError message={errors["reservation_time"]} />
                </div>

                <div>
                  <label className={labelClass} htmlFor="party_size">
                    Comensales *
                  </label>
                  <input
                    id="party_size"
                    type="number"
                    min={1}
                    max={MAX_PARTY_SIZE}
                    className={inputClass}
                    placeholder="2"
                    value={form.party_size}
                    onChange={(e) => update("party_size", e.target.value)}
                  />
                  {bigGroup ? (
                    <p className="mt-1 text-small font-medium text-primary">
                      {BIG_GROUP_MESSAGE}
                    </p>
                  ) : (
                    <FieldError message={errors["party_size"]} />
                  )}
                </div>

                <div>
                  <label className={labelClass} htmlFor="notes">
                    Notas
                  </label>
                  <textarea
                    id="notes"
                    rows={4}
                    maxLength={NOTES_MAX}
                    className={inputClass}
                    placeholder="Alergias, celebraciones, sillita para bebé..."
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                  />
                  <p className="mt-1 text-right text-small text-muted-foreground">
                    {form.notes.length}/{NOTES_MAX}
                  </p>
                  <FieldError message={errors["notes"]} />
                </div>
              </div>
            </div>

            {errors["form"] && (
              <p role="alert" className="text-small font-medium text-primary">
                {errors["form"]}
              </p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || bigGroup}
              className={cn(
                "transition-warm w-full rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110 disabled:opacity-60 sm:w-auto",
              )}
            >
              {mutation.isPending ? "Enviando solicitud..." : "Solicitar reserva"}
            </button>
          </form>
        )}
      </main>

      <WhatsAppFab phone={landing.settings?.whatsapp_phone} />
      <SiteFooter settings={landing.settings ?? {}} />
    </div>
  );
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-small font-medium text-primary">
      {message}
    </p>
  );
}

function ConfirmationPanel({
  data,
  onReset,
}: {
  data: FormState;
  onReset: () => void;
}) {
  return (
    <div className="mt-8 rounded-md border border-olive/40 bg-card p-8 text-center shadow-warm">
      <CheckCircle2 className="mx-auto size-14 text-olive" />
      <h2 className="mt-4 font-display text-h2">¡Solicitud recibida!</h2>
      <p className="mt-2 text-muted-foreground">
        Te confirmaremos por email o teléfono en breve.
      </p>

      <dl className="mx-auto mt-6 grid max-w-md gap-3 text-left">
        <SummaryRow
          icon={<CalendarDays className="size-4 text-gold" />}
          label="Fecha"
          value={
            data.reservation_date
              ? formatLongDate(data.reservation_date)
              : "—"
          }
        />
        <SummaryRow
          icon={<Clock className="size-4 text-gold" />}
          label="Hora"
          value={data.reservation_time}
        />
        <SummaryRow
          icon={<Users className="size-4 text-gold" />}
          label="Comensales"
          value={data.party_size}
        />
      </dl>

      <button
        type="button"
        onClick={onReset}
        className="transition-warm mt-8 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
      >
        Hacer otra reserva
      </button>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-sm border border-border/60 bg-background px-4 py-3">
      <dt className="flex items-center gap-2 text-small text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
