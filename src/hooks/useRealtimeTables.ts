import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Suscribe el componente a cambios de Postgres (Realtime) sobre las tablas
 * indicadas y ejecuta `onChange` en cada INSERT/UPDATE/DELETE. La suscripción
 * se cierra al desmontar.
 */
export function useRealtimeTables(tables: string[], onChange: () => void) {
  const key = tables.join(",");

  useEffect(() => {
    const list = key.split(",").filter(Boolean);
    if (list.length === 0) return;

    const channel = supabase.channel(`chicken-garden-realtime-${key}-${Math.random().toString(36).slice(2)}`);
    for (const table of list) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => onChange(),
      );
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // onChange se mantiene estable mediante useCallback en el consumidor
  }, [key, onChange]);
}
