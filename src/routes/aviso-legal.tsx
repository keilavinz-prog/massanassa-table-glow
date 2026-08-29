import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, legalLandingQuery } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/aviso-legal")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(legalLandingQuery);
  },
  head: () => ({
    meta: [
      { title: "Aviso legal — RESTAURANTE CHICKEN GARDEN" },
      {
        name: "description",
        content:
          "Datos identificativos del restaurante, condiciones de uso de la web, pedidos para recogida y propiedad intelectual.",
      },
      { property: "og:title", content: "Aviso legal — RESTAURANTE CHICKEN GARDEN" },
      {
        property: "og:description",
        content: "Información legal y condiciones de uso de la web del restaurante.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LegalNoticePage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center">
      No se pudo cargar la página: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Sin datos.</div>,
});

function LegalNoticePage() {
  return (
    <LegalLayout title="Aviso legal">
      {(s) => (
        <>
          <LegalSection heading="Datos identificativos">
            <p>
              Titular: {s.name}. Domicilio: {s.address}, {s.postal_code} {s.city} (Valencia,
              España). Teléfono: {s.phone ?? "—"}. Email: {s.email ?? "—"}.
            </p>
          </LegalSection>

          <LegalSection heading="Objeto y condiciones de uso">
            <p>
              Esta web informa sobre la carta del restaurante y permite solicitar reservas,
              realizar pedidos para recogida y pedir presupuestos de catering. Al utilizarla te
              comprometes a facilitar información veraz y a no hacer un uso que pueda dañar el
              servicio o a terceros.
            </p>
          </LegalSection>

          <LegalSection heading="Reservas, pedidos y precios">
            <p>
              Las reservas se envían como solicitud y quedan confirmadas cuando el restaurante
              las acepta. Los pedidos son exclusivamente para recogida en el local; el precio
              válido es el de la carta en el momento del pago, verificado en servidor. Los
              alérgenos indicados son informativos: si tienes una alergia, comunícalo antes de
              consumir.
            </p>
          </LegalSection>

          <LegalSection heading="Propiedad intelectual">
            <p>
              Los textos, imágenes de platos, logotipo y diseño de esta web pertenecen al
              titular, salvo los mapas, cuya cartografía procede de OpenStreetMap y sus
              colaboradores.
            </p>
          </LegalSection>

          <LegalSection heading="Responsabilidad y legislación aplicable">
            <p>
              No respondemos de interrupciones temporales del servicio ajenas a nuestro
              control. Esta web se rige por la legislación española y los juzgados
              correspondientes al domicilio del titular.
            </p>
          </LegalSection>
        </>
      )}
    </LegalLayout>
  );
}
