import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/acceso-denegado")({
  head: () => ({
    meta: [
      { title: "Acceso denegado — RESTAURANTE CHICKEN GARDEN" },
      {
        name: "description",
        content: "No tienes permisos para ver esta sección del área privada.",
      },
      { property: "og:title", content: "Acceso denegado — RESTAURANTE CHICKEN GARDEN" },
      {
        property: "og:description",
        content: "Tu cuenta no tiene permisos para esta sección del restaurante.",
      },
    ],
  }),
  component: AccessDenied,
});

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-md bg-cream p-8 text-center shadow-warm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ShieldAlert className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-h2">Acceso denegado</h1>
        <p className="mt-2 text-muted-foreground">
          No tienes permisos para ver esta sección
        </p>
        <Link
          to="/login"
          className="transition-warm mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110"
        >
          Volver al acceso
        </Link>
      </div>
    </div>
  );
}
