import { createFileRoute } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/ProtectedHeader";
import { requireRole } from "@/lib/route-guard";
import { CateringProviderPanel } from "@/components/proveedor/CateringProviderPanel";

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
      <p className="mt-1 mb-8 text-muted-foreground">
        Toma solicitudes de catering libres y actualiza el estado de las tuyas.
      </p>
      <CateringProviderPanel />
    </ProtectedShell>
  );
}
