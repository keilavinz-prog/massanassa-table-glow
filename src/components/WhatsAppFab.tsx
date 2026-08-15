const MESSAGE = "Hola, quiero hacer una consulta sobre El Fogó de Massanassa 🍽️";

export function WhatsAppFab({ phone }: { phone?: string | null | undefined }) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}?text=${encodeURIComponent(MESSAGE)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="transition-warm fixed bottom-6 left-6 z-40 flex size-14 items-center justify-center rounded-full shadow-warm hover:brightness-110"
      style={{ backgroundColor: "#25D366" }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 fill-white">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.02c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.07 8.07 0 0 1-1.24-4.24c0-4.47 3.64-8.11 8.12-8.11 4.47 0 8.1 3.64 8.1 8.11 0 4.48-3.63 8.11-8.1 8.11Zm4.47-6.07c-.24-.12-1.45-.71-1.67-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.35-1.69-.14-.25-.02-.38.1-.5.11-.11.24-.28.36-.42.12-.14.16-.25.24-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.75-1.82-.2-.47-.4-.41-.55-.42h-.47c-.16 0-.41.06-.63.31-.22.25-.83.81-.83 1.98s.85 2.3.97 2.46c.12.16 1.67 2.61 4.06 3.57.57.24 1.01.39 1.36.5.57.18 1.09.16 1.5.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
      </svg>
    </a>
  );
}
