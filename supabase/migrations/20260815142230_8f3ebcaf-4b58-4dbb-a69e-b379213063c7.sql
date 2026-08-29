CREATE TABLE public.restaurant_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL,
  slug text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  phone text NOT NULL,
  whatsapp_phone text,
  email text,
  lat numeric,
  lng numeric,
  opening_hours jsonb NOT NULL,
  description text,
  hero_image_url text,
  logo_url text,
  instagram_url text,
  facebook_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.restaurant_settings IS 'RLS pendiente — Fase 8';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_settings TO anon, authenticated;
GRANT ALL ON public.restaurant_settings TO service_role;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'RLS pendiente — Fase 8';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;

CREATE TABLE public.dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(6,2) NOT NULL CHECK (price >= 0),
  allergens text[] NOT NULL DEFAULT '{}',
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  is_menu_del_dia boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.dishes IS 'RLS pendiente — Fase 8';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dishes TO anon, authenticated;
GRANT ALL ON public.dishes TO service_role;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'empleado' CHECK (role IN ('admin','empleado','proveedor')),
  phone text,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'RLS pendiente — Fase 8';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  party_size int NOT NULL CHECK (party_size > 0),
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected','cancelled')),
  google_calendar_event_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.reservations IS 'RLS pendiente — Fase 8';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO anon, authenticated;
GRANT ALL ON public.reservations TO service_role;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  order_type text NOT NULL DEFAULT 'recogida' CHECK (order_type IN ('recogida','domicilio')),
  items jsonb NOT NULL,
  total numeric(8,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','preparing','ready','completed','cancelled')),
  stripe_payment_intent_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.orders IS 'RLS pendiente — Fase 8';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

CREATE TABLE public.catering_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  event_date date,
  guests int,
  event_type text,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_review','quoted','confirmed','closed')),
  assigned_to uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.catering_requests IS 'RLS pendiente — Fase 8';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catering_requests TO anon, authenticated;
GRANT ALL ON public.catering_requests TO service_role;

INSERT INTO public.restaurant_settings (id, name, slug, address, city, postal_code, phone, whatsapp_phone, email, lat, lng, opening_hours, description, hero_image_url, instagram_url, facebook_url)
VALUES (1, 'Restaurante Chicken Garden', 'el-fogo-de-massanassa', 'Carrer Sant Josep, 14', 'Massanassa', '46469', '961 25 43 21', '34612345678', 'info@elfogodemassanassa.es', 39.4283, -0.3856,
  '{"lun":"cerrado","mar_dom":"12:00–16:30 y 20:00–23:30"}'::jsonb,
  'Cocina tradicional valenciana con producto de mercado, arroces en paella de leña y el mejor pollo asado de Massanassa para llevar.',
  'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=1600&q=80',
  'https://instagram.com/elfogodemassanassa', 'https://facebook.com/elfogodemassanassa');

INSERT INTO public.categories (name, sort_order) VALUES
  ('Para Picar', 0),
  ('Arroces y Fideuà', 1),
  ('Pollo Asado para Llevar', 2),
  ('Carnes y Pescados', 3),
  ('Menú del Día', 4),
  ('Postres Caseros', 5),
  ('Bebidas', 6);

INSERT INTO public.dishes (category_id, name, description, price, allergens, image_url, is_menu_del_dia, sort_order)
SELECT c.id, d.name, d.description, d.price, d.allergens, d.image_url, d.is_menu_del_dia, d.sort_order
FROM (VALUES
  ('Para Picar','Ensalada de perdiz','Perdiz escabechada con lechuga, tomate y cebolla, receta de la abuela',9.50,ARRAY['huevo'],'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',false,0),
  ('Para Picar','Esgarraet con bacalao','Pimiento asado, bacalao desalado y un chorro de aceite',8.00,ARRAY['pescado'],'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80',false,1),
  ('Arroces y Fideuà','Arroz del senyoret','Arroz meloso de pescado y marisco, sin trabajo para el comensal, mínimo 2 personas',14.50,ARRAY['crustaceos','moluscos'],'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=1200&q=80',false,0),
  ('Arroces y Fideuà','Fideuà de marisco','Fideos finos con marisco fresco y alioli casero',15.00,ARRAY['crustaceos','gluten','moluscos'],'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=80',false,1),
  ('Pollo Asado para Llevar','Pollo asado entero para llevar','Pollo de corral asado a fuego lento, con patatas panadera',12.90,ARRAY[]::text[],'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=1200&q=80',false,0),
  ('Pollo Asado para Llevar','Medio pollo asado con patatas',NULL,7.50,ARRAY[]::text[],'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80',false,1),
  ('Carnes y Pescados','Secreto ibérico a la brasa','Secreto ibérico a la brasa con pimientos del padrón',13.90,ARRAY[]::text[],'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',false,0),
  ('Menú del Día','Menú del día','Entrante + principal a elegir + postre + bebida, de lunes a viernes',12.50,ARRAY['gluten','lacteos'],'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1200&q=80',true,0),
  ('Postres Caseros','Coca de llanda','Bizcocho tradicional valenciano con azúcar glas',4.50,ARRAY['gluten','huevo','lacteos'],'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=1200&q=80',false,0),
  ('Bebidas','Horchata de Alboraia','Horchata artesana con fartons',2.80,ARRAY['frutos_secos'],'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=80',false,0)
) AS d(category_name,name,description,price,allergens,image_url,is_menu_del_dia,sort_order)
JOIN public.categories c ON c.name = d.category_name;