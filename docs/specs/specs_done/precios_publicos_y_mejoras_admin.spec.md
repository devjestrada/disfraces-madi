# Spec de Modificaciones — Precios Públicos, Depósito y Mejoras de Admin

## Contexto y alcance

Esta spec formaliza el trabajo pendiente que `AGENTS.md` ya anticipa en su sección "✅ Publicación de Precios (Venta, Alquiler y Depósito)": la política de negocio cambió — **ya no está prohibido publicar precios**, al contrario, ahora se exige mostrar alquiler, venta y depósito en pesos colombianos (COP) en catálogo y ficha de producto. El modelo de datos actual (`src/types.ts`, `src/data.ts`) solo contempla `rentalPrice`/`salePrice`; falta el campo de depósito. Esta spec cubre ese cambio de datos/UI de punta a punta (frontend + Supabase), además de tres mejoras funcionales independientes en Admin y NavBar.

Instrucciones generales para el agente que implemente esta spec:
- Los cambios de texto a eliminar son literales: buscar el texto "Actual" y removerlo tal como se indica.
- Mantener el resto del diseño, estilos y sistema documentado en `DESIGN.md` sin alteraciones salvo que se indique lo contrario.
- Todo cambio de esquema de base de datos debe ir acompañado de su migración SQL correspondiente en `supabase/` y debe reflejarse en `docs/SUPABASE_SETUP.md` (sección "4. Orden de migraciones SQL" y cualquier otra sección afectada), siguiendo el patrón de las migraciones ya existentes.
- Si algún texto "Actual" no se encuentra exactamente igual en el código, aplicar el cambio al texto equivalente más cercano y reportarlo al final de este documento antes de moverlo a `specs_done`.

---

## 1. Ficha de disfraz (`src/views/CatalogoDetail.tsx`)

### 1.1 Quitar textos de beneficios incluidos
**Actual** (dentro del bloque "Alquiler Personalizado", líneas ~164-167):
```tsx
<div className="pt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#846524] font-bold font-mono uppercase">
  <span>★ Tintorería Especializada Incluida</span>
  <span>★ Ajustes a Medida de Sastrería Incluidos</span>
</div>
```
**Acción:** Eliminar por completo las dos líneas `<span>★ Tintorería Especializada Incluida</span>` y `<span>★ Ajustes a Medida de Sastrería Incluidos</span>`. Si al quitarlas el `<div>` contenedor queda vacío, eliminar también el `<div>` contenedor para no dejar markup huérfano.

### 1.2 Mostrar precio de venta, alquiler y depósito en COP
- **Ubicación:** el bloque "Alquiler Personalizado" (líneas ~150-168 de `CatalogoDetail.tsx`) actualmente solo muestra el mensaje genérico *"Precios adaptados a tu presupuesto, conversemos en tu visita"*. Ese mensaje debe conservarse como texto complementario (tono cercano, per `AGENTS.md` sección 1), pero debajo o junto a él debe agregarse un bloque con los tres valores:
  - Precio de alquiler (`costume.rentalPrice`).
  - Precio de venta (`costume.salePrice`), solo si existe (es opcional/`undefined` en el modelo actual).
  - Depósito (`costume.depositPrice`, campo nuevo — ver 1.3), presentado explícitamente como reembolsable, ej. *"Depósito reembolsable: $100.000"*.
- **Formato de moneda:** usar `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`, igual al helper `formatCOP` ya definido en `src/views/Catalogo.tsx` (líneas ~142-148). Se recomienda extraer ese helper a un módulo compartido (ej. `src/utils/format.ts`) y reutilizarlo tanto en `Catalogo.tsx` como en `CatalogoDetail.tsx` en vez de duplicar la función.
- **Criterio de aceptación:** la ficha muestra los 3 valores (alquiler, venta si aplica, depósito) en formato COP sin símbolos rotos ni decimales.

