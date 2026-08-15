import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Phone, UtensilsCrossed } from "lucide-react";
import { getLandingData } from "@/lib/restaurant.functions";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";


const landingQuery = queryOptions({
  queryKey: ["landing"],
  queryFn: () => getLandingData(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(landingQuery);
  },
  head: () => ({
    meta: [
      { title: "El Fogó de Massanassa — Cocina valenciana de mercado" },
      {
        name: "description",
        content:
          "Taberna valenciana en Massanassa: arroces en paella de leña, pollo asado para llevar y cocina de mercado.",
      },
      {
        property: "og:title",
        content: "El Fogó de Massanassa — Cocina valenciana de mercado",
      },
      {
        property: "og:description",
        content:
          "Arroces en paella de leña, esgarraet, pollo asado para llevar y postres caseros en Massanassa (Valencia).",
      },
    ],
  }),
  component: Landing,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center">
      No se pudo cargar la información del restaurante: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Sin datos.</div>,
});

function Landing() {
  const { data } = useSuspenseQuery(landingQuery);
  const s = data.settings;
  const hours = (s?.opening_hours ?? {}) as Record<string, string>;
  const hoursSummary = hours["mar_dom"] ?? Object.values(hours).join(" · ");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-5" />
            </span>
            <span className="font-display text-h3 font-semibold leading-none">
              {s?.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/reservar"
              className="transition-warm inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-warm hover:brightness-110"
            >
              Reservar mesa
            </Link>
          <div className="text-right text-small text-muted-foreground">
            <p className="eyebrow text-accent-foreground/70">Horario</p>
            <p>Martes a domingo · {hoursSummary}</p>
            <p>Lunes cerrado</p>
          </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <img
            src={s?.hero_image_url ?? ""}
            alt="Arroz valenciano recién hecho en paella"
            className="h-[520px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-dark-brown/55" />
          <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-6 pb-12">
            <p className="eyebrow text-gold">
              {s?.city} · {s?.postal_code}
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-h1 text-cream">
              Cocina valenciana de mercado en Massanassa
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`tel:${s?.phone?.replace(/\s/g, "")}`}
                className="transition-warm inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
              >
                <Phone className="size-4" /> {s?.phone}
              </a>
              <span className="inline-flex items-center gap-2 rounded-md border border-gold/60 px-6 py-3 text-cream">
                <MapPin className="size-4" /> {s?.address}
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="eyebrow text-olive">Sobre nosotros</p>
          <h2 className="mt-3 font-display text-h2">La taberna del barrio</h2>
          <p className="mt-4 text-muted-foreground">{s?.description}</p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <p className="eyebrow text-olive">Nuestra carta</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-h2">Categorías</h2>
            <Link
              to="/carta"
              className="transition-warm inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
            >
              Ver la carta digital
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.categories.map((c) => (
              <article
                key={c.id}
                className="transition-warm group rounded-lg border border-border bg-card p-6 shadow-warm hover:-translate-y-1 hover:shadow-warm-lg"
              >
                <h3 className="font-display text-h3">{c.name}</h3>
                <p className="mt-2 text-small text-muted-foreground">
                  {c.available_dishes}{" "}
                  {c.available_dishes === 1 ? "plato disponible" : "platos disponibles"}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <WhatsAppFab phone={s?.whatsapp_phone} />
      <SiteFooter settings={s} />

    </div>
  );
}
