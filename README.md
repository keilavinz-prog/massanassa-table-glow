# Fogó Warm Design

FASE 1 DE 9 — FUNDACIÓN: MODELO DE DATOS + SISTEMA DE DISEÑO "WARM-GASTRO"

CONTEXTO
Construimos la web de un restaurante real llamado "El Fogó de Massanassa", en Massanassa (Valencia, España). Estilo visual inspirado en tabernas tradicionales valencianas: fotos grandes de platos, tipografía elegante, paleta cálida terracota/crema. Backend: Supabase (Auth, Database, Storage). Esta fase NO incluye login, CRUD desde UI, reservas ni pagos: solo esquema de datos + design system + una landing mínima de validación.

QUÉ NO TOCAR EN ESTA FASE
- No implementar autenticación ni rutas protegidas.
- No implementar RLS todavía (se deja planificada, tablas abiertas para desarrollo).
- No construir CRUD de administración.
- No construir formulario de reservas ni de pedidos.
- No integrar Stripe, WhatsApp, Google Calendar, Leaflet ni Anthropic todavía.

SISTEMA DE DISEÑO (TOKENS)
Define estos tokens en un archivo central de estilos (CSS variables o config de Tailwind), y úsalos en todo el proyecto de aquí en adelante:
- Colores: --color-terracota: #C1440E (acento principal, botones CTA); --color-cream: #FDF6EC (fondo principal); --color-dark-brown: #3B2417 (texto principal); --color-gold: #C9A227 (detalles/bordes destacados); --color-olive: #6B7A3A (acento secundario, etiquetas "fresco"/"del día"); --color-white: #FFFFFF.
- Tipografía: títulos con fuente serif elegante "Playfair Display" (pesos 600/700); cuerpo de texto con "Work Sans" (400/500). Escala: h1 40px/48px, h2 30px, h3 22px, body 16px, small 13px.
- Radios: sm 6px, md 12px, lg 20px, full para badges circulares (QR, etiquetas).
- Sombra: sombra cálida suave `0 4px 20px rgba(59,36,23,0.15)` para tarjetas de plato.
- Espaciado: escala 4/8/12/16/24/32/48/64 px.
- Motion: transiciones 200-300ms ease-out; hover en tarjetas de plato con scale(1.03) en la imagen.

MODELO DE DATOS (SUPABASE — MIGRACIÓN SQL)
Crea las siguientes tablas exactamente así:

1. restaurant_settings
   - id int PRIMARY KEY DEFAULT 1 CHECK (id = 1)  -- fila única (singleton)
   - name text NOT NULL
   - slug text NOT NULL
   - address text NOT NULL
   - city text NOT NULL
   - postal_code text
   - phone text NOT NULL
   - whatsapp_phone text
   - email text
   - lat numeric
   - lng numeric
   - opening_hours jsonb NOT NULL
   - description text
   - hero_image_url text
   - logo_url text
   - instagram_url text
   - facebook_url text
   - created_at timestamptz DEFAULT now()
   - updated_at timestamptz DEFAULT now()

2. categories
   - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
   - name text NOT NULL
   - sort_order int NOT NULL DEFAULT 0
   - created_at timestamptz DEFAULT now()

3. dishes
   - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
   - category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE
   - name text NOT NULL
   - description text
   - price numeric(6,2) NOT NULL CHECK (price >= 0)
   - allergens text[] NOT NULL DEFAULT '{}'
   - image_url text
   - is_available boolean NOT NULL DEFAULT true
   - is_menu_del_dia boolean NOT NULL DEFAULT false
   - sort_order int NOT NULL DEFAULT 0
   - created_at timestamptz DEFAULT now()
   - updated_at timestamptz DEFAULT now()

4. profiles
   - id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
   - full_name text
   - role text NOT NULL DEFAULT 'empleado' CHECK (role IN ('admin','empleado','proveedor'))
   - phone text
   - created_at timestamptz DEFAULT now()

5. reservations
   - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
   - customer_name text NOT NULL
   - customer_email text NOT NULL
   - customer_phone text NOT NULL
   - reservation_date date NOT NULL
   - reservation_time time NOT NULL
   - party_size int NOT NULL CHECK (party_size > 0)
   - notes text
   - status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected','cancelled'))
   - google_calendar_event_id text
   - created_at timestamptz DEFAULT now()
   - updated_at timestamptz DEFAULT now()

6. orders
   - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
   - customer_name text NOT NULL
   - customer_email text NOT NULL
   - customer_phone text NOT NULL
   - order_type text NOT NULL DEFAULT 'recogida' CHECK (order_type IN ('recogida','domicilio'))
   - items jsonb NOT NULL
   - total numeric(8,2) NOT NULL CHECK (total >= 0)
   - status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','preparing','ready','completed','cancelled'))
   - stripe_payment_intent_id text
   - notes text
   - created_at timestamptz DEFAULT now()
   - updated_at timestamptz DEFAULT now()

