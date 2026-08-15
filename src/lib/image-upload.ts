import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "./admin-schemas";

export type ImageBucket = "dish-images" | "restaurant-assets";

export function validateImageFile(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Formato no permitido. Usa JPG, PNG o WEBP.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "La imagen supera el máximo de 5MB.";
  return null;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}