### 1.3 Agregar campo de depósito al modelo de datos
- **`src/types.ts`:** agregar `depositPrice?: number;` a la interfaz `Costume` (junto a `rentalPrice`/`salePrice`), y `deposit_price: number | null;` a `AdminCostume` y `AdminCostumePayload`.
- **`src/data.ts`:** agregar valores de `depositPrice` a los registros de ejemplo existentes.
- **`src/services/dataService.ts`:** en `normalizeCostumeRecord` (línea ~20-21, junto al mapeo de `rentalPrice`/`salePrice`), agregar `depositPrice: costume.depositPrice ?? costume.deposit_price`.
- **Supabase — migración nueva `supabase/008_deposit_price.sql`:**
  - `ALTER TABLE costumes ADD COLUMN deposit_price numeric(12,2);` (nullable, ya que no todos los disfraces necesariamente definen depósito de inmediato; evaluar si de negocio se prefiere `NOT NULL DEFAULT 0`).
  - Actualizar la vista `costumes_full` en `supabase/003_views.sql` (o agregar una migración que haga `CREATE OR REPLACE VIEW`) para incluir `c.deposit_price` en el `SELECT`, ya que la vista lista columnas explícitas y no se actualiza automáticamente.
  - Actualizar `docs/SUPABASE_SETUP.md` sección "4. Orden de migraciones SQL" agregando `008_deposit_price.sql` al listado, y revisar si la sección de RLS (`006_admin_rls.sql`) necesita ajuste (no debería, ya que las políticas actuales no listan columnas).

---

## 2. Catálogo (`src/views/Catalogo.tsx`)

### 2.1 Agregar precios de alquiler y venta (sin depósito) en cada tarjeta
- **Ubicación:** sección "Info Section" de cada card (líneas ~394-405), junto al nombre y tallas del disfraz.
- **Mostrar:** precio de alquiler (`costume.rentalPrice`) siempre, y precio de venta (`costume.salePrice`) solo si existe. **No** mostrar el depósito aquí (el depósito es exclusivo de la ficha de detalle, según nota original del usuario).
- **Formato:** mismo helper `formatCOP` de 1.2.
- **Inconsistencia detectada a corregir en el mismo cambio:** el catálogo actualmente tiene dos elementos de copy que contradicen la nueva política de precios y deben actualizarse o eliminarse junto con este punto:
  - El badge **"A tu Presupuesto"** sobre la imagen de cada card (líneas ~386-390).
  - La tarjeta **"Presupuesto Adaptable Notice Card"** (líneas ~318-338), cuyo texto dice literalmente *"No publicamos tarifas fijas porque cada experiencia folclórica es única..."* — esta frase deja de ser cierta en cuanto se muestren precios. Se recomienda reemplazar su copy por un mensaje que sea coherente con la nueva política (p. ej. mantener el tono cercano pero orientado a que el precio final se ajusta/confirma en la visita, sin negar que hay un valor de referencia visible), conservando el botón de WhatsApp existente.
- **Criterio de aceptación:** cada card muestra alquiler (y venta si aplica) en COP; no queda copy en el catálogo que afirme que no se publican precios.

---

## 3. Admin (`src/views/Admin.tsx`)

### 3.0 Agregar campo de depósito al formulario de disfraz
- Igual que `rental_price`/`sale_price` (líneas ~52-65, ~269-270, ~514-524, ~1086-1100), agregar `deposit_price` como campo de texto numérico en el formulario de creación/edición, con su validación (`Number.isNaN`) y su envío en el payload hacia `AdminCostumePayload`.

### 3.1 Carga múltiple de imágenes
- **Hallazgo importante:** el input de carga ya tiene el atributo `multiple` (línea ~1157) y `handleUploadImages` (líneas ~600-621) ya itera sobre `FileList` subiendo cada archivo. Es decir, la carga múltiple **ya existe a nivel funcional**, pero de forma secuencial (`for` + `await` uno por uno) y sin feedback individual por archivo.
- **Mejora solicitada (accionable):**
  - Mostrar progreso por archivo (ej. "Subiendo 2 de 5..." o una barra/lista con estado por imagen: pendiente / subiendo / listo / error), no solo el mensaje genérico "Subiendo imagenes..." actual.
  - Si un archivo falla validación (formato o tamaño, ver `ALLOWED_MIME_TYPES`/`MAX_IMAGE_BYTES` en `src/services/adminService.ts` líneas ~254-260), continuar subiendo el resto de archivos válidos en vez de abortar todo el lote, y reportar al final cuáles fallaron y por qué.
  - Evaluar subir en paralelo con un límite de concurrencia (ej. 3 simultáneas) en vez de una por una, para acelerar la carga de disfraces con muchas fotos.
