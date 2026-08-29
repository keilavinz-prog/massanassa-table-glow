import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, SlidersHorizontal, UtensilsCrossed, X } from "lucide-react";
import { ALLERGENS, ALLERGEN_LABELS } from "@/lib/admin-schemas";
import { getPublicMenu } from "@/lib/restaurant.functions";
import { SiteFooter } from "@/components/SiteFooter";
import { DishCard, DishCardSkeleton } from "@/components/carta/DishCard";
import { CartFab } from "@/components/carta/CartDrawer";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { OfflineMenu } from "@/components/carta/OfflineMenu";
import { OfflineNotice } from "@/components/carta/OfflineNotice";
import { saveMenuCache } from "@/lib/menu-cache";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const menuQuery = queryOptions({
  queryKey: ["public-menu"],
  queryFn: () => getPublicMenu(),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
});

export const Route = createFileRoute("/carta")({
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQuery),
  head: () => ({
    meta: [
      { title: "Carta digital — RESTAURANTE CHICKEN GARDEN" },
      {
        name: "description",
        content:
          "Consulta la carta de RESTAURANTE CHICKEN GARDEN: arroces, pollo asado para llevar, menú del día, postres caseros y alérgenos de cada plato.",
      },
      { property: "og:title", content: "Carta digital — RESTAURANTE CHICKEN GARDEN" },
      {
        property: "og:description",
        content:
          "Arroces, fideuà, pollo asado, menú del día y postres caseros con información de alérgenos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartaPage,
  pendingComponent: MenuSkeleton,
  errorComponent: ({ error }) => <OfflineMenu message={error.message} />,
  notFoundComponent: () => <div className="p-8">Carta no disponible.</div>,
});

function MenuSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <DishCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CartaPage() {
  const { data } = useSuspenseQuery(menuQuery);
  const s = data.settings;
  const [active, setActive] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const online = useOnlineStatus();

  // Guarda la carta para que siga visible si se pierde la conexión.
  useEffect(() => {
    saveMenuCache({ settings: data.settings, categories: data.categories });
  }, [data]);

  // Si se llega con #cat-<id> (desde la portada), desplaza a esa categoría.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash.startsWith("cat-")) return;
    const id = hash.slice(4);
    const el = document.getElementById(hash);
    if (!el) return;
    setActiveCategory(id);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() =>
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }),
    );
  }, [data]);

  const categories = useMemo(
    () =>
      data.categories.map((c) => ({
        ...c,
        dishes: c.dishes.filter((d) => !d.allergens.some((a) => active.includes(a))),
      })),
    [data.categories, active],
  );

  const visibleCategories = categories.filter((c) => c.dishes.length > 0);
  const menuDelDia = visibleCategories.flatMap((c) =>
    c.dishes.filter((d) => d.is_menu_del_dia),
  );

  function toggle(a: string) {
    setActive((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function scrollTo(id: string) {
    setActiveCategory(id);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`cat-${id}`)?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="safe-pt safe-px sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-6 py-3 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {s?.logo_url ? (
              <img
                src={s.logo_url}
                alt={s?.name ?? "Logo"}
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UtensilsCrossed className="size-5" />
              </span>
            )}
            <span className="w-full truncate font-display text-lg font-semibold leading-none sm:text-h3">{s?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="transition-warm hidden items-center gap-2 rounded-sm px-3 py-2 text-small text-muted-foreground hover:text-primary sm:inline-flex"
            >
              <ArrowLeft className="size-4" /> Volver al inicio
            </Link>
            <Link
              to="/reservar"
              className="transition-warm inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-small font-medium text-primary-foreground shadow-warm hover:brightness-110"
            >
              Reservar mesa
            </Link>
          </div>
        </div>
      </header>

      <div className="safe-px border-b border-border/60 bg-background/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-start sm:gap-3">
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-1 sm:flex-wrap sm:gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => scrollTo(c.id)}
                disabled={c.dishes.length === 0}
                title={c.name}
                className={`tap-target transition-warm w-full rounded-lg border px-4 py-3 text-left text-small leading-tight sm:w-auto sm:rounded-full sm:px-4 sm:py-1.5 sm:text-center sm:text-xs ${
                  activeCategory === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-gold"
                } ${c.dishes.length === 0 ? "opacity-40" : ""}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="tap-target transition-warm inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/70 px-4 py-2 text-small hover:bg-gold/10 sm:w-auto sm:py-1.5"
          >
            <SlidersHorizontal className="size-4" /> Filtrar alérgenos
            {active.length > 0 && (
              <span className="rounded-full bg-primary px-2 text-primary-foreground">
                {active.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        {!online && (
          <div className="pt-4">
            <OfflineNotice />
          </div>
        )}

        {active.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 py-4 text-small">
            <span className="text-muted-foreground">
              {active.length} {active.length === 1 ? "alérgeno activo" : "alérgenos activos"}
            </span>
            <button
              type="button"
              onClick={() => setActive([])}
              className="transition-warm underline underline-offset-4 hover:text-primary"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {menuDelDia.length > 0 && (
          <section className="mt-8 rounded-lg border border-gold bg-cream p-6 shadow-warm">
            <span className="inline-block rounded-full bg-olive px-4 py-1 text-small font-medium text-cream">
              Menú del Día
            </span>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {menuDelDia.map((d) => (
                <DishCard key={d.id} dish={d} eager />
              ))}
            </div>
          </section>
        )}

        {visibleCategories.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">No hay platos que cumplan estos filtros</p>
            <button
              type="button"
              onClick={() => setActive([])}
              className="transition-warm mt-3 text-small underline underline-offset-4 hover:text-primary"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          visibleCategories.map((c, ci) => (
            <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-24 pt-12">
              <h2 className="font-display text-h2">{c.name}</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {c.dishes.map((d, di) => (
                  <DishCard
                    key={d.id}
                    dish={d}
                    eager={ci === 0 && di < 3 && menuDelDia.length === 0}
                    showMenuBadge
                  />
                ))}
              </div>
            </section>
          ))
        )}

        <section className="mt-16 rounded-lg border border-border bg-cream p-6">
          <h2 className="font-display text-h3">Alérgenos</h2>
          <p className="mt-1 text-small text-muted-foreground">
            Estos son los 14 alérgenos de declaración obligatoria. Usa el filtro de alérgenos para
            ocultar los platos que los contengan.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {ALLERGENS.map((a) => (
              <li
                key={a}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-background px-3 py-1 text-small text-foreground/80"
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                {ALLERGEN_LABELS[a] ?? a}
              </li>
            ))}
          </ul>
        </section>
      </main>

      {filtersOpen && (
        <div className="fixed inset-0 z-40 flex h-[100dvh] justify-end bg-dark-brown/50 p-0">
          <div className="safe-pt safe-pb safe-px h-full w-full max-w-sm overflow-y-auto overscroll-contain bg-cream p-6 shadow-warm-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-h3">Filtrar alérgenos</h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setFiltersOpen(false)}
                className="tap-target transition-warm inline-flex items-center justify-center rounded-full border border-border hover:bg-background"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-small text-muted-foreground">
              Ocultaremos los platos que contengan lo que marques.
            </p>
            <ul className="mt-6 space-y-2">
              {ALLERGENS.map((a) => (
                <li key={a}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 hover:bg-background">
                    <input
                      type="checkbox"
                      checked={active.includes(a)}
                      onChange={() => toggle(a)}
                      className="size-4 accent-[var(--terracota)]"
                    />
                    <span>{ALLERGEN_LABELS[a] ?? a}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between gap-3">
              <span className="text-small text-muted-foreground">
                {active.length} {active.length === 1 ? "alérgeno activo" : "alérgenos activos"}
              </span>
              <button
                type="button"
                onClick={() => setActive([])}
                className="transition-warm text-small underline underline-offset-4 hover:text-primary"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      <CartFab />
      <WhatsAppFab phone={s?.whatsapp_phone} />
      <SiteFooter settings={s} />
    </div>
  );
}
