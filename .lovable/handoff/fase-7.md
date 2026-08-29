# Handoff — Fase 7: Dashboard tiempo real + Mapa + Catering/Proveedor

**Proyecto:** Restaurante Chicken Garden  
**Fecha:** 15 de agosto de 2026 (KEYVINZ)  
**Fase:** 7 de 9  
**Estado:** Completada y verificada en navegador.

---

## 1. Resumen ejecutivo

Se ha añadido al producto:

- **Actualización en vivo** en `/equipo` para reservas y pedidos mediante Supabase Realtime.
- **Gestión operativa de pedidos** del día con estados `pending → paid → preparing → ready → completed` y acciones manuales de equipo.
- **Mapa de ubicación** (Leaflet + OpenStreetMap) en la landing, con botón de Google Maps.
- **Flujo completo de catering/eventos:**
  - Formulario público en `/catering`.
  - Panel de administración con listado, filtros y asignación a proveedores.
  - Panel de proveedor con captación de solicitudes libres y actualización de estado.
- **Seed de demostración** con 4 solicitudes de catering.

No se ha implementado RLS todavía (queda pendiente para la Fase 8).

---

## 2. Alcance entregado vs. Fase 7

| Requisito | Estado | Notas |
|-----------|--------|-------|
| Realtime en `/equipo` (reservas + pedidos) | ✅ | `useRealtimeTables` + invalidación de TanStack Query |
| Tab "Pedidos" en `/equipo` | ✅ | Selector de fecha, badges, acciones listo/entregado |
| Tarjeta resumen "pedidos activos hoy" | ✅ | Tercera tarjeta en la sección de reservas |
| Mapa Leaflet en landing | ✅ | `/` sección "Cómo llegar", popup abierto, altura responsive |
| Ruta pública `/catering` | ✅ | Formulario validado + pantalla de éxito |
| Pestaña "Catering" en `/admin` | ✅ | Listado, filtros por estado, asignación a proveedores |
| Panel `/proveedor` real | ✅ | Reemplaza el placeholder de la Fase 2 |
| Seed de 4 solicitudes de catering | ✅ | Migración SQL incluida |
| RLS | ⏸️ | Pendiente Fase 8 (tablas siguen abiertas) |
| Notificaciones push / IA automática | ⏸️ | Fuera de alcance, como se acordó |
| GDPR / textos legales | ⏸️ | Pendiente Fase 8 |

---

## 3. Archivos creados y modificados

### Creados

- `src/hooks/useRealtimeTables.ts` — suscripción a cambios Postgres en tablas públicas.
- `src/components/equipo/OrdersSection.tsx` — listado y acciones de pedidos del día.
- `src/components/LocationMap.tsx` — wrapper cliente para carga diferida de Leaflet.
- `src/components/LocationMapCanvas.tsx` — canvas Leaflet con marcador y popup.
- `src/routes/catering.tsx` — página pública de solicitud de presupuesto.
- `src/components/admin/CateringSection.tsx` — panel admin de catering.
- `src/components/proveedor/CateringProviderPanel.tsx` — panel de proveedor.
- `src/lib/catering-schemas.ts` — Zod + helpers de estados/etiquetas.
- `src/lib/catering.functions.ts` — server functions de catering (público, admin, proveedor).
- `supabase/migrations/20260815154217_a1931619-975b-4a41-aaee-2f4cf8a02277.sql` — Realtime + seed catering.

### Modificados

- `src/routes/equipo.tsx` — pestañas Reservas/Pedidos + resumen activo.
- `src/components/equipo/ReservationsSection.tsx` — integración Realtime + `ActiveOrdersCard`.
- `src/routes/admin.tsx` — 4ª pestaña "Catering".
- `src/routes/proveedor.tsx` — renderiza `CateringProviderPanel`.
- `src/routes/index.tsx` — secciones "Cómo llegar" y "Catering y eventos".
- `src/components/SiteFooter.tsx` — enlace a `/catering`.
- `src/lib/orders.functions.ts` — añadidos `getOrdersByDate`, `markOrderReady`, `markOrderCompleted`.
- `src/routes/pedido_.confirmacion.tsx` — renombrado desde `pedido.confirmacion.tsx` (ruta anidada).
- `supabase/migrations/20260815144923_ddae3d15-976d-48fe-b3ca-2f2976fd9757.sql` — actualización del `handle_new_user()` y restricción de roles.
- `supabase/migrations/20260815144937_b6697df7-4a66-4d21-9673-ab4da25f5164.sql` — revoke sobre `handle_new_user()`.

