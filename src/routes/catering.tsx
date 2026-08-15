import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, UtensilsCrossed } from "lucide-react";
import { getLandingData } from "@/lib/restaurant.functions";
import { createCateringRequest } from "@/lib/catering.functions";
import {
  CATERING_MESSAGE_MAX,
  EVENT_TYPES,
  cateringRequestSchema,
  fieldErrors,
  todayISO,
} from "@/lib/catering-schemas";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";

const landingQuery = queryOptions({
  queryKey: ["landing"],
  queryFn: () => getLandingData(),
});

export const Route = createFileRoute("/catering")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(landingQuery);
  },
  head: () => ({
    meta: [
      { title: "Catering y eventos — El Fogó de Massanassa" },
      {
        name: "description",
        content:
          "Solicita presupuesto de catering para bodas, comuniones, cumpleaños y eventos de empresa en Massanassa.",
      },
      { property: "og:title", content: "Catering y eventos — El Fogó de Massanassa" },
      {
        property: "og:description",
        content: "Arroces en paella de leña y cocina valenciana para tu celebración.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CateringPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center">
      No se pudo cargar la página: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Sin datos.</div>,
});

const inputClass =
  "transition-warm mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5 text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/25";

function CateringPage() {
  const { data } = useSuspenseQuery(landingQuery);
  const s = data.settings;

  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    event_date: "",
    guests: "",
    event_type: "",
    message: "",
  });

  const submitFn = useServerFn(createCateringRequest);
  const mutation = useMutation({
    mutationFn: (payload: unknown) => submitFn({ data: payload }),
    onSuccess: () => setDone(true),
    onError: (e: Error) => setErrors({ form: e.message }),
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const candidate = {
      contact_name: form.contact_name,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      event_date: form.event_date,
      guests: form.guests ? Number(form.guests) : undefined,
      event_type: form.event_type ? form.event_type : undefined,
      message: form.message,
    };
    const parsed = cateringRequestSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-5" />
            </span>
            <span className="font-display text-h3 font-semibold leading-none">{s?.name}</span>
          </div>
          <Link
            to="/"
            className="transition-warm text-small font-medium text-muted-foreground hover:text-primary"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        {done ? (
          <section className="rounded-lg border border-gold/60 bg-card p-10 text-center shadow-warm">
            <CheckCircle2 className="mx-auto size-14 text-olive" />
            <h1 className="mt-4 font-display text-h2">¡Gracias!</h1>
            <p className="mt-3 text-muted-foreground">
              Nos pondremos en contacto contigo en menos de 48h.
            </p>
            <Link
              to="/"
              className="transition-warm mt-8 inline-flex rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
            >
              Volver al inicio
            </Link>
          </section>
        ) : (
          <>
            <p className="eyebrow text-olive">Catering y eventos</p>
            <h1 className="mt-3 font-display text-h1">Solicita tu presupuesto</h1>
            <p className="mt-4 text-muted-foreground">
              Llevamos nuestros arroces en paella de leña y la cocina de la casa a bodas,
              comuniones, cumpleaños y eventos de empresa. Cuéntanos tu idea y te preparamos
              una propuesta a medida.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5 rounded-lg border border-border/70 bg-card p-6 shadow-warm"
            >
              <Field label="Nombre de contacto" error={errors["contact_name"]}>
                <input
                  className={inputClass}
                  placeholder="Nombre y apellidos"
                  value={form.contact_name}
                  onChange={(e) => set("contact_name", e.target.value)}
                />
              </Field>

              <Field label="Email" error={errors["contact_email"]}>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="tucorreo@example.com"
                  value={form.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)}
                />
              </Field>

              <Field label="Teléfono" error={errors["contact_phone"]}>
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="612 34 56 78"
                  value={form.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value)}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Fecha del evento (opcional)" error={errors["event_date"]}>
                  <input
                    type="date"
                    min={todayISO()}
                    className={inputClass}
                    value={form.event_date}
                    onChange={(e) => set("event_date", e.target.value)}
                  />
                </Field>

                <Field label="Nº de invitados (opcional)" error={errors["guests"]}>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    placeholder="Ej: 40"
                    value={form.guests}
                    onChange={(e) => set("guests", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Tipo de evento (opcional)" error={errors["event_type"]}>
                <select
                  className={inputClass}
                  value={form.event_type}
                  onChange={(e) => set("event_type", e.target.value)}
                >
                  <option value="">Selecciona una opción</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Mensaje (opcional)" error={errors["message"]}>
                <textarea
                  rows={4}
                  maxLength={CATERING_MESSAGE_MAX}
                  className={inputClass}
                  placeholder="Cuéntanos qué necesitas: fecha aproximada, presupuesto, ubicación..."
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                />
                <p className="mt-1 text-right text-small text-muted-foreground">
                  {form.message.length}/{CATERING_MESSAGE_MAX}
                </p>
              </Field>

              {errors["form"] && (
                <p role="alert" className="text-small font-medium text-primary">
                  {errors["form"]}
                </p>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="transition-warm w-full rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110 disabled:opacity-60 sm:w-auto"
              >
                {mutation.isPending ? "Enviando…" : "Solicitar presupuesto"}
              </button>
            </form>
          </>
        )}
      </main>

      <WhatsAppFab phone={s?.whatsapp_phone} />
      <SiteFooter settings={s} />
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-small font-medium">{label}</label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-small font-medium text-primary">
          {error}
        </p>
      )}
    </div>
  );
}
