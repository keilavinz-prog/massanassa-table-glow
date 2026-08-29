import { Suspense, lazy, useEffect, useState } from "react";

const MapCanvas = lazy(() => import("./LocationMapCanvas"));

export type MapSettings = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
} | null;

function MapSkeleton() {
  return (
    <div className="h-[320px] w-full animate-pulse rounded-md bg-muted md:h-[400px]" />
  );
}

export function LocationMap({ settings }: { settings: MapSettings }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lat = settings?.lat != null ? Number(settings.lat) : null;
  const lng = settings?.lng != null ? Number(settings.lng) : null;
  if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const addressLine = [settings?.address, settings?.postal_code, settings?.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <div className="overflow-hidden rounded-md border border-border/70 shadow-warm">
        {mounted ? (
          <Suspense fallback={<MapSkeleton />}>
            <MapCanvas
              lat={lat}
              lng={lng}
              name={settings?.name ?? "El Fogó de Massanassa"}
              addressLine={addressLine}
            />
          </Suspense>
        ) : (
          <MapSkeleton />
        )}
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-warm mt-4 inline-flex items-center gap-2 rounded-md border border-primary px-6 py-3 font-medium text-primary hover:bg-primary/10"
      >
        Cómo llegar
      </a>
    </div>
  );
}
