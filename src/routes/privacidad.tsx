import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, legalLandingQuery } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/privacidad")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(legalLandingQuery);
  },
  head: () => ({
    meta: [
      { title: "Política de privacidad — Restaurante Chicken Garden" },
      {
        name: "description",
        content:
          "Cómo tratamos tus datos personales en reservas, pedidos y solicitudes de catering: finalidad, base legal, conservación y derechos RGPD.",
      },
      { property: "og:title", content: "Política de privacidad — Restaurante Chicken Garden" },
      {
        property: "og:description",
        content: "Información sobre el tratamiento de datos personales y tus derechos RGPD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center">
      No se pudo cargar la página: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Sin datos.</div>,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad">
      {(s) => (
        <>
          <LegalSection heading="Responsable del tratamiento">
            <p>
              {s.name}, con domicilio en {s.address}, {s.postal_code} {s.city} (Valencia,
              España). Contacto: {s.email ?? "—"} · {s.phone ?? "—"}.
            </p>
          </LegalSection>

          <LegalSection heading="Datos que recogemos y con qué finalidad">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Reservas:</strong> nombre, email, teléfono, fecha, hora, número de
                comensales y notas, para gestionar y confirmar tu mesa.
              </li>
              <li>
                <strong>Pedidos para recogida:</strong> nombre, email, teléfono, notas y
                detalle del pedido, para preparar y confirmar el pedido y su pago.
              </li>
              <li>
                <strong>Solicitudes de catering:</strong> datos de contacto y detalles del
                evento, para elaborar y enviarte un presupuesto.
              </li>
              <li>
                <strong>Cuentas de personal:</strong> email y nombre, para el acceso al panel
                interno.
              </li>
            </ul>
          </LegalSection>

          <LegalSection heading="Base legal">
            <p>
              Ejecución de un contrato o de una solicitud previa (reservas, pedidos y
              presupuestos), consentimiento cuando lo marcas expresamente en el formulario, e
              interés legítimo en la gestión interna del restaurante. Obligaciones fiscales y
              contables para los pedidos abonados.
            </p>
          </LegalSection>

          <LegalSection heading="Destinatarios">
            <p>
              Solo compartimos datos con proveedores necesarios para prestar el servicio:
              alojamiento y base de datos, pasarela de pago (Stripe) para los pedidos,
              proveedor de email transaccional (Resend) para las confirmaciones y, si procede,
              calendario para la agenda de reservas. No vendemos ni cedemos datos a terceros
              con fines publicitarios.
            </p>
          </LegalSection>

          <LegalSection heading="Conservación">
            <p>
              Reservas y solicitudes de catering: hasta 12 meses tras el evento. Pedidos: el
              plazo legal exigido por la normativa fiscal (hasta 6 años). Cuentas internas:
              mientras la persona forme parte del equipo.
            </p>
          </LegalSection>

          <LegalSection heading="Tus derechos">
            <p>
              Puedes solicitar acceso, rectificación, supresión, oposición, limitación y
              portabilidad de tus datos escribiendo a {s.email ?? "el email de contacto"},
              indicando tu petición y un medio para verificar tu identidad. También puedes
              reclamar ante la Agencia Española de Protección de Datos (aepd.es).
            </p>
          </LegalSection>

          <LegalSection heading="Seguridad">
            <p>
              El acceso a los datos está restringido por rol verificado en servidor y por
              reglas de seguridad a nivel de fila en la base de datos. Los datos de reservas,
              pedidos y catering no son accesibles públicamente.
            </p>
          </LegalSection>
        </>
      )}
    </LegalLayout>
  );
}