---

## 4. Backend / Migraciones SQL

### Realtime (Fase 7)

Archivo: `supabase/migrations/20260815154217_a1931619-975b-4a41-aaee-2f4cf8a02277.sql`

```sql
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.catering_requests REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.catering_requests;
```

> **Nota:** `REPLICA IDENTITY FULL` es obligatorio para que el payload de Realtime incluya los datos necesarios al actualizar.

### Seed de catering

Misma migración. Inserta 4 filas de ejemplo en `catering_requests` con estados `new`, `in_review`, `quoted`, `closed` y fechas relativas a la fecha de ejecución.

### Roles de usuario

La migración `20260815144923...` añade el `CHECK` de roles y el trigger `handle_new_user()` que crea el perfil con `role='empleado'` por defecto.

---

## 5. Dependencias

No se han añadido nuevas dependencias en esta fase. Las relevantes ya existían:

- `leaflet` + `@types/leaflet` — mapa de la landing.
- `@supabase/supabase-js` — Realtime y clientes admin.
- `@tanstack/react-query` / `@tanstack/react-start` — data fetching y server functions.

---

## 6. Funcionalidades detalladas

### 6.1 Dashboard `/equipo` en tiempo real

- **Pestañas:** Reservas / Pedidos.
- **Reservas:** mismo comportamiento de la Fase 5, ahora con suscripción Realtime a `reservations`.
- **Pedidos:** selector de fecha, listado de pedidos creados ese día, ordenados por `created_at` descendente.
- **Resumen:** tres tarjetas superiores:
  - Reservas pendientes
  - Confirmadas hoy / día seleccionado
  - Pedidos activos hoy (`pending + paid + preparing + ready`)
- **Acciones de pedido:**
  - `Marcar como listo`: desde `paid` o `preparing` → `ready`.
  - `Marcar como entregado`: desde `ready` → `completed`.
- **Realtime:** cada cambio en `reservations` u `orders` invalida la query correspondiente de TanStack Query sin recargar la página.

### 6.2 Mapa en la landing (`/`)

- Sección "Cómo llegar" debajo de "Sobre nosotros".
- Lee `lat`, `lng`, `name`, `address`, `postal_code`, `city` desde `restaurant_settings`.
- Leaflet con tiles de OpenStreetMap, zoom 15, marcador por defecto.
- Popup abierto por defecto: nombre + dirección completa.
- Altura: 320px móvil / 400px desktop.
- Botón "Cómo llegar" abre Google Maps con `destination={lat},{lng}`.
- SSR-safe: el componente se carga de forma diferida (`React.lazy`) y solo se renderiza en cliente (`mounted` + `Suspense` con skeleton).

### 6.3 `/catering` — Solicitud pública de eventos

Campos del formulario:

- Nombre de contacto (obligatorio, min 3 chars).
- Email (obligatorio, formato).
- Teléfono (obligatorio, 9–12 chars).
- Fecha del evento (opcional, min hoy).
- Nº de invitados (opcional, min 1).
- Tipo de evento (opcional): Boda, Comunión, Cumpleaños, Evento de empresa, Otro.
- Mensaje (opcional, max 500 chars, contador).

Tras el envío correcto:
- Pantalla de éxito con icono, mensaje de 48h y botón "Volver al inicio".
- Datos insertados con `status='new'` y `assigned_to=null`.

Server function: `createCateringRequest(input)` — pública, validación Zod en servidor.

### 6.4 `/admin` — Pestaña "Catering"

- Listado de todas las `catering_requests` ordenadas por `created_at` desc.
- Filtros por estado: Todos, Nuevas, En revisión, Presupuestadas, Confirmadas, Cerradas.
- Tarjetas con: nombre, teléfono, email, fecha, invitados, tipo, mensaje, badge de estado.
- Selector "Asignar a" con proveedores de `profiles` cuyo `role='proveedor'`.
- Server function: `assignCateringRequest(id, providerId)` — valida admin.