- **Criterio de aceptación:** al seleccionar varios archivos, el usuario ve el progreso de cada uno, un archivo inválido no bloquea la carga de los demás, y al finalizar se informa cuántas imágenes se cargaron correctamente y cuántas fallaron.

### 3.2 Mejorar experiencia de "Guardar alt"
- **Estado actual:** cada imagen de la galería tiene un `<input>` de texto alternativo y un botón "Guardar alt" independiente (líneas ~1201-1216); el usuario debe hacer clic manualmente en cada imagen, sin indicación visual de si el texto quedó guardado o si hay cambios sin guardar.
- **Recomendación concreta:**
  1. Autoguardar el `alt_text` en el evento `onBlur` del input (o con debounce de ~600ms mientras el usuario escribe), llamando a `updateCostumeImageAltText` sin requerir el clic en un botón separado.
  2. Mostrar un indicador de estado por imagen junto al input (ej. un punto/ícono con 3 estados: "sin cambios", "guardando...", "guardado" — reutilizando el patrón de toast/inline feedback ya usado en el resto del panel, nunca `alert()`, conforme a la spec `ui_ux adjustmen.spec.md` ya implementada).
  3. Conservar un botón "Guardar" visible como respaldo manual para el caso en que el autoguardado falle (mostrando el error inline), en vez de eliminarlo por completo.
- **Criterio de aceptación:** el usuario puede escribir el alt text de varias imágenes sin tener que hacer clic en un botón por cada una, y siempre puede ver si el texto quedó guardado o si falló.

---

## 4. NavBar (`src/components/Navbar.tsx`)

### 4.1 Botón diferenciado para acceder a Admin
- **Estado actual:** `navItems` (líneas 7-13) no incluye ninguna entrada hacia `/admin`; hoy no hay forma de llegar al panel desde la navegación pública.
- **Requisito:** agregar un botón visualmente diferenciado de los enlaces de navegación pública (`Inicio`, `Catálogo`, `Servicios`, `Nuestra Historia`, `Contacto`), que enlace a `/admin`. Debe:
  - Ubicarse en el extremo derecho de la barra de navegación desktop (junto al menú, no reemplazando ningún ítem existente) y de forma equivalente en el drawer móvil.
  - Usar un ícono discreto de `lucide-react` (ej. `Lock` o `ShieldCheck`) en vez de texto largo, para no competir visualmente con el botón flotante de WhatsApp (que sigue siendo el CTA principal del sitio, según `AGENTS.md` sección 2).
  - No debe usar los colores primarios de conversión (`#a8001a`/`#fdc003`) del mismo modo que el WhatsApp CTA, para evitar confundir a la clienta sobre cuál es el canal de contacto; se sugiere un estilo neutro/sutil (ej. borde gris, texto `#1e1b18/60`).
- **Criterio de aceptación:** existe un botón/ícono claramente distinto de los enlaces de navegación normales que lleva a `/admin`, visible en desktop y en el menú móvil, sin restar protagonismo al botón de WhatsApp.

---

## 5. Cambios de base de datos y documentación Supabase (resumen)

- Nueva migración `supabase/008_deposit_price.sql`: agrega `costumes.deposit_price` y actualiza la vista `costumes_full`.
- Actualizar `docs/SUPABASE_SETUP.md` (sección 4, orden de migraciones) para incluir la migración nueva.
- Revisar `supabase/002_seed.sql` para poblar `deposit_price` en los registros semilla existentes, de modo que el catálogo de ejemplo no quede con depósitos nulos/vacíos.
- No se identificaron cambios necesarios en `004_rls.sql` / `006_admin_rls.sql` (las políticas actuales no restringen por columna), pero deben revisarse igualmente al aplicar la migración.

