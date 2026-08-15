import { createFileRoute } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/ProtectedHeader";
import { requireRole } from "@/lib/route-guard";

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

function AdminPage() {
  const { user } = Route.useRouteContext();
  return (
    <ProtectedShell user={user} title="Panel de Administración — El Fogó de Massanassa">
      <p>Próximamente: gestión de carta, configuración y QR (Fase 3)</p>
    </ProtectedShell>
  );
}
