# HANDOFF — Fase 8 de 9: Seguridad (RLS + hardening + GDPR)

Fecha: 15 de agosto de 2026. Proyecto: Restaurante Chicken Garden (Massanassa, Valencia).

## 1. Ratificación retroactiva (Fase 7)

| Punto | Estado | Detalle |
|---|---|---|
| Build (`tsgo --noEmit`) | ✅ Sin errores | Verificado antes y después de los cambios de esta fase. Sin correcciones necesarias. |
| Server functions `markOrderReady`, `markOrderCompleted` | ✅ Existen y validan rol | `src/lib/orders.functions.ts`, exigen sesión + rol en `('admin','empleado')` en servidor. |
| `createCateringRequest` | ✅ Pública con validación completa en servidor | Inserta con `status='new'`, `assigned_to=null`. |
| `assignCateringRequest` | ✅ Valida rol admin en servidor | `src/lib/catering.functions.ts`. |
| `claimCateringRequest` | ✅ Valida rol proveedor + UPDATE condicionado (`assigned_to IS NULL`) | Sin condición de carrera. |
| `updateCateringStatus` | ✅ Valida rol proveedor y que `assigned_to` = usuario actual | — |
| Cleanup de la suscripción Realtime en `/equipo` | ✅ Correcto | `src/hooks/useRealtimeTables.ts` devuelve `() => supabase.removeChannel(channel)` en el `useEffect`. |
| Seed de 4 solicitudes de catering | ✅ Insertadas con fechas relativas correctas | Laura Giménez (05/09, `new`), Grupo Inversiones Turia (25/08, `in_review`), Fam. Ortiz (19/09, `quoted`), Marina Belda (01/08, `closed`). |

No fue necesaria ninguna corrección previa.

## 2. Funciones helper (SECURITY DEFINER, sin recursión en RLS)

- `public.current_role_is(_role text)` → booleano; comprueba el rol de `auth.uid()`.
- `public.current_user_is_staff()` → booleano; `role IN ('admin','empleado')` para `auth.uid()`.
- `public.prevent_role_self_change()` + trigger `profiles_prevent_role_self_change`: si alguien intenta cambiar `role` desde el cliente, el valor anterior se restaura. Solo el servidor (service role) puede cambiar roles.

Decisión de diseño: las funciones **no aceptan un id de usuario arbitrario** (se descartaron las variantes `has_role(uuid, text)` / `is_staff(uuid)` creadas en el primer paso) para que un usuario autenticado no pueda consultar el rol de otro. `EXECUTE` concedido a `authenticated` y `service_role`, revocado a `anon` y `PUBLIC`.

## 3. RLS activada en las 7 tablas

Privilegios: se revocaron los permisos abiertos de desarrollo (`INSERT/UPDATE/DELETE` para `anon` y `authenticated`) en las 7 tablas y se reconcedió lo mínimo:

| Tabla | anon | authenticated | Políticas |
|---|---|---|---|
| `restaurant_settings` | SELECT | SELECT | Lectura pública (`true`) |
| `categories` | SELECT | SELECT | Lectura pública |
| `dishes` | SELECT | SELECT | Lectura pública |
| `profiles` | — | SELECT, UPDATE | Ve/edita su propia fila; admin ve todas; trigger blinda `role` |
| `reservations` | — | SELECT | Solo `current_user_is_staff()` |
| `orders` | — | SELECT | Solo `current_user_is_staff()` |
| `catering_requests` | — | SELECT | Admin o proveedor |

`service_role` conserva `ALL` en las 7 tablas. Cada tabla tiene un `COMMENT` que documenta su régimen de acceso.

**No existen políticas de escritura para `anon`/`authenticated`**: todas las mutaciones pasan por server functions con service role tras validar el rol en servidor. Esto ya era así desde las fases 3-7 (`getAdminClient()` en `src/lib/admin.server.ts`), por lo que **no hubo que migrar ninguna server function**: las lecturas públicas usan la clave publicable (`restaurant.functions.ts`) y funcionan con las nuevas políticas de lectura pública.

