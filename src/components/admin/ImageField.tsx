import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { uploadImage } from "@/lib/admin.functions";
import { fileToBase64, validateImageFile, type ImageBucket } from "@/lib/image-upload";

export function ImageField({
  bucket,
  value,
  onChange,
  label,
}: {
  bucket: ImageBucket;
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
}) {
  const upload = useServerFn(uploadImage);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setBusy(true);
    try {
      const dataBase64 = await fileToBase64(file);
      const result = await upload({
        data: {
          bucket,
          fileName: file.name,
          contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
          dataBase64,
        },
      });
      onChange(result.url);
      toast.success("Imagen subida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-small font-medium">{label}</span>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className="transition-warm flex items-center gap-4 rounded-md border border-dashed border-border bg-cream/60 p-3"
      >
        {value ? (
          <img
            src={value}
            alt={label}
            className="size-20 rounded-sm object-cover shadow-warm"
            loading="lazy"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-sm bg-muted text-muted-foreground">
            <ImagePlus className="size-5" />
          </div>
        )}
        <div className="space-y-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => void handleFile(e.target.files?.[0])}
            className="block w-full text-small file:mr-3 file:rounded-sm file:border-0 file:bg-terracota file:px-3 file:py-1.5 file:text-white"
          />
          <p className="text-small text-muted-foreground">
            {busy ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Subiendo…
              </span>
            ) : (
              "JPG, PNG o WEBP · máx. 5MB · arrastra y suelta"
            )}
          </p>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-small text-terracota underline"
            >
              Quitar imagen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
