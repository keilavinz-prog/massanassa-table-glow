/**
 * Envío de emails transaccionales vía Resend.
 *
 * SUPUESTO: si RESEND_API_KEY no está configurado, no se rompe ningún flujo:
 * se registra el intento en logs y se devuelve { sent: false }. El pedido /
 * reserva se confirma igualmente.
 * SUPUESTO: remitente `onboarding@resend.dev` (dominio de pruebas de Resend)
 * mientras no haya dominio propio verificado. Ese remitente solo entrega al
 * email del titular de la cuenta de Resend.
 */

const FROM = "El Fogó de Massanassa <onboarding@resend.dev>";

export type EmailResult = { sent: boolean; reason?: string };

async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.info(
      `[emails] RESEND_API_KEY no configurado: modo stub. Email no enviado a ${to} ("${subject}").`,
    );
    return { sent: false, reason: "missing_api_key" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[emails] Resend falló [${response.status}]: ${body}`);
      return { sent: false, reason: `resend_error_${response.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error("[emails] Error inesperado enviando email:", error);
    return { sent: false, reason: "unexpected_error" };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(title: string, body: string) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#3B2417">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <h1 style="font-size:24px;color:#C1440E;margin:0 0 16px">${escapeHtml(title)}</h1>
    ${body}
    <p style="font-size:13px;color:#6B7A3A;margin-top:32px">El Fogó de Massanassa</p>
  </div></body></html>`;
}

export type OrderEmailItem = { name: string; quantity: number; price: number };

export async function sendOrderConfirmationEmail(input: {
  to: string;
  customer_name: string;
  items: OrderEmailItem[];
  total: number;
  address: string;
  city: string;
}): Promise<EmailResult> {
  const rows = input.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${escapeHtml(i.name)} × ${i.quantity}</td><td style="padding:6px 0;text-align:right">${(
          i.price * i.quantity
        ).toFixed(2)} €</td></tr>`,
    )
    .join("");

  const body = `
    <p style="font-size:16px">Hola ${escapeHtml(input.customer_name)}, hemos recibido tu pago. ¡Tu pedido está confirmado!</p>
    <table style="width:100%;border-collapse:collapse;font-size:16px">${rows}
      <tr><td style="padding:12px 0;border-top:1px solid #C9A227;font-weight:bold">Total</td>
      <td style="padding:12px 0;border-top:1px solid #C9A227;text-align:right;font-weight:bold;color:#C1440E">${input.total.toFixed(2)} €</td></tr>
    </table>
    <p style="font-size:16px">Recógelo en ${escapeHtml(input.address)}, ${escapeHtml(input.city)}.</p>`;

  return sendEmail(
    input.to,
    "Tu pedido en El Fogó de Massanassa está confirmado",
    shell("¡Pedido confirmado!", body),
  );
}

export async function sendReservationConfirmationEmail(input: {
  to: string;
  customer_name: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  address: string;
  city: string;
}): Promise<EmailResult> {
  const body = `
    <p style="font-size:16px">Hola ${escapeHtml(input.customer_name)}, tu mesa está reservada.</p>
    <ul style="font-size:16px;padding-left:18px">
      <li>Fecha: ${escapeHtml(input.reservation_date)}</li>
      <li>Hora: ${escapeHtml(input.reservation_time.slice(0, 5))}</li>
      <li>Comensales: ${input.party_size}</li>
    </ul>
    <p style="font-size:16px">Te esperamos en ${escapeHtml(input.address)}, ${escapeHtml(input.city)}.</p>`;

  return sendEmail(
    input.to,
    "Tu reserva en El Fogó de Massanassa está confirmada",
    shell("¡Reserva confirmada!", body),
  );
}
