-- Realtime: replica identity completa para recibir cambios con payload usable
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.catering_requests REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'catering_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.catering_requests;
  END IF;
END $$;

COMMENT ON TABLE public.catering_requests IS 'Solicitudes de catering/eventos. RLS pendiente — Fase 8 (lectura pública prohibida; insert público permitido).';
COMMENT ON TABLE public.orders IS 'Pedidos online. RLS pendiente — Fase 8. IMPORTANTE: el webhook de Stripe (Fase 6) escribe con service_role y debe quedar exento de políticas basadas en sesión de usuario.';
