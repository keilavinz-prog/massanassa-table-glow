import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./BrandLogo";
import type { RestaurantSettings } from "@/lib/restaurant.functions";

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/carta", label: "Carta" },
  { to: "/restaurantes", label: "Restaurantes" },
  { to: "/reservar", label: "Reservar" },
  { to: "/catering", label: "Catering" },
] as const;

export function SiteHeader({
  settings,
  ctaLabel,
}: {
  settings: RestaurantSettings | null;
  ctaLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <BrandLogo />
          <span className="font-display text-h3 font-semibold leading-none">
            {settings?.name ?? "RESTAURANTE CHICKEN GARDEN"}
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="flex flex-wrap items-center gap-1"
        >
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{
                className:
                  "bg-primary text-primary-foreground shadow-warm",
              }}
              inactiveProps={{
                className:
                  "border border-transparent text-foreground hover:bg-accent/20 hover:border-input",
              }}
              activeOptions={{ exact: true }}
              className="transition-warm rounded-md px-3 py-2 text-small font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {ctaLabel && (
          <Link
            to="/reservar"
            className="transition-warm inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-warm hover:brightness-110"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
