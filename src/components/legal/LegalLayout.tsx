import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getLandingData } from "@/lib/restaurant.functions";
import { SiteFooter } from "@/components/SiteFooter";

export const legalLandingQuery = queryOptions({
  queryKey: ["landing"],
  queryFn: () => getLandingData(),
});

export function LegalLayout({
  title,
  updated = "15 de agosto de 2026",
  children,
}: {
  title: string;
  updated?: string;
  children: (settings: {
    name?: string | null;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
    email?: string | null;
    phone?: string | null;
  }) => ReactNode;
}) {
  const { data } = useSuspenseQuery(legalLandingQuery);
  const s = data.settings;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gold/30 bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="font-display text-h3 text-foreground">{s?.name}</span>
          <Link
            to="/"
            className="transition-warm inline-flex items-center gap-2 text-small text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-h1 text-foreground">{title}</h1>
        <p className="mt-2 text-small text-muted-foreground">
          Última actualización: {updated}
        </p>
        <div className="legal-prose mt-8 space-y-6 text-body text-foreground/90">
          {children(s ?? {})}
        </div>
      </main>

      <SiteFooter settings={s} />
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-h3 text-foreground">{heading}</h2>
      <div className="mt-2 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}
