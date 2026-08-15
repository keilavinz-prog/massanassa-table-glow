import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function LocationMapCanvas({
  lat,
  lng,
  name,
  addressLine,
}: {
  lat: number;
  lng: number;
  name: string;
  addressLine: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const map = L.map(node, { scrollWheelZoom: false }).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.marker([lat, lng], { icon: defaultIcon })
      .addTo(map)
      .bindPopup(`<strong>${name}</strong><br/>${addressLine}`, { autoClose: false })
      .openPopup();

    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
    };
  }, [lat, lng, name, addressLine]);

  return (
    <div
      ref={containerRef}
      aria-label={`Mapa de ubicación de ${name}`}
      className="h-[320px] w-full md:h-[400px]"
    />
  );
}
