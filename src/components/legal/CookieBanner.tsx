import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "fogo-cookie-consent";

/**
 * Banner de cookies informativo (RGPD/LSSI). No hay proveedor de analítica
 * conectado: solo se usan cookies técnicas necesarias, por lo que la decisión
 * se guarda localmente para no volver a mostrar el aviso.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // Almacenamiento no disponible: no se muestra el aviso.
    }
  }, []);

  function decide(value: "accepted" | "essential") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignorado
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-lg border border-gold/50 bg-card p-4 shadow-warm sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-muted-foreground">
          Usamos solo cookies técnicas necesarias para el funcionamiento de la web
          (sesión y carrito). Más información en{" "}
          <Link to="/cookies" className="font-medium text-primary underline underline-offset-4">
            política de cookies
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("essential")}
            className="transition-warm rounded-md border border-border px-4 py-2 text-small font-medium hover:bg-muted"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="transition-warm rounded-md bg-primary px-4 py-2 text-small font-medium text-primary-foreground hover:brightness-110"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
