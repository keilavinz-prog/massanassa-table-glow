import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, legalLandingQuery } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/cookies")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(legalLandingQuery);
  },
  head: () => ({
    meta: [
      { title: "Política de cookies — El Fogó de Massanassa" },
      {
        name: "description",
        content:
          "Qué almacenamiento usamos en la web: cookies técnicas de sesión y almacenamiento local del carrito. Sin cookies publicitarias ni analítica.",
      },
      { property: "og:title", content: "Política de cookies — El Fogó de Massanassa" },
      {
        property: "og:description",
        content: "Solo usamos almacenamiento técnico necesario. Sin analítica ni publicidad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CookiesPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center">
      No se pudo cargar la página: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Sin datos.</div>,
});

function CookiesPage() {
  return (
    <LegalLayout title="Política de cookies">
      {(s) => (
        <>
          <LegalSection heading="Qué usamos">
            <p>
              Esta web no utiliza cookies publicitarias ni de analítica. Solo empleamos
              almacenamiento técnico necesario para que el servicio funcione:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Sesión de acceso al panel interno</strong> (necesaria, se mantiene
                mientras el personal permanece identificado).
              </li>
              <li>
                <strong>Carrito de pedido</strong> guardado en tu navegador para que no se
                pierda al recargar la página (necesaria, se borra al vaciar el carrito).
              </li>
              <li>
                <strong>Preferencia del aviso de cookies</strong> para no volver a mostrarlo
                (necesaria).
              </li>
              <li>
                <strong>Pasarela de pago</strong>: al pagar, Stripe puede establecer sus
                propias cookies técnicas y antifraude en su dominio.
              </li>
            </ul>
          </LegalSection>

          <LegalSection heading="Cómo eliminarlo">
            <p>
              Puedes borrar este almacenamiento en cualquier momento desde las opciones de
              privacidad de tu navegador. Si lo eliminas, perderás el carrito y tendrás que
              volver a identificarte si eres parte del equipo.
            </p>
          </LegalSection>

          <LegalSection heading="Dudas">
            <p>Escríbenos a {s.email ?? "el email de contacto"} y te ayudamos.</p>
          </LegalSection>
        </>
      )}
    </LegalLayout>
  );
}
