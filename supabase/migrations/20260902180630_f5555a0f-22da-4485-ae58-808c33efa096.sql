ALTER TABLE public.restaurant_settings
  ADD COLUMN IF NOT EXISTS nav_labels jsonb NOT NULL DEFAULT '{"inicio":"Inicio","carta":"Carta","restaurantes":"Restaurantes","reservar":"Reservar","catering":"Catering"}'::jsonb,
  ADD COLUMN IF NOT EXISTS historia_texto text;