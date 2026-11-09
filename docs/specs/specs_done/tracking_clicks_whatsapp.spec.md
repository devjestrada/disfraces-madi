# Medición completa de clics a WhatsApp

## Contexto

El indicador "Clics a WhatsApp" (sección Resumen del panel) subestima la conversión real. Diagnóstico del 2026-11-09:

- Solo se registra el botón **"Agendar por WhatsApp"** de la ficha de disfraz (`src/views/CatalogoDetail.tsx` → `trackWhatsAppClick`). Resultado: **3 clics** registrados desde el 2026-07-19, frente a 193 visitas a fichas.
- Abren WhatsApp **sin registrar nada**:
  | Ubicación | Archivo |
  |---|---|
  | Botón flotante (canal principal de conversión, `AGENTS.md` §2) | `src/components/WhatsAppButton.tsx` |
  | CTA del catálogo | `src/views/Catalogo.tsx` |
  | CTA de Inicio (2) | `src/views/Inicio.tsx` |
  | CTA de Servicios (2, uno por servicio) | `src/views/Servicios.tsx` |
  | CTA de Contacto (2) | `src/views/Contacto.tsx` |
  | Enlace del pie de página | `src/components/Footer.tsx` |
- `costume_events.costume_id` es `not null`, así que hoy no se pueden registrar clics que no correspondan a un disfraz.
- Las sesiones en `localhost` escriben en la misma base de Supabase que producción: las pruebas locales contaminan visitas y clics.
- `fetchCostumeEvents` (`src/services/insightsService.ts`) trae todas las filas sin paginar; PostgREST devuelve como máximo 1.000 filas por defecto, por lo que los contadores se quedarán cortos sin aviso al superar ese volumen.
- Los clics no se deduplican (un doble clic cuenta dos veces).

## Objetivo

Que "Clics a WhatsApp" refleje todos los clics reales a WhatsApp del sitio público, indique de dónde vienen y siga siendo correcto con cualquier volumen de datos, **sin agregar analítica de terceros ni datos personales** (se mantiene el principio de la migración 009).

## Alcance

### 1. Base de datos — nueva migración `supabase/013_whatsapp_click_sources.sql`
- `costume_events.costume_id` pasa a ser opcional (`drop not null`); se mantiene la FK con `on delete cascade`.
- Nueva columna `source text` con `check` sobre los valores permitidos:
  `floating_button`, `costume_detail`, `catalog`, `home_hero`, `home_footer_cta`, `services_card`, `services_cta`, `contact`, `contact_direct`, `footer`.
  - Los eventos existentes de tipo `whatsapp_click` se actualizan a `source = 'costume_detail'`; los de tipo `view` quedan con `source` nulo.
- `check` de coherencia: si `event_type = 'view'` entonces `costume_id is not null`.
- Índice por `(event_type, occurred_at)` para los conteos por periodo.
- La política de inserción `anon` y la de lectura admin no cambian.
- Actualizar `supabase/README.md` con el nuevo paso.

### 2. Registro de eventos (`src/services/trackingService.ts`)
- `trackWhatsAppClick({ source, costumeId? })`: registra el origen y, cuando aplique, el disfraz.
- No registrar ningún evento (visitas ni clics) cuando `window.location.hostname` sea `localhost`, `127.0.0.1` o termine en `.local`.
- Deduplicar clics: ignorar un segundo clic del mismo `source` + disfraz dentro de 10 segundos.
- Sigue siendo *fire-and-forget*: nunca bloquea la apertura de WhatsApp.

### 3. CTA del sitio público
Llamar a `trackWhatsAppClick` en cada enlace o botón de la tabla del contexto, con su `source`:
- Botón flotante: `floating_button`; si el usuario está en la ficha de un disfraz, incluir su `costumeId`.
- Ficha de disfraz: `costume_detail` + `costumeId` (comportamiento actual).
- Resto: el `source` correspondiente, sin disfraz.
- **No** cambiar textos, enlaces, destinos ni el flujo del botón flotante ("🗓️ Agendar cita para probarme un disfraz", `AGENTS.md` §2). Los enlaces `<a href>` conservan su `href` y abren igual; el registro va en `onClick`.

### 4. Lectura y panel
- Conteos por periodo calculados en el servidor (`count: 'exact', head: true` o una vista/función agregada) en vez de descargar todas las filas, para visitas y clics.
- Donde siga siendo necesario traer filas (rankings por disfraz), paginar con `range()` hasta traer todas.
- **Resumen:** "Clics a WhatsApp" suma todos los orígenes.
- **Insights:** nueva tarjeta "Clics a WhatsApp por origen" (lista con conteo por `source`, nombres legibles en español) y ranking "Disfraces con más clics a WhatsApp" (solo eventos con disfraz).
- Mostrar una nota discreta "Medición completa desde el DD/MM/AAAA" junto a los clics, con la fecha de despliegue, ya que los datos previos solo incluyen la ficha de disfraz.

### Fuera de alcance
- Analítica de terceros (Google Analytics, Meta Pixel, etc.).
- Medir conversaciones o citas efectivas dentro de WhatsApp.
- Limpieza de eventos históricos generados desde `localhost` (no se pueden distinguir de forma confiable).

## Criterios de aceptación
- Cada CTA de la tabla del contexto genera exactamente un evento `whatsapp_click` con el `source` correcto al hacer clic, y WhatsApp se abre igual que antes.
- Navegando en `localhost` no se crea ningún evento.
- Doble clic rápido sobre el mismo CTA registra un solo evento.
- Resumen e Insights muestran conteos correctos con más de 1.000 eventos (verificable con un conteo directo en Supabase).
- Insights muestra los clics por origen y el ranking de disfraces por clics.
- `npm run lint` y `npm run build` sin errores.
- Checklist de `AGENTS.md` §3 cumplido; en particular, el botón de WhatsApp sigue visible, flotante y con el mismo flujo.
