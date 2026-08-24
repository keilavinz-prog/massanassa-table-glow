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
      { title: "Panel de Administración — El Fogó de Massanassa" },
      {
        name: "description",
        content: "Gestión interna del restaurante: carta, configuración y QR.",
      },
      { property: "og:title", content: "Panel de Administración — El Fogó de Massanassa" },
      { property: "og:description", content: "Área de gerencia de El Fogó de Massanassa." },
    ],
  }),
  component: AdminPage,
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
        <p className="mt-2 text-muted-foreground">El Fogó de Massanassa</p>

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