### 6.5 `/proveedor` — Panel de proveedor

Dos secciones:

1. **Solicitudes sin asignar:** `assigned_to IS NULL` y `status != 'closed'`. Botón "Tomar solicitud".
   - Server function: `claimCateringRequest(id)` — valida rol proveedor y actualiza condicionalmente solo si `assigned_to IS NULL` (evita carreras).
2. **Mis solicitudes:** `assigned_to = user.id`. Selector de estado: En revisión, Presupuestada, Confirmada, Cerrada.
   - Server function: `updateCateringStatus(id, status)` — valida rol y propiedad.

Realtime activo también aquí para que admin y proveedor vean cambios sin recargar.

---

## 7. Seguridad y supuestos importantes

### Supuestos documentados

- **RLS no está activo:** todas las tablas siguen abiertas para desarrollo. La Fase 8 debe implementar políticas RLS y ajustar los `GRANT` si es necesario.
- **Stripe webhook:** la migración deja un comentario recordando que el webhook de Stripe (Fase 6) debe quedar exento de políticas de sesión de usuario porque escribe con `service_role`.
- **Catering público:** el insert de `catering_requests` es público sin autenticación (intencional en esta fase).

### Validaciones de seguridad ya presentes

- Todas las server functions de catering verifican el rol del usuario mediante `requireAdminUser()` / `requireProvider()` / `requireTeamUser()`.
- Las operaciones de proveedor incluyen condiciones de propiedad (`eq('assigned_to', user.id)`) para evitar que un proveedor modifique solicitudes ajenas.
- `claimCateringRequest` usa `UPDATE ... WHERE assigned_to IS NULL` para evitar condiciones de carrera.

---

## 8. Deuda técnica / Pendientes

- **RLS Fase 8:** implementar políticas para todas las tablas. Revisar especialmente:
  - `orders` (lectura/escritura por equipo y cliente propietario).
  - `catering_requests` (admin todo, proveedor solo asignadas, insert público).
  - `profiles` (lectura propia, admin todo).
- **Emails de catering:** no se han implementado. Considerar notificación por email al admin/proveedor cuando se crea una solicitud.
- **Notificaciones push:** fuera de alcance, pero el hook de Realtime podría extenderse fácilmente.
- **Tests E2E:** no se han añadido. Recomendado añadir tests para el flujo de tomar solicitud de catering y cambiar estado.

---

## 9. Próximos pasos (Fase 8)

Según el plan original, la Fase 8 debe incluir:

1. Implementar RLS real en todas las tablas.
2. Ajustar server functions para que funcionen con RLS habilitado (usar `service_role` donde sea necesario, por ejemplo webhooks y admin masivo).
3. Añadir textos legales, GDPR y política de privacidad.
4. Revisar flujos de autenticación y protección de rutas con RLS activo.

---

## 10. Notas de despliegue

- **Migraciones aplicadas:** las 4 migraciones de `supabase/migrations/` deben estar aplicadas en el backend antes de desplegar.
- **Realtime:** verificar que las tablas `reservations`, `orders` y `catering_requests` estén en la publicación `supabase_realtime`.
- **Leaflet:** las imágenes de marcador se importan directamente desde `leaflet/dist/images/`, compatible con el bundler de Vite.
- **Variables de entorno:** no se han añadido nuevos secrets en esta fase. Los de Fase 6 (Stripe/Resend) y Fase 5 (Google Calendar) siguen siendo opcionales; si no están configurados, los flujos afectados operan en modo "stub" documentado.

---

## 11. Cómo probar rápido

1. Landing (`/`): verificar que el mapa carga con el popup y el botón "Cómo llegar" abre Google Maps.
2. `/catering`: enviar un formulario y ver que aparece en la pestaña "Catering" de `/admin`.
3. `/admin` → Catering: asignar una solicitud al proveedor de prueba.
4. `/proveedor`: tomar una solicitud libre y cambiarle el estado.
5. `/equipo` → Pedidos: crear un pedido desde `/pedido` (con Stripe en modo stub si no hay keys) y ver que aparece en la lista.
6. Abrir dos navegadores/vistas: cambiar una reserva/pedido/catering en una y ver que se actualiza en la otra sin recargar.

---

*Fin del handoff de la Fase 7.*
