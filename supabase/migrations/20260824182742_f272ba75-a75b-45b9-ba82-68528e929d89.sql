ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS landing_content jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.restaurant_settings.landing_content IS 'Textos editables de la landing (hero, sobre nosotros, ubicación, catering, carta, SEO). Editable desde /admin.';

UPDATE public.restaurant_settings
SET landing_content = jsonb_build_object(
  'header_cta_label', 'Reservar mesa',
  'hours_label', 'Horario',
  'hours_prefix', 'Martes a domingo',
  'closed_note', 'Lunes cerrado',
  'hero_title', 'Cocina valenciana de mercado en Massanassa',
  'hero_image_alt', 'Arroz valenciano recién hecho en paella',
  'about_eyebrow', 'Sobre nosotros',
  'about_title', 'La taberna del barrio',
  'location_eyebrow', 'Cómo llegar',
  'location_title', 'Dónde estamos',
  'catering_eyebrow', 'Catering y eventos',
  'catering_title', 'Llevamos la paella a tu celebración',
  'catering_body', 'Bodas, comuniones, cumpleaños y eventos de empresa con nuestros arroces en paella de leña y la cocina de siempre. Preparamos una propuesta a medida según fecha, número de invitados y presupuesto.',
  'catering_cta_label', '¿Organizas un evento? Solicita presupuesto',
  'menu_eyebrow', 'Nuestra carta',
  'menu_title', 'Categorías',
  'menu_cta_label', 'Ver la carta digital',
  'seo_title', 'Restaurante Chicken Garden — Cocina valenciana de mercado',
  'seo_description', 'Taberna valenciana en Massanassa: arroces en paella de leña, pollo asado para llevar y cocina de mercado.'
)
WHERE id = 1;