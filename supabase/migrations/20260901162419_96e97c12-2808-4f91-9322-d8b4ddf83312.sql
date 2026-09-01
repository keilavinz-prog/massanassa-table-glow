CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.catering_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_name text NOT NULL,
    contact_email text NOT NULL,
    contact_phone text NOT NULL,
    event_date date,
    guests integer,
    event_type text,
    message text,
    status text DEFAULT 'new'::text NOT NULL,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT catering_requests_status_check CHECK ((status = ANY (ARRAY['new'::text, 'in_review'::text, 'quoted'::text, 'confirmed'::text, 'closed'::text])))
);
ALTER TABLE ONLY public.catering_requests REPLICA IDENTITY FULL;

CREATE TABLE public.dishes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(6,2) NOT NULL,
    allergens text[] DEFAULT '{}'::text[] NOT NULL,
    image_url text,
    is_available boolean DEFAULT true NOT NULL,
    is_menu_del_dia boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dishes_price_check CHECK ((price >= (0)::numeric))
);

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text NOT NULL,
    order_type text DEFAULT 'recogida'::text NOT NULL,
    items jsonb NOT NULL,
    total numeric(8,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    stripe_payment_intent_id text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT orders_order_type_check CHECK ((order_type = ANY (ARRAY['recogida'::text, 'domicilio'::text]))),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'preparing'::text, 'ready'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT orders_total_check CHECK ((total >= (0)::numeric))
);
ALTER TABLE ONLY public.orders REPLICA IDENTITY FULL;

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    role text DEFAULT 'empleado'::text NOT NULL,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'empleado'::text, 'proveedor'::text])))
);

CREATE TABLE public.reservations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text NOT NULL,
    reservation_date date NOT NULL,
    reservation_time time without time zone NOT NULL,
    party_size integer NOT NULL,
    notes text,
    status text DEFAULT 'pending'::text NOT NULL,
    google_calendar_event_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reservations_party_size_check CHECK ((party_size > 0)),
    CONSTRAINT reservations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'rejected'::text, 'cancelled'::text])))
);
ALTER TABLE ONLY public.reservations REPLICA IDENTITY FULL;

CREATE TABLE public.restaurant_settings (
    id integer DEFAULT 1 NOT NULL,
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
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    landing_content jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT restaurant_settings_id_check CHECK ((id = 1))
);

ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.catering_requests ADD CONSTRAINT catering_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dishes ADD CONSTRAINT dishes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reservations ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.restaurant_settings ADD CONSTRAINT restaurant_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.catering_requests
    ADD CONSTRAINT catering_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE FUNCTION public.current_role_is(_role text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = _role
  )
$$;

CREATE FUNCTION public.current_user_is_staff() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'empleado')
  )
$$;

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (NEW.id, NULL, 'empleado', NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.prevent_role_self_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND current_setting('role', true) <> 'service_role' THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_prevent_role_self_change BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_change();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dishes TO authenticated;
GRANT ALL ON public.dishes TO service_role;
GRANT SELECT ON public.dishes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_settings TO authenticated;
GRANT ALL ON public.restaurant_settings TO service_role;
GRANT SELECT ON public.restaurant_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catering_requests TO authenticated;
GRANT ALL ON public.catering_requests TO service_role;

CREATE POLICY "Admin ve todos los perfiles" ON public.profiles FOR SELECT TO authenticated USING (public.current_role_is('admin'::text));
CREATE POLICY "Admin y proveedores consultan catering" ON public.catering_requests FOR SELECT TO authenticated USING ((public.current_role_is('admin'::text) OR public.current_role_is('proveedor'::text)));
CREATE POLICY "Ajustes visibles públicamente" ON public.restaurant_settings FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Cada usuario actualiza su perfil" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));
CREATE POLICY "Cada usuario ve su perfil" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));
CREATE POLICY "Categorías visibles públicamente" ON public.categories FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Personal consulta pedidos" ON public.orders FOR SELECT TO authenticated USING (public.current_user_is_staff());
CREATE POLICY "Personal consulta reservas" ON public.reservations FOR SELECT TO authenticated USING (public.current_user_is_staff());
CREATE POLICY "Platos visibles públicamente" ON public.dishes FOR SELECT TO authenticated, anon USING (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.catering_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.reservations;