---

## Notas de la redacción

Al convertir los apuntes crudos originales (`docs/specs/specs_backlog/ui_adjustment.spec.md`, ahora reemplazado por este archivo) en esta spec, se documentan las siguientes decisiones y hallazgos que no estaban explícitos en las notas originales:

- **Renombre del archivo:** el apunte original se llamaba `ui_adjustment.spec.md`, pero ese nombre ya existe en `docs/specs/specs_done/` (una spec distinta, ya implementada). Se renombró a `precios_publicos_y_mejoras_admin.spec.md` para evitar colisión y describir mejor el contenido real (precios/depósito + mejoras de Admin/NavBar).
- **Nombre de campo propuesto:** `depositPrice` (frontend, `src/types.ts`) / `deposit_price` (Supabase, `AdminCostume`/`AdminCostumePayload`/columna SQL), siguiendo la convención camelCase/snake_case ya usada para `rentalPrice`/`rental_price` y `salePrice`/`sale_price`. Este nombre ya estaba sugerido en `AGENTS.md` (sección "Publicación de Precios"), se mantiene por consistencia.
- **3.1 (carga múltiple de imágenes):** el apunte original pedía "permitir cargar más de una imagen a la vez" como si no existiera. Al revisar `src/views/Admin.tsx` se encontró que el input ya tiene `multiple` y `handleUploadImages` ya sube varios archivos en un `for` secuencial. Se reinterpretó el punto como una mejora de UX/feedback sobre una funcionalidad que ya existe a nivel básico (progreso por archivo, tolerancia a fallos individuales, posible paralelismo), no como una funcionalidad ausente. **Duda para el usuario:** si lo que se buscaba era otra cosa (p. ej. drag-and-drop, o un límite de imágenes por disfraz), aclarar antes de implementar.
- **3.2 (mejorar "Guardar alt"):** el apunte decía solo "Mejorar la experiencia para Guardar alt" sin especificar cómo. Se propuso una solución concreta (autoguardado con `onBlur`/debounce + indicador de estado + botón de respaldo) por ser la mejora más directa sobre el patrón actual (input + botón por imagen), pero es una propuesta del redactor, no una decisión de negocio confirmada.
- **Ubicación del depósito en catálogo vs. ficha:** el apunte 2.1 dice explícitamente "mas no del deposito" para el catálogo, y el apunte 1.1/1.2 dice que la ficha sí muestra los 3 valores. Esta spec preserva esa distinción tal cual (depósito solo en ficha, nunca en catálogo).
- **Copy contradictorio detectado en Catálogo:** el apunte original no mencionaba el badge "A tu Presupuesto" ni la tarjeta "Presupuesto Adaptable" (`src/views/Catalogo.tsx`), pero ambos afirman textualmente que no se publican precios fijos — algo que dejará de ser cierto tras este cambio. Se agregó el punto 2.1 (inconsistencia a corregir) porque de lo contrario la implementación quedaría con copy que contradice los precios recién visibles en la misma pantalla. Queda a criterio de negocio el copy final de reemplazo.
- **4.1 (botón de Admin):** el apunte no especificaba estilo ni ícono; se propuso un ícono neutro (`Lock`/`ShieldCheck`) y colores no-CTA para no competir con WhatsApp, en línea con `AGENTS.md` sección 2 (WhatsApp como único canal de conversión). Es una propuesta de diseño, no una decisión confirmada — validar con el sistema de diseño (`DESIGN.md`) antes de implementar el estilo final.
- Todos los números de línea citados (`CatalogoDetail.tsx`, `Catalogo.tsx`, `Admin.tsx`, `dataService.ts`, `003_views.sql`) corresponden al estado del código al momento de redactar esta spec (2026-07-18); si el código cambia antes de implementarla, ubicar el bloque equivalente por el texto/atributo citado en vez de por número de línea exacto.
