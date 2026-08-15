import { Link } from "@tanstack/react-router";

/**
 * Consentimiento informado RGPD para formularios públicos.
 * Bloquea el envío en cliente hasta que el usuario acepta la política.
 */
export function ConsentCheckbox({
  checked,
  onChange,
  purpose,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  purpose: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-gold/40 bg-card p-3 text-small text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-[var(--color-terracota)]"
        aria-label="Acepto la política de privacidad"
      />
      <span>
        Acepto el tratamiento de mis datos para {purpose}. Consulta la{" "}
        <Link
          to="/privacidad"
          className="font-medium text-primary underline underline-offset-4"
        >
          política de privacidad
        </Link>
        .
      </span>
    </label>
  );
}
