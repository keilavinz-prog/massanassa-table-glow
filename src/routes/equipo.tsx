import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/ProtectedHeader";
import { requireRole } from "@/lib/route-guard";
import { ReservationsSection } from "@/components/equipo/ReservationsSection";
import { ActiveOrdersCard, OrdersSection } from "@/components/equipo/OrdersSection";

export const Route = createFileRoute("/equipo")({
  ssr: false,
  beforeLoad: () => requireRole(["admin", "empleado"]),
  head: () => ({
    meta: [
      { title: "Zona de Equipo — RESTAURANTE CHICKEN GARDEN" },
      {
        name: "description",
        content: "Vista operativa del equipo de sala: reservas y pedidos del día.",
      },
      { property: "og:title", content: "Zona de Equipo — RESTAURANTE CHICKEN GARDEN" },
      { property: "og:description", content: "Área de trabajo diario del equipo del restaurante." },
    ],
  }),
  component: EquipoPage,
});

const TABS = [
  { id: "reservas", label: "Reservas" },
  { id: "pedidos", label: "Pedidos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function EquipoPage() {
  const { user } = Route.useRouteContext();
  const [tab, setTab] = useState<TabId>("reservas");

  return (
    <ProtectedShell user={user} title="Zona de Equipo">
      <p className="font-display text-h3 text-foreground">
        Hola, {user.full_name ?? user.email}
      </p>
      <p className="mt-1 mb-8 text-muted-foreground">
        Reservas y pedidos del día, actualizados en vivo.
      </p>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-border/70 pb-3">
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

      {tab === "reservas" ? (
        <ReservationsSection
          extraSummary={<ActiveOrdersCard onSelect={() => setTab("pedidos")} />}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
            <ActiveOrdersCard />
          </div>
          <OrdersSection />
        </>
      )}
    </ProtectedShell>
  );
}
