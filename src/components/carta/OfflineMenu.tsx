import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { readMenuCache } from "@/lib/menu-cache";
import { DishCard } from "@/components/carta/DishCard";
import { OfflineNotice } from "@/components/carta/OfflineNotice";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Fallback de /carta cuando la carga falla (típicamente sin conexión).
 * Muestra la última carta guardada en modo solo lectura, sin funciones de
 * pedido. Si no hay caché disponible, informa del error.
 */
export function OfflineMenu({ message }: { message?: string }) {
  const cached = readMenuCache();

  if (!cached) {
    return (
      <div role="alert" className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-h2">No se pudo cargar la carta</h1>
        <p className="mt-3 text-muted-foreground">
          {message ?? "Comprueba tu conexión e inténtalo de nuevo."}
        </p>
        <Link
          to="/"
          className="transition-warm tap-target mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
        >
          <ArrowLeft className="size-4" /> Volver al inicio
        </Link>
      </div>
    );
  }

  const { settings, categories } = cached.data;
  const visible = categories.filter((c) => c.dishes.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="safe-pt safe-px sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <span className="font-display text-h3 font-semibold leading-none">
              {settings?.name ?? "RESTAURANTE CHICKEN GARDEN"}
            </span>
          </div>
          <Link
            to="/"
            className="transition-warm tap-target inline-flex items-center gap-2 rounded-sm px-3 text-small text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <div className="pt-4">
          <OfflineNotice savedAt={cached.savedAt} />
        </div>
        {visible.map((c) => (
          <section key={c.id} className="pt-12">
            <h2 className="font-display text-h2">{c.name}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {c.dishes.map((d) => (
                <DishCard key={d.id} dish={d} readOnly showMenuBadge />
              ))}
            </div>
          </section>
        ))}
      </main>

      <SiteFooter settings={settings} />
    </div>
  );
}