7. catering_requests
   - id uuid PRIMARY KEY DEFAULT gen_random_uuid()
   - contact_name text NOT NULL
   - contact_email text NOT NULL
   - contact_phone text NOT NULL
   - event_date date
   - guests int
   - event_type text
   - message text
   - status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_review','quoted','confirmed','closed'))
   - assigned_to uuid REFERENCES profiles(id)
   - created_at timestamptz DEFAULT now()

No actives RLS todavía en ninguna tabla (déjalas con acceso abierto para desarrollo); añade un comentario SQL en cada tabla indicando "RLS pendiente — Fase 8".

SEED DATA (INSERTAR)
restaurant_settings (una fila, id=1):
- name: "El Fogó de Massanassa"
- slug: "el-fogo-de-massanassa"
- address: "Carrer Sant Josep, 14"
- city: "Massanassa"
- postal_code: "46469"
- phone: "961 25 43 21"
- whatsapp_phone: "34612345678"
- email: "info@elfogodemassanassa.es"
- lat: 39.4283, lng: -0.3856
- opening_hours: {"lun":"cerrado","mar_dom":"12:00–16:30 y 20:00–23:30"}
- description: "Cocina tradicional valenciana con producto de mercado, arroces en paella de leña y el mejor pollo asado de Massanassa para llevar."
- hero_image_url: usa una imagen de stock cálida de plato de arroz (placeholder de tipo Unsplash food)

categories (con sort_order 0-6):
1. Para Picar
2. Arroces y Fideuà
3. Pollo Asado para Llevar
4. Carnes y Pescados
5. Menú del Día
6. Postres Caseros
7. Bebidas

dishes (10 platos, con category_id correspondiente, imagen placeholder de stock food coherente con el plato):
1. "Ensalada de perdiz" — Para Picar — 9.50€ — alérgenos: {huevo} — "Perdiz escabechada con lechuga, tomate y cebolla, receta de la abuela"
2. "Esgarraet con bacalao" — Para Picar — 8.00€ — alérgenos: {pescado} — "Pimiento asado, bacalao desalado y un chorro de aceite"
3. "Arroz del senyoret" — Arroces y Fideuà — 14.50€ — alérgenos: {crustaceos,moluscos} — "Arroz meloso de pescado y marisco, sin trabajo para el comensal, mínimo 2 personas"
4. "Fideuà de marisco" — Arroces y Fideuà — 15.00€ — alérgenos: {crustaceos,gluten,moluscos} — "Fideos finos con marisco fresco y alioli casero"
5. "Pollo asado entero para llevar" — Pollo Asado para Llevar — 12.90€ — alérgenos: {} — "Pollo de corral asado a fuego lento, con patatas panadera"
6. "Medio pollo asado con patatas" — Pollo Asado para Llevar — 7.50€ — alérgenos: {}
7. "Secreto ibérico a la brasa" — Carnes y Pescados — 13.90€ — alérgenos: {} — "Secreto ibérico a la brasa con pimientos del padrón"
8. "Menú del día" — Menú del Día — 12.50€ — is_menu_del_dia: true — alérgenos: {gluten,lacteos} — "Entrante + principal a elegir + postre + bebida, de lunes a viernes"
9. "Coca de llanda" — Postres Caseros — 4.50€ — alérgenos: {gluten,huevo,lacteos} — "Bizcocho tradicional valenciano con azúcar glas"
10. "Horchata de Alboraia" — Bebidas — 2.80€ — alérgenos: {frutos_secos} — "Horchata artesana con fartons"

LANDING DE VALIDACIÓN (PÚBLICA, SIN INTERACTIVIDAD DE CARTA)
Página única en "/" que muestra:
- Header con logo/nombre "El Fogó de Massanassa" y horario resumido.
- Hero grande con imagen de plato y titular: "Cocina valenciana de mercado en Massanassa".
- Sección "Sobre nosotros" con la descripción del restaurante.
- Sección de categorías: tarjetas con nombre de cada categoría y contador de platos disponibles (leído en vivo desde Supabase), sin listado detallado de platos todavía.
- Footer con dirección, teléfono y redes.
Todo debe leer datos reales desde Supabase (no hardcodear), usando los tokens de diseño definidos arriba.

ENTREGA
Al terminar, devuelve el bloque:

HANDOFF FASE 1
- Hecho: qué construiste realmente
- Tablas/columnas creadas (tipos y constraints)
- Políticas RLS / Edge Functions / server functions activas (debe decir "ninguna, pendiente Fase 8" si aplica)
- Rutas/pantallas nuevas
- Errores o warnings de build (estado de tsc/lint)
- Supuestos tomados o pendientes
- URL de preview con pasos para probar

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://massanassa-table-glow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f7c14abc-122a-4080-ab61-6fa28235a06a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
