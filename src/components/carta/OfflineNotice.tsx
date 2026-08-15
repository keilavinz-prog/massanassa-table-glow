import { WifiOff } from "lucide-react";

/** Aviso discreto y no bloqueante de carta servida desde caché local. */
export function OfflineNotice({ savedAt }: { savedAt?: number }) {
  const when = savedAt
    ? new Date(savedAt).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-2 rounded-md border border-gold/70 bg-gold/15 px-4 py-2 text-small text-dark-brown"
    >
      <WifiOff className="size-4 shrink-0 text-gold" aria-hidden="true" />
      <span>Sin conexión — mostrando la última carta guardada</span>
      {when && <span className="text-muted-foreground">· guardada el {when}</span>}
    </div>
  );
}
