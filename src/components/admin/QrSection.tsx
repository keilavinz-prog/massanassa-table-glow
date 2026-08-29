import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import QRCode from "qrcode";
import { getAdminSettings } from "@/lib/admin.functions";

const primaryBtn =
  "transition-warm inline-flex items-center gap-2 rounded-md bg-terracota px-5 py-2.5 text-body font-medium text-white hover:opacity-90 disabled:opacity-60";
const ghostBtn =
  "transition-warm inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-body hover:bg-accent/20";

export function QrSection() {
  const fetchSettings = useServerFn(getAdminSettings);
  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => fetchSettings(),
    throwOnError: true,
  });

  const [menuUrl, setMenuUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/carta`;
    setMenuUrl(url);
    void QRCode.toDataURL(url, {
      width: 720,
      margin: 1,
      color: { dark: "#3B2417", light: "#FDF6EC" },
    }).then(setQrDataUrl);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  async function downloadPdf() {
    if (!qrDataUrl) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    doc.setFillColor(253, 246, 236);
    doc.rect(0, 0, w, h, "F");
    doc.setDrawColor(201, 162, 39);
    doc.setLineWidth(1.2);
    doc.rect(8, 8, w - 16, h - 16);

    doc.setTextColor(59, 36, 23);
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text(settings?.name ?? "Restaurante Chicken Garden", w / 2, 28, { align: "center" });

    const qrSize = 78;
    doc.addImage(qrDataUrl, "PNG", (w - qrSize) / 2, 40, qrSize, qrSize);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(193, 68, 14);
    doc.text("Escanea para ver nuestra carta digital", w / 2, 132, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(59, 36, 23);
    const footer = [settings?.address, settings?.city, settings?.phone]
      .filter(Boolean)
      .join(" · ");
    doc.text(footer || "Massanassa (Valencia)", w / 2, h - 18, { align: "center" });

    doc.save("carta-qr-el-fogo-de-massanassa.pdf");
    toast.success("PDF descargado");
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-h2">Código QR</h2>
      <p className="text-muted-foreground">
        Este QR enlaza con la carta digital pública: <span className="font-medium">{menuUrl}</span>
      </p>

      <div className="flex justify-center">
        <div className="rounded-lg border-2 border-gold bg-cream p-6 shadow-warm">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Código QR de la carta digital" className="size-64" />
          ) : (
            <div className="size-64 animate-pulse rounded-md bg-muted/70" />
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className={primaryBtn} onClick={() => void downloadPdf()}>
          <Download className="size-4" /> Descargar PDF
        </button>
        <button type="button" className={ghostBtn} onClick={() => void copyLink()}>
          <Copy className="size-4" /> Copiar enlace
        </button>
      </div>
    </div>
  );
}
