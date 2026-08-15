-- 1. Funciones helper (SECURITY DEFINER, evitan recursión en RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role IN ('admin', 'empleado')
  )
$$;

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- 2. Endurecimiento de privilegios: se retiran los permisos abiertos de desarrollo
REVOKE ALL ON public.restaurant_settings FROM anon, authenticated;
REVOKE ALL ON public.categories FROM anon, authenticated;
REVOKE ALL ON public.dishes FROM anon, authenticated;
REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.reservations FROM anon, authenticated;
REVOKE ALL ON public.orders FROM anon, authenticated;
REVOKE ALL ON public.catering_requests FROM anon, authenticated;

-- Datos públicos: solo lectura
GRANT SELECT ON public.restaurant_settings TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.dishes TO anon, authenticated;
-- Datos internos: lectura solo para usuarios autenticados (filtrada por RLS)
GRANT SELECT ON public.reservations TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.catering_requests TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
-- El servidor conserva acceso completo
GRANT ALL ON public.restaurant_settings TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.dishes TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.reservations TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.catering_requests TO service_role;

-- 3. RLS activado en las 7 tablas
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.restaurant_settings IS 'RLS activo (Fase 8): lectura pública, escritura solo vía servidor.';
COMMENT ON TABLE public.categories IS 'RLS activo (Fase 8): lectura pública, escritura solo vía servidor.';
COMMENT ON TABLE public.dishes IS 'RLS activo (Fase 8): lectura pública, escritura solo vía servidor.';
COMMENT ON TABLE public.profiles IS 'RLS activo (Fase 8): cada usuario ve/edita su perfil; admin ve todos.';
COMMENT ON TABLE public.reservations IS 'RLS activo (Fase 8): lectura solo admin/empleado; escritura vía servidor.';
COMMENT ON TABLE public.orders IS 'RLS activo (Fase 8): lectura solo admin/empleado; escritura vía servidor (incluye webhook de Stripe con service role).';
COMMENT ON TABLE public.catering_requests IS 'RLS activo (Fase 8): lectura admin/proveedor; escritura vía servidor.';

-- 4. Políticas
-- Contenido público de la web
CREATE POLICY "Ajustes visibles públicamente"
ON public.restaurant_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Categorías visibles públicamente"
ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Platos visibles públicamente"
ON public.dishes FOR SELECT TO anon, authenticated USING (true);

-- Perfiles
CREATE POLICY "Cada usuario ve su perfil"
ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admin ve todos los perfiles"
ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Cada usuario actualiza su perfil"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = public.get_user_role(auth.uid()));

-- Reservas y pedidos: solo personal
CREATE POLICY "Personal consulta reservas"
ON public.reservations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Personal consulta pedidos"
ON public.orders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Catering: admin y proveedores
CREATE POLICY "Admin y proveedores consultan catering"
ON public.catering_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'proveedor'));