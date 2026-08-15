import { Link } from "@tanstack/react-router";
import { Facebook, Instagram } from "lucide-react";

export type FooterSettings = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
} | null;

export function SiteFooter({ settings: s }: { settings: FooterSettings }) {
  return (
    <footer className="bg-dark-brown text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-h3 text-gold">{s?.name}</h3>
          <p className="mt-2 text-small text-cream/80">
            {s?.address}
            <br />
            {s?.postal_code} {s?.city}
          </p>
        </div>
        <div className="text-small text-cream/80">
          <p className="eyebrow text-gold">Contacto</p>
          <p className="mt-2">{s?.phone}</p>
          <p>{s?.email}</p>
        </div>
        <div className="text-small">
          <p className="eyebrow text-gold">Síguenos</p>
          <div className="mt-3 flex gap-3">
            {s?.instagram_url && (
              <a
                href={s.instagram_url}
                aria-label="Instagram"
                className="transition-warm rounded-full border border-cream/30 p-2 hover:bg-cream/10"
              >
                <Instagram className="size-4" />
              </a>
            )}
            {s?.facebook_url && (
              <a
                href={s.facebook_url}
                aria-label="Facebook"
                className="transition-warm rounded-full border border-cream/30 p-2 hover:bg-cream/10"
              >
                <Facebook className="size-4" />
              </a>
            )}
          </div>
          <Link
            to="/catering"
            className="transition-warm mt-6 block text-small text-cream/80 underline-offset-4 hover:text-gold hover:underline"
          >
            ¿Organizas un evento? Solicita presupuesto
          </Link>
          <Link
            to="/login"
            className="transition-warm mt-3 inline-block text-small text-cream/60 underline-offset-4 hover:text-gold hover:underline"
          >
            Acceso equipo
          </Link>
        </div>
      </div>
      <div className="border-t border-cream/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-5 text-small text-cream/60">
          <Link to="/aviso-legal" className="transition-warm hover:text-gold">
            Aviso legal
          </Link>
          <Link to="/privacidad" className="transition-warm hover:text-gold">
            Política de privacidad
          </Link>
          <Link to="/cookies" className="transition-warm hover:text-gold">
            Política de cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}
