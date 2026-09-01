REVOKE ALL ON FUNCTION public.current_role_is(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_role_is(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_staff() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_role_self_change() FROM PUBLIC, anon, authenticated;