import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  Car,
  PartyPopper,
  ShoppingBag,
  Snowflake,
  Umbrella,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { getLandingData } from "@/lib/restaurant.functions";
import restaurantHero from "@/assets/restaurante-hero.jpg.asset.json";

const landingQuery = queryOptions({
  queryKey: ["landing"],
  queryFn: () => getLandingData(),
});

export const Route = createFileRoute("/restaurantes")({
  loader: ({ context }) => context.queryClient.ensureQueryData(landingQuery),
  head: () => ({
    meta: [
      { title: "Restaurantes — RESTAURANTE CHICKEN GARDEN" },
      {
        name: "description",
        content:
          "Conoce Chicken Garden: pollo asado, parrilla, terraza cubierta, salas climatizadas, parking y eventos privados en Massanassa.",
      },
      { property: "og:title", content: "Restaurantes — RESTAURANTE CHICKEN GARDEN" },
      {
        property: "og:description",
        content:
          "Nuestra historia, instalaciones y servicios para familias y grupos en Massanassa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://massanassa-table-glow.lovable.app/restaurantes",
      },
    ],
  }),
  component: RestaurantesPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center">
      No se pudo cargar la página: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Página no disponible.</div>,
});

const HIGHLIGHTS = [
  {
    icon: Umbrella,
    label: "Terraza cubierta",
  },
  {
    icon: Snowflake,
    label: "Salas climatizadas",
  },
  {
    icon: Car,
    label: "Amplio parking",
  },
  {
    icon: ShoppingBag,
    label: "Servicio para llevar",
  },
  {
    icon: PartyPopper,
    label: "Eventos privados",
  },
] as const;

function RestaurantesPage() {
  const { data } = useSuspenseQuery(landingQuery);
  const s = data.settings;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={s} />

      <main>
        {/* Hero visual */}
        <section className="relative overflow-hidden">
          <img
            src={restaurantHero.url}
            alt="Parrilla con pollo asado y carnes a la brasa en Chicken Garden"
            width={1280}
            height={720}
            className="h-[360px] w-full object-cover sm:h-[420px] lg:h-[520px]"
          />
          <div className="absolute inset-0 bg-dark-brown/55" />
          <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-6 pb-10 sm:pb-12">
            <p className="eyebrow text-gold">Nuestra casa</p>
            <h1 className="mt-3 max-w-2xl font-display text-h1 text-cream">
              Restaurantes Chicken Garden
            </h1>
          </div>
        </section>

        {/* Historia */}
        <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <p className="eyebrow text-olive">Nuestra historia</p>
          <h2 className="mt-3 font-display text-h2">
            Tradición, parrilla y mezcla de culturas
          </h2>

          <div className="mt-6 space-y-5 text-body leading-relaxed text-muted-foreground">
            {resolveHistoriaParagraphs(s?.historia_texto).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {/* Badges */}
          <div className="mt-10 flex flex-wrap gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="transition-warm inline-flex items-center gap-2 rounded-full border border-gold/40 bg-cream px-4 py-2 text-small font-medium text-dark-brown hover:border-gold hover:shadow-warm"
              >
                <Icon className="size-4 text-terracota" aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <div className="rounded-lg border border-gold/60 bg-cream p-8 text-center shadow-warm sm:p-10">
            <p className="eyebrow text-olive">Reserva tu mesa</p>
            <h2 className="mt-3 font-display text-h2 text-dark-brown">
              Te esperamos en Massanassa
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Disfruta de nuestra parrilla en un entorno cómodo y familiar.
              Reserva online o pide para llevar.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="/reservar"
                className="transition-warm inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
              >
                Reservar mesa
              </a>
              <a
                href="/carta"
                className="transition-warm inline-flex items-center gap-2 rounded-md border border-input bg-background px-6 py-3 font-medium text-foreground hover:bg-accent/20"
              >
                Ver carta
              </a>
            </div>
          </div>
        </section>
      </main>

      <WhatsAppFab phone={s?.whatsapp_phone} />
      <SiteFooter settings={s} />
    </div>
  );
}
