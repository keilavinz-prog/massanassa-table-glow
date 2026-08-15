# HANDOFF FASE 9 — Pulido final + asistente IA opcional

## Paso 0 — Ratificación de Fase 8 (evidencia real)

### Políticas RLS activas por tabla
| Tabla | Política | Comando | Rol | USING / WITH CHECK |
|---|---|---|---|---|
| restaurant_settings | Ajustes visibles públicamente | SELECT | anon, authenticated | USING true |
| categories | Categorías visibles públicamente | SELECT | anon, authenticated | USING true |
| dishes | Platos visibles públicamente | SELECT | anon, authenticated | USING true |
| profiles | Cada usuario ve su perfil | SELECT | authenticated | USING auth.uid() = id |
| profiles | Admin ve todos los perfiles | SELECT | authenticated | USING current_role_is('admin') |
| profiles | Cada usuario actualiza su perfil | UPDATE | authenticated | USING/CHECK auth.uid() = id (trigger `prevent_role_self_change` impide cambiar `role`) |
| reservations | Personal consulta reservas | SELECT | authenticated | USING current_user_is_staff() |
| orders | Personal consulta pedidos | SELECT | authenticated | USING current_user_is_staff() |
| catering_requests | Admin y proveedores consultan catering | SELECT | authenticated | USING current_role_is('admin') OR current_role_is('proveedor') |

No existe ninguna política INSERT/UPDATE/DELETE para anon ni authenticated: **todas las escrituras pasan por server functions** que validan rol y usan service role.

### Prueba negativa (cliente anon sin sesión, ejecutada vía REST)
Comando (por tabla):
`curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/<tabla>?select=*" -H "apikey: <publishable>"`

| Petición | Resultado exacto |
|---|---|
| GET reservations | `401` — `permission denied for table reservations` |
| GET orders | `401` — `permission denied for table orders` |
| GET profiles | `401` — `permission denied for table profiles` |
| GET catering_requests | `401` — `permission denied for table catering_requests` |
| GET restaurant_settings / dishes / categories | `200` (lectura pública intencionada) |
| POST reservations (insert anon) | `401` — `permission denied` |
| PATCH dishes (update anon) | `401` — `permission denied` |

### Estado de build
`tsgo --noEmit` → 0 errores, 0 warnings. `/carta` responde `200` en el servidor de desarrollo.

### Autorización de negocio en servidor
`markOrderReady`, `markOrderCompleted`, `createCateringRequest`, `assignCateringRequest`,
`claimCateringRequest`, `updateCateringStatus` siguen validando el rol en servidor
(`requireStaffUser` / `requireAdminUser` / `requireProveedorUser` según el caso) y realizan la
escritura con el cliente service role. RLS queda como capa adicional, no como autorización.

### Realtime
`useRealtimeTables` elimina el canal en el cleanup del efecto (`supabase.removeChannel`), con
key estable por tabla; cambiar de pestaña Reservas/Pedidos no duplica canales porque la
suscripción vive en la página `/equipo`, no en las secciones.

## Hecho en Fase 9
- Motion: micro-interacción de éxito `animate-rise-in` (fade + slide 16px, 280ms ease-out) en
  confirmación de reserva, catering y pedido; `prefers-reduced-motion: reduce` global que anula
  transform/scale y limita transiciones/animaciones a ≤50ms en todas las rutas.
- Safe areas (`env(safe-area-inset-*)`) en header sticky y barra de chips de `/carta`, drawer del
  carrito, drawer de alérgenos, FAB del carrito y FAB de WhatsApp; `100dvh` en drawers y modales
  de admin para que el teclado de iOS no los recorte.
- Áreas táctiles de 44x44 (`tap-target`) en +/- cantidad, añadir al pedido, cerrar drawers/modales,
  chips de categoría, botón de pago y acciones críticas.
- Estados vacíos/carga auditados: skeletons de tarjeta (mismo radio/sombra) en `/equipo`, `/admin`
  y `/proveedor`; vacíos explícitos en pedidos por fecha y catering filtrado.
- Offline de `/carta`: la carta se guarda en `localStorage` (`fogo-carta-cache-v1`, 7 días); sin
  conexión se muestra aviso discreto "Sin conexión — mostrando la última carta guardada" y, si la
  carga falla, el `errorComponent` renderiza la carta cacheada en solo lectura. El carrito sigue
  funcionando offline, pero pagar se deshabilita con "Necesitas conexión para pagar".
- Asistente IA opcional: botón "✨ Sugerir descripción con IA" en el modal de plato, siempre
  visible, deshabilitado con tooltip "IA no configurada en este entorno" si no hay clave.

## Tablas/columnas creadas o modificadas
Ninguna. No se tocaron políticas RLS (el Paso 0 no detectó fallos).

## Server functions nuevas
- `getAiAssistantStatus` (admin; informa si hay clave).
- `suggestDishDescription` (admin; llama a Anthropic y devuelve texto, nunca guarda).

## Rutas/pantallas modificadas
`/carta`, `/pedido`, `/pedido/confirmacion`, `/reservar`, `/catering`, `/admin` (sección Carta).
Nuevos componentes: `OfflineMenu`, `OfflineNotice`; nuevos módulos: `useOnlineStatus`,
`menu-cache`, `ai.functions`, `ai.server`.

## Build
`tsgo --noEmit`: sin errores ni warnings.

## Secrets — estado de despliegue
| Secret | Estado |
|---|---|
| GOOGLE_CALENDAR_* | stub (sin clave: la confirmación de reserva no sincroniza, se registra en log) |
| STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET | stub (checkout devuelve error controlado sin clave) |
| RESEND_API_KEY | stub (emails no enviados, se registran en log) |
| ANTHROPIC_API_KEY | **no configurada** → asistente IA visible pero deshabilitado |

## Supuestos / pendientes
- El asistente IA queda **no activo** por falta de `ANTHROPIC_API_KEY`; al añadirla funciona sin
  cambios de código.
- La resiliencia offline usa caché en `localStorage` (sin Service Worker) para no interferir con
  el despliegue actual.

## Cómo probar
Preview: https://id-preview--f7c14abc-122a-4080-ab61-6fa28235a06a.lovable.app
1. Abre `/carta`, luego activa modo avión y recarga: verás la carta cacheada en solo lectura con
   el aviso superior; el carrito sigue editable y "Pagar" muestra "Necesitas conexión para pagar".
2. Activa "Reducir movimiento" en el SO y recorre landing, `/carta`, `/reservar`, `/pedido`,
   `/catering`, `/admin`, `/equipo`, `/proveedor`: no hay scale/translate, solo opacidad.
3. Simula un viewport con notch (iPhone 14 Pro en DevTools) y comprueba header de `/carta`, chips,
   FABs y drawer del carrito.
4. Envía una reserva o solicitud de catering: la confirmación entra con fade + slide.
5. En `/admin` → Carta → nuevo plato: el botón de IA aparece deshabilitado con el tooltip
   "IA no configurada en este entorno" (se activará al configurar la clave).
