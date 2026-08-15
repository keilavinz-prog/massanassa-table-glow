-- Funciones sin parámetro de usuario: solo evalúan al solicitante actual
CREATE OR REPLACE FUNCTION public.current_role_is(_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'empleado')
  )
$$;

REVOKE ALL ON FUNCTION public.current_role_is(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_role_is(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.current_user_is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff() TO authenticated, service_role;

-- Trigger: el rol solo se puede cambiar desde el servidor (service_role)
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND current_setting('role', true) <> 'service_role' THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_role_self_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_prevent_role_self_change ON public.profiles;
CREATE TRIGGER profiles_prevent_role_self_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_change();

-- Políticas reescritas con las funciones reforzadas
DROP POLICY IF EXISTS "Admin ve todos los perfiles" ON public.profiles;
CREATE POLICY "Admin ve todos los perfiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.current_role_is('admin'));

DROP POLICY IF EXISTS "Cada usuario actualiza su perfil" ON public.profiles;
CREATE POLICY "Cada usuario actualiza su perfil"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Personal consulta reservas" ON public.reservations;
CREATE POLICY "Personal consulta reservas"
ON public.reservations FOR SELECT TO authenticated
USING (public.current_user_is_staff());

DROP POLICY IF EXISTS "Personal consulta pedidos" ON public.orders;
CREATE POLICY "Personal consulta pedidos"
ON public.orders FOR SELECT TO authenticated
USING (public.current_user_is_staff());

DROP POLICY IF EXISTS "Admin y proveedores consultan catering" ON public.catering_requests;
CREATE POLICY "Admin y proveedores consultan catering"
ON public.catering_requests FOR SELECT TO authenticated
USING (public.current_role_is('admin') OR public.current_role_is('proveedor'));

-- Se retiran las funciones que aceptaban un usuario arbitrario
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, text);
DROP FUNCTION IF EXISTS public.is_staff(uuid);