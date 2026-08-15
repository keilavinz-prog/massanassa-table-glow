import { createFileRoute } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/ProtectedHeader";
import { requireRole } from "@/lib/route-guard";
import { ReservationsSection } from "@/components/equipo/ReservationsSection";

export const Route = createFileRoute("/equipo")({
  ssr: false,
  beforeLoad: () => requireRole(["admin", "empleado"]),
  head: () => ({
    meta: [
      { title: "Zona de Equipo — El Fogó de Massanassa" },
      {
        name: "description",
        content: "Vista operativa del equipo de sala: reservas y pedidos del día.",
      },
      { property: "og:title", content: "Zona de Equipo — El Fogó de Massanassa" },
      { property: "og:description", content: "Área de trabajo diario del equipo del restaurante." },
    ],
  }),
  component: EquipoPage,
});

function EquipoPage() {
  const { user } = Route.useRouteContext();
  return (
    <ProtectedShell user={user} title="Zona de Equipo">
      <p className="font-display text-h3 text-foreground">
        Hola, {user.full_name ?? user.email}
      </p>
      <p className="mt-1 mb-8 text-muted-foreground">
        Reservas del día: confirma, rechaza, modifica o cancela.
      </p>
      <ReservationsSection />
    </ProtectedShell>
  );
}
