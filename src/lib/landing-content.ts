import { z } from "zod";

/** Textos editables de la landing. Se guardan en restaurant_settings.landing_content. */
export const landingContentSchema = z.object({
  header_cta_label: z.string().trim().max(60),
  hours_label: z.string().trim().max(40),
  hours_prefix: z.string().trim().max(60),
  closed_note: z.string().trim().max(60),
  hero_title: z.string().trim().max(160),
  hero_image_alt: z.string().trim().max(160),
  about_eyebrow: z.string().trim().max(60),
  about_title: z.string().trim().max(120),
  location_eyebrow: z.string().trim().max(60),
  location_title: z.string().trim().max(120),
  catering_eyebrow: z.string().trim().max(60),
  catering_title: z.string().trim().max(140),
  catering_body: z.string().trim().max(1200),
  catering_cta_label: z.string().trim().max(80),
  menu_eyebrow: z.string().trim().max(60),
  menu_title: z.string().trim().max(120),
  menu_cta_label: z.string().trim().max(80),
  seo_title: z.string().trim().max(70),
  seo_description: z.string().trim().max(170),
});

export type LandingContent = z.infer<typeof landingContentSchema>;

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  header_cta_label: "Reservar mesa",
  hours_label: "Horario",
  hours_prefix: "Martes a domingo",
  closed_note: "Lunes cerrado",
  hero_title: "Cocina valenciana de mercado en Massanassa",
  hero_image_alt: "Arroz valenciano recién hecho en paella",
  about_eyebrow: "Sobre nosotros",
  about_title: "La taberna del barrio",
  location_eyebrow: "Cómo llegar",
  location_title: "Dónde estamos",
  catering_eyebrow: "Catering y eventos",
  catering_title: "Llevamos la paella a tu celebración",
  catering_body:
    "Bodas, comuniones, cumpleaños y eventos de empresa con nuestros arroces en paella de leña y la cocina de siempre. Preparamos una propuesta a medida según fecha, número de invitados y presupuesto.",
  catering_cta_label: "¿Organizas un evento? Solicita presupuesto",
  menu_eyebrow: "Nuestra carta",
  menu_title: "Categorías",
  menu_cta_label: "Ver la carta digital",
  seo_title: "RESTAURANTE CHICKEN GARDEN — Cocina valenciana de mercado",
  seo_description:
    "Taberna valenciana en Massanassa: arroces en paella de leña, pollo asado para llevar y cocina de mercado.",
};

/** Mezcla lo guardado con los valores por defecto: nunca deja huecos en la landing. */
export function resolveLandingContent(raw: unknown): LandingContent {
  const source = (raw ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_LANDING_CONTENT } as Record<string, string>;
  for (const key of Object.keys(DEFAULT_LANDING_CONTENT)) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) out[key] = value;
  }
  return out as unknown as LandingContent;
}

/** Etiquetas de los campos agrupadas por bloque, para el formulario de admin. */
export const LANDING_FIELD_GROUPS: Array<{
  title: string;
  fields: Array<{ key: keyof LandingContent; label: string; multiline?: boolean }>;
}> = [
  {
    title: "Cabecera",
    fields: [
      { key: "header_cta_label", label: "Texto del botón de reserva" },
      { key: "hours_label", label: "Etiqueta de horario" },
      { key: "hours_prefix", label: "Días de apertura" },
      { key: "closed_note", label: "Aviso de cierre" },
    ],
  },
  {
    title: "Hero",
    fields: [
      { key: "hero_title", label: "Titular principal" },
      { key: "hero_image_alt", label: "Texto alternativo de la imagen" },
    ],
  },
  {
    title: "Sobre nosotros",
    fields: [
      { key: "about_eyebrow", label: "Antetítulo" },
      { key: "about_title", label: "Título" },
    ],
  },
  {
    title: "Cómo llegar",
    fields: [
      { key: "location_eyebrow", label: "Antetítulo" },
      { key: "location_title", label: "Título" },
    ],
  },
  {
    title: "Catering",
    fields: [
      { key: "catering_eyebrow", label: "Antetítulo" },
      { key: "catering_title", label: "Título" },
      { key: "catering_body", label: "Texto", multiline: true },
      { key: "catering_cta_label", label: "Texto del botón" },
    ],
  },
  {
    title: "Carta",
    fields: [
      { key: "menu_eyebrow", label: "Antetítulo" },
      { key: "menu_title", label: "Título" },
      { key: "menu_cta_label", label: "Texto del botón" },
    ],
  },
  {
    title: "Buscadores (SEO)",
    fields: [
      { key: "seo_title", label: "Título en Google (máx. 70)" },
      { key: "seo_description", label: "Descripción en Google (máx. 170)", multiline: true },
    ],
  },
];
