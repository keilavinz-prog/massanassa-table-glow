import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedHeader } from "@/components/ProtectedHeader";
import { requireRole } from "@/lib/route-guard";
import { CartaSection } from "@/components/admin/CartaSection";
import { RestauranteSection } from "@/components/admin/RestauranteSection";
import { QrSection } from "@/components/admin/QrSection";
import { CateringSection } from "@/components/admin/CateringSection";
import { LandingSection } from "@/components/admin/LandingSection";
import { UsuariosSection } from "@/components/admin/UsuariosSection";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: () => requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Panel de Administración — RESTAURANTE CHICKEN GARDEN" },
      {
        name: "description",
        content: "Gestión interna del restaurante: carta, configuración y QR.",
      },
      { property: "og:title", content: "Panel de Administración — RESTAURANTE CHICKEN GARDEN" },
      { property: "og:description", content: "Área de gerencia de RESTAURANTE CHICKEN GARDEN." },
    ],
  }),
  component: AdminPage,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md space-y-4 rounded-md bg-card p-8 text-center shadow-warm">
        <h1 className="font-display text-h3">No se pudo cargar el panel</h1>
        <p className="text-small text-muted-foreground">
          {error instanceof Error ? error.message : "Error inesperado."}
        </p>
        <a
          href="/login"
          className="tap-target transition-warm inline-flex items-center justify-center rounded-md bg-terracota px-5 py-2.5 text-body font-medium text-white hover:opacity-90"
        >
          Volver a iniciar sesión
        </a>
      </div>
    </div>
  ),
});

const TABS = [
  { id: "carta", label: "Carta" },
  { id: "landing", label: "Portada" },
  { id: "restaurante", label: "Restaurante" },
  { id: "qr", label: "Código QR" },
  { id: "catering", label: "Catering" },
  { id: "usuarios", label: "Usuarios" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AdminPage() {
  const { user } = Route.useRouteContext();
  const [tab, setTab] = useState<TabId>("carta");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProtectedHeader user={user} />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-h1">Panel de Administración</h1>
        <p className="mt-2 text-muted-foreground">RESTAURANTE CHICKEN GARDEN</p>

        <nav className="mt-8 flex flex-wrap gap-2 border-b border-border/70 pb-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`transition-warm rounded-md px-4 py-2 text-body font-medium ${
                tab === t.id
                  ? "bg-terracota text-white shadow-warm"
                  : "border border-input bg-background hover:bg-accent/20"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-8">
          {tab === "carta" && <CartaSection />}
          {tab === "landing" && <LandingSection />}
          {tab === "restaurante" && <RestauranteSection />}
          {tab === "qr" && <QrSection />}
          {tab === "catering" && <CateringSection />}
          {tab === "usuarios" && <UsuariosSection />}
        </div>
      </main>
    </div>
  );
}
