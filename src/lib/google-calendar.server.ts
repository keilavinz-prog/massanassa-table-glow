/**
 * Sincronización con Google Calendar.
 *
 * SUPUESTO: si faltan los secrets (GOOGLE_CALENDAR_CLIENT_ID,
 * GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN,
 * GOOGLE_CALENDAR_ID) la función NO falla: devuelve null y la reserva se
 * confirma con google_calendar_event_id = null. No hay flujo OAuth
 * interactivo: el refresh token se genera manualmente fuera de la app.
 */

export type CalendarReservation = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  notes: string | null;
};

const TIME_ZONE = "Europe/Madrid";
const DURATION_MINUTES = 90;

function readConfig() {
  const clientId = process.env["GOOGLE_CALENDAR_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CALENDAR_CLIENT_SECRET"];
  const refreshToken = process.env["GOOGLE_CALENDAR_REFRESH_TOKEN"];
  const calendarId = process.env["GOOGLE_CALENDAR_ID"];
  if (!clientId || !clientSecret || !refreshToken || !calendarId) return null;
  return { clientId, clientSecret, refreshToken, calendarId };
}

function endTime(date: string, time: string): { start: string; end: string } {
  const hhmm = time.slice(0, 5);
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + DURATION_MINUTES;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${date}T${hhmm}:00`,
    end: `${date}T${pad(endH)}:${pad(endM)}:00`,
  };
}

/** Crea el evento y devuelve su id, o null si no hay credenciales / falla. */
export async function createCalendarEvent(
  reservation: CalendarReservation,
): Promise<string | null> {
  const config = readConfig();
  if (!config) {
    console.info("[google-calendar] Secrets no configurados: modo stub, sin evento.");
    return null;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!tokenRes.ok) {
      console.error(
        `[google-calendar] Refresh token falló [${tokenRes.status}]: ${await tokenRes.text()}`,
      );
      return null;
    }
    const { access_token: accessToken } = (await tokenRes.json()) as {
      access_token?: string;
    };
    if (!accessToken) return null;

    const { start, end } = endTime(
      reservation.reservation_date,
      reservation.reservation_time,
    );

    const eventRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        config.calendarId,
      )}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `Reserva: ${reservation.customer_name} (${reservation.party_size} pax)`,
          description: [
            `Teléfono: ${reservation.customer_phone}`,
            `Email: ${reservation.customer_email}`,
            `Comensales: ${reservation.party_size}`,
            reservation.notes ? `Notas: ${reservation.notes}` : "Notas: —",
          ].join("\n"),
          start: { dateTime: start, timeZone: TIME_ZONE },
          end: { dateTime: end, timeZone: TIME_ZONE },
        }),
      },
    );

    if (!eventRes.ok) {
      console.error(
        `[google-calendar] Creación de evento falló [${eventRes.status}]: ${await eventRes.text()}`,
      );
      return null;
    }

    const event = (await eventRes.json()) as { id?: string };
    return event.id ?? null;
  } catch (error) {
    console.error("[google-calendar] Error inesperado:", error);
    return null;
  }
}
