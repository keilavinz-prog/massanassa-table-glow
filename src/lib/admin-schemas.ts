import { z } from "zod";

export const ALLERGENS = [
  "gluten",
  "crustaceos",
  "huevo",
  "pescado",
  "cacahuetes",
  "soja",
  "lacteos",
  "frutos_secos",
  "apio",
  "mostaza",
  "sesamo",
  "sulfitos",
  "moluscos",
  "altramuces",
] as const;

export const ALLERGEN_LABELS: Record<string, string> = {
  gluten: "Gluten",
  crustaceos: "Crustáceos",
  huevo: "Huevo",
  pescado: "Pescado",
  cacahuetes: "Cacahuetes",
  soja: "Soja",
  lacteos: "Lácteos",
  frutos_secos: "Frutos secos",
  apio: "Apio",
  mostaza: "Mostaza",
  sesamo: "Sésamo",
  sulfitos: "Sulfitos",
  moluscos: "Moluscos",
  altramuces: "Altramuces",
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const categoryInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  sort_order: z.number().int().min(0).max(9999),
});

export const dishInputSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid("Selecciona una categoría"),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(600).nullable().optional(),
  price: z.number().min(0, "El precio no puede ser negativo").max(9999),
  allergens: z.array(z.enum(ALLERGENS)).default([]),
  image_url: z.string().trim().max(2000).nullable().optional(),
  is_available: z.boolean().default(true),
  is_menu_del_dia: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(9999).default(0),
});

export const settingsInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  address: z.string().trim().min(1, "La dirección es obligatoria").max(200),
  city: z.string().trim().min(1, "La ciudad es obligatoria").max(100),
  postal_code: z.string().trim().max(10).nullable().optional(),
  phone: z.string().trim().min(1, "El teléfono es obligatorio").max(30),
  whatsapp_phone: z
    .string()
    .trim()
    .regex(/^\d*$/, "Solo dígitos, sin +")
    .max(20)
    .nullable()
    .optional(),
  email: z.string().trim().email("Email no válido").max(255).nullable().optional().or(z.literal("")),
  opening_hours: z.record(z.string().max(40)),
  description: z.string().trim().max(2000).nullable().optional(),
  logo_url: z.string().trim().max(2000).nullable().optional(),
  hero_image_url: z.string().trim().max(2000).nullable().optional(),
  instagram_url: z.string().trim().max(300).nullable().optional(),
  facebook_url: z.string().trim().max(300).nullable().optional(),
  nav_labels: z.record(z.string().trim().max(40)).default({}),
  historia_texto: z.string().trim().max(4000).nullable().optional(),
});

export const uploadInputSchema = z.object({
  bucket: z.enum(["dish-images", "restaurant-assets"]),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  dataBase64: z.string().min(1),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type DishInput = z.infer<typeof dishInputSchema>;
export type SettingsInput = z.infer<typeof settingsInputSchema>;
