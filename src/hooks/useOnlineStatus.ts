import { useEffect, useState } from "react";

/**
 * Devuelve `true` si el navegador tiene conexión. Durante SSR y antes de la
 * hidratación asume `true` para no renderizar avisos que luego desaparecen.
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}
