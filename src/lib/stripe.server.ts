/**
 * Integración Stripe usando la API REST (sin SDK Node, compatible con el
 * runtime Worker).
 *
 * SUPUESTO: si STRIPE_SECRET_KEY no está configurado, la creación de sesión
 * falla de forma controlada con un mensaje claro; no se simula ningún pago.
 * Si STRIPE_WEBHOOK_SECRET falta, el webhook rechaza las peticiones (401).
 */

export type StripeLineItem = { name: string; unitAmount: number; quantity: number };

export class PaymentsUnavailableError extends Error {
  constructor() {
    super("Pagos no disponibles en este entorno de demostración");
    this.name = "PaymentsUnavailableError";
  }
}

export function stripeConfigured() {
  return Boolean(process.env["STRIPE_SECRET_KEY"]);
}

export async function createCheckoutSession(input: {
  lineItems: StripeLineItem[];
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<{ id: string; url: string }> {
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  if (!secretKey) throw new PaymentsUnavailableError();

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", input.successUrl);
  params.set("cancel_url", input.cancelUrl);
  params.set("customer_email", input.customerEmail);
  input.lineItems.forEach((item, index) => {
    params.set(`line_items[${index}][quantity]`, String(item.quantity));
    params.set(`line_items[${index}][price_data][currency]`, "eur");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmount));
    params.set(`line_items[${index}][price_data][product_data][name]`, item.name);
  });
  for (const [key, value] of Object.entries(input.metadata)) {
    params.set(`metadata[${key}]`, value);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const body = await response.text();
  if (!response.ok) {
    console.error(`[stripe] Checkout Session falló [${response.status}]: ${body}`);
    throw new Error(`Stripe rechazó la solicitud de pago [${response.status}]`);
  }

  const session = JSON.parse(body) as { id?: string; url?: string };
  if (!session.id || !session.url) throw new Error("Stripe no devolvió una sesión válida.");
  return { id: session.id, url: session.url };
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verifica la firma `Stripe-Signature` (esquema v1, HMAC-SHA256). */
export async function verifyStripeSignature(
  payload: string,
  header: string | null,
): Promise<boolean> {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret || !header) return false;

  const parts = header.split(",").map((p) => p.trim().split("="));
  const timestamp = parts.find((p) => p[0] === "t")?.[1];
  const signatures = parts.filter((p) => p[0] === "v1").map((p) => p[1] ?? "");
  if (!timestamp || signatures.length === 0) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signatures.some((s) => timingSafeEqual(s, expected));
}
