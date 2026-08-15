import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, MapPin, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { getLandingData } from "@/lib/restaurant.functions";
import { createCheckoutSession } from "@/lib/orders.functions";
import { checkoutSchema } from "@/lib/order-schemas";
import { useCart } from "@/lib/cart";
import { CartLines } from "@/components/carta/CartDrawer";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { ConsentCheckbox } from "@/components/legal/ConsentCheckbox";

const landingQuery = queryOptions({
  queryKey: ["landing-data"],
  queryFn: () => getLandingData(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createFileRoute("/pedido")({
  loader: ({ context }) => context.queryClient.ensureQueryData(landingQuery),
  head: () => ({
    meta: [
      { title: "Finalizar pedido — El Fogó de Massanassa" },
      {
        name: "description",
        content:
          "Completa tu pedido para recoger en El Fogó de Massanassa: revisa los platos, deja tus datos y paga con tarjeta de forma segura.",
      },
      { property: "og:title", content: "Finalizar pedido — El Fogó de Massanassa" },
      {
        property: "og:description",
        content: "Paga tu pedido para recogida en el restaurante con tarjeta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PedidoPage,
});

function PedidoPage() {
  const { data } = useSuspenseQuery(landingQuery);
  const s = data.settings;
  const navigate = useNavigate();
  const { items, total, hydrated } = useCart();
  const checkout = useServerFn(createCheckoutSession);

  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (hydrated && items.length === 0 && !submitting) {
      toast.info("Tu carrito está vacío, añade algún plato");
      void navigate({ to: "/carta" });
    }
  }, [hydrated, items.length, navigate, submitting]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = checkoutSchema.safeParse({
      items: items.map((i) => ({ dish_id: i.dish_id, quantity: i.quantity })),
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      notes: form.notes || undefined,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const result = await checkout({ data: parsed.data });
      window.location.href = result.checkoutUrl;
    } catch (error) {
      setSubmitting(false);
      toast.error(
        error instanceof Error ? error.message : "No se pudo iniciar el pago. Inténtalo de nuevo.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            {s?.logo_url ? (
              <img src={s.logo_url} alt={s.name} className="size-10 rounded-full object-cover" />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UtensilsCrossed className="size-5" />
              </span>
            )}
            <span className="font-display text-h3 font-semibold leading-none">{s?.name}</span>
          </div>
          <Link
            to="/carta"
            className="transition-warm inline-flex items-center gap-2 rounded-sm px-3 py-2 text-small text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Seguir eligiendo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-h1">Finalizar pedido</h1>

        <div className="mt-6 flex items-start gap-3 rounded-md border border-gold bg-cream p-4 shadow-warm">
          <MapPin className="mt-0.5 size-5 shrink-0 text-olive" />
          <p className="text-small">
            <strong>Recogida en el restaurante</strong> — {s?.address}, {s?.city}
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <section>
            <h2 className="font-display text-h3">Tu pedido</h2>
            <div className="mt-4">
              <CartLines items={items} />
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-display text-h2 font-bold text-primary">
                {total.toFixed(2)} €
              </span>
            </div>
          </section>

          <section>
            <h2 className="font-display text-h3">Tus datos</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
              <Field label="Nombre completo" error={errors["customer_name"]}>
                <input
                  type="text"
                  required
                  placeholder="Nombre y apellidos"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-md border border-border bg-card px-3 py-2"
                />
              </Field>
              <Field label="Email" error={errors["customer_email"]}>
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-md border border-border bg-card px-3 py-2"
                />
              </Field>
              <Field label="Teléfono" error={errors["customer_phone"]}>
                <input
                  type="tel"
                  required
                  placeholder="612 34 56 78"
                  maxLength={12}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-md border border-border bg-card px-3 py-2"
                />
              </Field>
              <Field label="Notas (opcional)" error={errors["notes"]}>
                <textarea
                  rows={3}
                  maxLength={200}
                  placeholder="Sin cebolla, para llevar en 20 min..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-md border border-border bg-card px-3 py-2"
                />
                <p className="mt-1 text-right text-small text-muted-foreground">
                  {form.notes.length}/200
                </p>
              </Field>

              <ConsentCheckbox
                checked={consent}
                onChange={setConsent}
                purpose="tramitar tu pedido y enviarte la confirmación"
              />

              <button
                type="submit"
                disabled={submitting || items.length === 0 || !consent || !online}
                className="tap-target transition-warm w-full rounded-md bg-primary py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110 disabled:opacity-60"
              >
                {!online
                  ? "Necesitas conexión para pagar"
                  : submitting
                    ? "Redirigiendo al pago…"
                    : `Pagar con tarjeta — ${total.toFixed(2)}€`}
              </button>
            </form>
          </section>
        </div>
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
    <label className="block">
      <span className="text-small font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {error && (
        <p role="alert" className="mt-1 text-small text-primary">
          {error}
        </p>
      )}
    </label>
  );
}
