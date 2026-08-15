import { createFileRoute } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/ProtectedHeader";
import { requireRole } from "@/lib/route-guard";

export const Route = createFileRoute("/proveedor")({
  ssr: false,
  beforeLoad: () => requireRole(["proveedor"]),
  head: () => ({
    meta: [
      { title: "Panel de Proveedor — El Fogó de Massanassa" },
      {
        name: "description",
        content: "Área de proveedores: solicitudes de catering y eventos del restaurante.",
      },
      { property: "og:title", content: "Panel de Proveedor — El Fogó de Massanassa" },
      { property: "og:description", content: "Espacio privado para proveedores colaboradores." },
    ],
  }),
  component: ProveedorPage,
});

function ProveedorPage() {
  const { user } = Route.useRouteContext();
  return (
    <ProtectedShell user={user} title="Panel de Proveedor">
      <p className="font-display text-h3 text-foreground">
        Hola, {user.full_name ?? user.email}
      </p>
      <p className="mt-2">Próximamente: solicitudes de catering y eventos (Fase 7)</p>
    </ProtectedShell>
  );
}