El webhook de Stripe (`/api/public/stripe-webhook`) sigue usando service role y por tanto queda exento de RLS, verificando la firma HMAC antes de escribir.

## 4. GDPR (mínimo legal)

- **`/privacidad`** — responsable, datos y finalidades por formulario, base legal, destinatarios (Stripe, Resend, alojamiento/BD, calendario), plazos de conservación, derechos RGPD y AEPD, medidas de seguridad.
- **`/aviso-legal`** — datos identificativos, condiciones de uso, reglas de reservas/pedidos/precios y alérgenos, propiedad intelectual (mapa: OpenStreetMap), legislación aplicable.
- **`/cookies`** — inventario de almacenamiento técnico: sesión del panel, carrito en `localStorage`, preferencia del aviso, cookies propias de Stripe al pagar. Sin analítica ni publicidad.
- **Banner de cookies** (`src/components/legal/CookieBanner.tsx`) montado una vez en `__root.tsx`: informativo, con "Solo necesarias" / "Entendido", decisión guardada en `localStorage` (`fogo-cookie-consent`). Sin proveedor de analítica conectado (fuera de alcance).
- **Consentimiento en formularios públicos** (`ConsentCheckbox`): casilla obligatoria en `/reservar`, `/pedido` y `/catering`; el botón de envío queda deshabilitado hasta marcarla. Validación solo en cliente: no se añadió ninguna columna ni cambio de esquema.
- **Enlaces legales** en el pie de página (`SiteFooter`), presentes en toda la web pública.

Las tres páginas legales leen los datos del restaurante desde `restaurant_settings` vía `getLandingData` (nada hardcodeado) y tienen `head()` propio con título, descripción y OG.

## 5. Verificación realizada (Playwright, en local)

- Público (`/`, `/carta`, `/catering`, `/privacidad`, `/aviso-legal`, `/cookies`): cargan con datos reales, sin errores 4xx ni de consola.
- Anónimo contra la API de datos: lectura de `reservations`, `orders`, `catering_requests`, `profiles` → **permission denied**; `UPDATE` de `dishes` e `INSERT` de `reservations` → **permission denied**; `restaurant_settings` sigue visible. ✅
- Empleado autenticado: lee `reservations` y `orders`, ve **solo su propio perfil** (1 fila), y la suscripción Realtime alcanza estado `SUBSCRIBED`. ✅
- Admin: `/admin` con carta, imágenes firmadas y pestaña Catering operativa. `/equipo` con tarjetas de resumen y selector de fecha. ✅
- Proveedor: `/proveedor` lista solicitudes sin asignar con "Tomar solicitud". ✅
- Formulario de catering: botón deshabilitado sin consentimiento; con consentimiento el envío llega a la base de datos y aparece en `/proveedor`. La fila de prueba se eliminó después. ✅
- `tsgo --noEmit`: sin errores.

## 6. Supuestos y deuda técnica

- **Linter**: quedan 2 avisos "SECURITY DEFINER ejecutable por usuarios autenticados" correspondientes a `current_role_is` y `current_user_is_staff`. Son los predicados de las propias políticas RLS (Postgres las evalúa con los privilegios del solicitante), no aceptan id ajeno y solo devuelven un booleano. **Aceptados y documentados en la memoria de seguridad.**
- Stripe, Resend y Google Calendar permanecen exactamente en el estado de las fases 5-6 (stub si faltan secrets). No se tocaron.
- Cookie banner sin gestor de consentimiento granular porque no hay analítica: si en el futuro se añade tracking, habrá que ampliarlo con categorías y bloqueo previo.
- El consentimiento RGPD no se persiste en base de datos (no se podía modificar el esquema en esta fase). Si se requiere prueba de consentimiento, en Fase 9+ habría que añadir columnas `consent_at`/`consent_text`.
- `profiles` permite `UPDATE` propio (nombre/teléfono) aunque la UI todavía no ofrece edición de perfil.

## 7. Próximos pasos (Fase 9)

- Revisión final, SEO/rendimiento, contenido real y publicación.
- Configurar dominio verificado en Resend y secrets reales de Stripe/Google Calendar.
- Opcional: página de perfil para el equipo y registro persistente del consentimiento.
