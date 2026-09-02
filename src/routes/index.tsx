import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Phone } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getLandingData } from "@/lib/restaurant.functions";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { LocationMap } from "@/components/LocationMap";
import { resolveLandingContent } from "@/lib/landing-content";


const landingQuery = queryOptions({
  queryKey: ["landing"],
  queryFn: () => getLandingData(),
});

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(landingQuery);
    return { content: resolveLandingContent(data.settings?.landing_content) };
  },
  head: ({ loaderData }) => {
    const content = loaderData?.content ?? resolveLandingContent(null);
    return {
      meta: [
        { title: content.seo_title },
        { name: "description", content: content.seo_description },
        { property: "og:title", content: content.seo_title },
        { property: "og:description", content: content.seo_description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
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
  const c = resolveLandingContent(s?.landing_content);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader settings={s} ctaLabel={c.header_cta_label} />

      <main>
        <section className="relative overflow-hidden">
          <img
            src={s?.hero_image_url ?? ""}
            alt={c.hero_image_alt}
            className="h-[520px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-dark-brown/55" />
          <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-6 pb-12">
            <p className="eyebrow text-gold">
              {s?.city} · {s?.postal_code}
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-h1 text-cream">
              {c.hero_title}
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`tel:${s?.phone?.replace(/\s/g, "")}`}
                className="transition-warm inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
              >
                <Phone className="size-4" /> {s?.phone}
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s?.address ?? ""}, ${s?.postal_code ?? ""} ${s?.city ?? ""}`.trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-warm inline-flex items-center gap-2 rounded-md border border-gold/60 px-6 py-3 text-cream hover:bg-gold/20"
              >
                <MapPin className="size-4" /> {s?.address}
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="eyebrow text-olive">{c.about_eyebrow}</p>
          <h2 className="mt-3 font-display text-h2">{c.about_title}</h2>
          <p className="mt-4 text-muted-foreground">{s?.description}</p>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-16">
          <p className="eyebrow text-olive">{c.location_eyebrow}</p>
          <h2 className="mt-3 font-display text-h2">{c.location_title}</h2>
          <p className="mt-4 text-muted-foreground">
            {s?.address}, {s?.postal_code} {s?.city}
          </p>
          <div className="mt-6">
            <LocationMap settings={s} />
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-16">
          <div className="rounded-lg border border-gold/60 bg-cream p-8 text-center shadow-warm">
            <p className="eyebrow text-olive">{c.catering_eyebrow}</p>
            <h2 className="mt-3 font-display text-h2 text-dark-brown">
              {c.catering_title}
            </h2>
            <p className="mt-4 whitespace-pre-line text-dark-brown/80">{c.catering_body}</p>
            <Link
              to="/catering"
              className="transition-warm mt-6 inline-flex rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
            >
              {c.catering_cta_label}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <p className="eyebrow text-olive">{c.menu_eyebrow}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-h2">{c.menu_title}</h2>
            <Link
              to="/carta"
              className="transition-warm inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
            >
              {c.menu_cta_label}
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.categories.map((c) => (
              <Link
                key={c.id}
                to="/carta"
                hash={`cat-${c.id}`}
                aria-label={`Ver ${c.name} en la carta`}
                className="transition-warm group block rounded-lg border border-border bg-card p-6 shadow-warm hover:-translate-y-1 hover:border-primary/60 hover:shadow-warm-lg"
              >
                <h3 className="font-display text-h3 group-hover:text-primary">{c.name}</h3>
                <p className="mt-2 text-small text-muted-foreground">
                  {c.available_dishes}{" "}
                  {c.available_dishes === 1 ? "plato disponible" : "platos disponibles"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <WhatsAppFab phone={s?.whatsapp_phone} />
      <SiteFooter settings={s} />

    </div>
  );
}
