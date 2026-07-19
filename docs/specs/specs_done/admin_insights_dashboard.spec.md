# Documento de Especificación de Requerimientos (DER)
## Dashboard de Insights — Fase 1, Panel de Administración, Disfraces Madi

**Versión:** 1.0
**Fecha:** 18 de julio de 2026
**Autor:** Equipo de Producto / Análisis de Sistemas
**Base de datos:** Supabase (PostgreSQL)

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requerimientos funcionales y no funcionales de una nueva sección **"Insights"** dentro del panel de administración (`src/views/Admin.tsx`), que le permita a la Sra. Madi y su equipo entender, con datos reales, cuántos alquileres se han realizado en distintos periodos (incluyendo el histórico en papel ya digitalizado), qué disfraces se alquilan y se visualizan más, y qué tanto interés genera cada ficha de disfraz en el sitio público.

### 1.2 Alcance

Incluye:
- Una nueva pestaña de navegación "Insights" en el panel Admin, al mismo nivel que "Disfraces" y "Configuración del sitio".
- Un conjunto de *cards* (tarjetas) de resumen con indicadores clave (KPI) y rankings ("Top disfraces").
- Una tabla con el histórico completo de alquileres, importado desde `non_public_assets/alquileres_definitivo.csv`, con búsqueda, filtros y ordenamiento.
- Nueva infraestructura de **tracking interno** (tablas propias en Supabase, sin servicios de analítica de terceros) para registrar, en el sitio público:
  - Cada visualización de una ficha de disfraz (`/catalogo/:costumeId`).
  - Cada clic en el botón "Agendar por WhatsApp" de la ficha de un disfraz.
- Una propuesta de diseño/UX concreta para el layout del dashboard.

No incluye:
- Un sistema de reservas/citas en vivo (no existe hoy una tabla de `bookings` operativa; ver sección 8).
- Integración de Google Analytics, Plausible, Meta Pixel u otra herramienta de analítica externa. **Todo el tracking descrito aquí se guarda en tablas propias de Supabase**, controladas por el propio proyecto.
- Cambios al flujo del botón flotante de WhatsApp (`src/components/WhatsAppButton.tsx`) más allá de instrumentar el clic para tracking; el flujo conversacional sigue centrado exclusivamente en "🗓️ Agendar cita para probarme un disfraz" (regla de negocio, sección 2 de `AGENTS.md`).
- **Alcance limitado a esta Fase 1.** Las "propuestas adicionales" originales (tasa de interés → contacto, valor gestionado en el periodo, disfraces destacados sin movimiento, estacionalidad histórica, exportar CSV) se trasladaron a una spec aparte, en espera: `docs/specs/specs_freeze/admin_insights_dashboard_fase2.spec.md`.

### 1.3 Definiciones y referencias

| Término | Descripción |
|---|---|
| KPI | Indicador clave de desempeño (Key Performance Indicator) |
| Evento de tracking | Registro puntual guardado por el propio backend/frontend del sitio (no un servicio externo) ante una acción del visitante (ver ficha, hacer clic en WhatsApp) |
| Histórico de alquileres | Datos de alquileres reales ya realizados, transcritos a `non_public_assets/alquileres_definitivo.csv` a partir de facturas físicas |
| Vinculación (matching) | Proceso de asociar un registro histórico del CSV (texto libre) con un `costume_id` real del catálogo actual |
| RLS | Row Level Security de PostgreSQL/Supabase |

### 1.4 Fuentes

Este documento se basa en la revisión de: `src/views/Admin.tsx`, `src/services/adminService.ts`, `src/services/dataService.ts`, `src/types.ts`, las migraciones `supabase/001_init.sql` a `007_storage_admin.sql`, `supabase/README.md`, `src/views/CatalogoDetail.tsx`, `src/components/WhatsAppButton.tsx`, `src/App.tsx`, y una inspección de cabeceras y contenido de `non_public_assets/alquileres_definitivo.csv` (116 líneas, incluyendo encabezado).

---

## 2. Descripción general

### 2.1 Contexto del sistema

El panel Admin (`src/views/Admin.tsx`) hoy tiene dos secciones controladas por el estado `activeSection: 'disfraces' | 'configuracion'` (línea 114), con botones de navegación en un arreglo `{ id: 'disfraces', label: 'Disfraces' }, { id: 'configuracion', label: 'Configuracion del sitio' }` (líneas 784-785). Este documento propone extender esa unión de tipos a `'disfraces' | 'insights' | 'configuracion'` y añadir un tercer botón "Insights" en ese mismo arreglo, reutilizando el patrón de layout, `Toast`/`ConfirmDialog` y estilo visual ya usado en la sección "Disfraces" (tabla con `sticky` header, colores `#FFF8F5`/`#EFE1DB`/`#6E4B4B`/`#A8001A`, badges de estado como en líneas 864-885 y 894-930 de `Admin.tsx`).

Actualmente:
- **No existe** ninguna tabla `bookings`/`citas` operativa en Supabase (aunque `src/types.ts` define un tipo `Booking` sin uso real en el código, y `AGENTS.md` menciona un `src/views/BookingsManager.tsx` que tampoco existe todavía en el repositorio). El único registro histórico real de alquileres disponible hoy es el archivo `non_public_assets/alquileres_definitivo.csv`.
- **No existe** ningún mecanismo de tracking de visitas ni de clics en el sitio público; todo el consumo de datos hoy es de solo lectura sobre `costumes_full` vía `src/services/dataService.ts`.

### 2.2 Usuarios del sistema

| Rol | Descripción |
|---|---|
| **Administrador** | Único rol que puede ver el dashboard de Insights (mismo `is_admin()` / tabla `admin_users` usada en el resto del panel, migraciones `005`-`006`). |
| **Visitante público** | No ve el dashboard; su navegación en `/catalogo/:costumeId` y sus clics en WhatsApp son la fuente de los eventos de tracking, de forma anónima. |

### 2.3 Estructura real del CSV histórico (`non_public_assets/alquileres_definitivo.csv`)

Columnas confirmadas (116 filas, incluida cabecera): `archivo, numero_factura, cliente, direccion, telefono_nit, fecha, Disfraz, categoria, Accesorios, valor_total, deposito, notas`.

Observaciones relevantes para el diseño de la tabla histórica:
- `Disfraz` y `categoria` son **texto libre transcrito a mano** (ej. `africano`, `mapale`, `cumbia azul`, `fantasia africana`, `salmon con abrigo`), sin relación garantizada con los `slug`/`name` actuales de la tabla `costumes` ni con el enum de categorías del catálogo (`Cumbia`, `Garabato`, `Mapalé`, `Marimonda`, `Negrita Puloy`, `Congo`, `Monocuco`, `Muerte`, `Fantasía`).
- `cliente`, `direccion`, `telefono_nit` son datos personales reales de clientes — deben tratarse como información sensible, de acceso exclusivo admin.
- `valor_total` y `deposito` son montos numéricos reales (formato libre, algunos con notas manuscritas). Al ser un panel **interno**, mostrar estos montos en Insights **no** viola la regla de "prohibición de precios públicos" de `AGENTS.md` (esa regla aplica al sitio público, no al backoffice).
- `notas` contiene observaciones de transcripción (ambigüedades de lectura de las facturas originales) — se recomienda mostrarlas solo en el detalle de fila, no en la vista general de la tabla.

---

## 3. Requerimientos funcionales

### RF-01 Navegación y acceso

- RF-01.1: Agregar una tercera pestaña **"Insights"** en la navegación del panel Admin, junto a "Disfraces" y "Configuración del sitio", visible únicamente para usuarios con `adminState === 'granted'`.
- RF-01.2: La sección Insights debe cargar sus datos de forma perezosa (solo al activarse la pestaña, no en el `loadPanelData()` inicial del panel), para no impactar el tiempo de carga de las secciones existentes.

### RF-02 Selector de periodo (transversal a toda la sección)

- RF-02.1: Un selector de periodo único, ubicado en la parte superior de la sección Insights, debe controlar todas las cards de resumen y aplicar como filtro por defecto a la tabla histórica. Opciones mínimas: **Hoy**, **Últimos 7 días**, **Este mes**, **Este año**, **Histórico completo**, **Rango personalizado** (selector de fecha inicio/fin).
- RF-02.2: El periodo activo debe quedar visualmente indicado (chip/segmented control) y persistir mientras el admin navega entre cards dentro de la misma sesión de la pestaña.
- RF-02.3: Cuando el periodo seleccionado no tenga datos (ej. "Hoy" sin alquileres ni vistas), cada card debe mostrar un estado vacío con mensaje breve y cordial, no un espacio en blanco ni un error.

### RF-03 Cards de resumen (KPIs)

- RF-03.1: **Total de alquileres en el periodo** — cuenta de filas del histórico (RF-05) cuya `fecha` cae dentro del periodo activo, con variación porcentual respecto al periodo anterior equivalente (ej. "este mes" vs. "mes anterior").
- RF-03.2: **Top disfraces más alquilados** — ranking (top 5 visible en la card) por conteo de alquileres históricos vinculados (ver RF-06), con opción **"Ver detalle completo"** que abre un listado ampliado (todas las posiciones, no solo el top 5).
- RF-03.3: **Top disfraces más visualizados** — ranking (top 5 visible) por conteo de eventos `view` de la tabla de tracking (RF-07), en el periodo activo, con la misma opción **"Ver detalle completo"**.
- RF-03.4 a RF-03.7 *(tasa de interés → contacto, valor gestionado, destacados sin movimiento, estacionalidad histórica)*: **movidos a Fase 2** — ver `docs/specs/specs_freeze/admin_insights_dashboard_fase2.spec.md`.
- RF-03.8: Cada card debe indicar de forma discreta su fuente de datos ("Histórico de alquileres" o "Visitas al sitio") para que el equipo entienda que son dos fuentes distintas que pueden no coincidir en cobertura temporal.

### RF-04 "Ver detalle completo" de los Top

- RF-04.1: Al hacer clic en "Ver detalle completo" de cualquier card de tipo ranking (RF-03.2, RF-03.3), se debe abrir un panel/drawer o modal con la lista completa ordenada por conteo descendente, incluyendo columna de variación respecto al periodo anterior.
- RF-04.2: Cada fila del detalle debe permitir navegar directamente a la ficha de edición del disfraz correspondiente en la sección "Disfraces" del panel (cuando exista vínculo a un `costume_id` real).

### RF-05 Tabla histórica de alquileres

- RF-05.1: Origen de datos: importación de `non_public_assets/alquileres_definitivo.csv` a una nueva tabla Supabase `costume_rental_history`, con las columnas: `id (uuid)`, `source_file (text)` ← `archivo`, `invoice_number (text)` ← `numero_factura`, `customer_name (text)` ← `cliente`, `customer_address (text)` ← `direccion`, `customer_phone (text)` ← `telefono_nit`, `rental_date (date)` ← `fecha`, `costume_label (text)` ← `Disfraz`, `category_label (text)` ← `categoria`, `accessories_text (text)` ← `Accesorios`, `total_value (numeric)` ← `valor_total`, `deposit_value (numeric)` ← `deposito`, `notes (text)` ← `notas`, más `matched_costume_id (uuid, nullable, FK a costumes)` y `created_at (timestamptz)`.
- RF-05.2: La importación es un proceso **administrado**, no en vivo: se ejecuta una vez como migración/script de carga inicial (ver sección 7). Se recomienda además una pantalla simple en Insights para **re-importar/anexar** nuevas filas vía carga de CSV, en caso de que se sigan digitalizando facturas antiguas o se registren alquileres manualmente mientras no exista un sistema de reservas en vivo.
- RF-05.3: La tabla en pantalla debe soportar:
  - **Búsqueda rápida** de texto libre (por `cliente`, `costume_label`, `numero_factura`).
  - **Filtros**: rango de fechas, `category_label`, disfraz vinculado (`matched_costume_id`) vs. "sin vincular".
  - **Ordenamiento** por cualquier columna visible (fecha, disfraz, valor total, cliente).
  - **Paginación** (la carga completa en el cliente es aceptable dado el volumen actual de ~115 registros, pero el diseño de la consulta debe soportar paginación server-side a futuro sin rediseño, ver RNF-01).
- RF-05.4: Las columnas `customer_address` y `customer_phone` no deben mostrarse en la vista de tabla por defecto (solo en el detalle de fila expandido), para minimizar exposición innecesaria de datos personales incluso dentro del panel admin.
- RF-05.5: `notes` (transcripción de ambigüedades) se muestra solo en el detalle expandido de la fila, no en la tabla general.
- RF-05.6 *(exportar la vista filtrada a CSV)*: **movido a Fase 2** — ver `docs/specs/specs_freeze/admin_insights_dashboard_fase2.spec.md`.

### RF-06 Vinculación de histórico con el catálogo actual

- RF-06.1: Dado que `Disfraz`/`categoria` en el CSV son texto libre no normalizado, el sistema debe ofrecer una utilidad de **vinculación manual**: por cada valor distinto de `costume_label` sin `matched_costume_id`, sugerir posibles coincidencias del catálogo actual (comparación de texto aproximada) para que el admin confirme el vínculo con un clic.
- RF-06.2: Una vez vinculada una etiqueta histórica a un `costume_id`, todas las filas futuras importadas con esa misma etiqueta deben vincularse automáticamente (tabla auxiliar de mapeo `costume_label_aliases` o campo reutilizable), evitando repetir el trabajo de matching en cada importación.
- RF-06.3: Los registros sin vincular deben seguir contando para el KPI "Total de alquileres en el periodo" (RF-03.1) y agruparse bajo una entrada "Histórico sin vincular" en los rankings de Top disfraces (RF-03.2), en vez de excluirse silenciosamente.

### RF-07 Nueva infraestructura de tracking interno (vistas y clics de WhatsApp)

- RF-07.1: Crear una única tabla de eventos, **`costume_events`**, con columnas: `id (uuid)`, `costume_id (uuid, FK a costumes, obligatorio)`, `event_type (enum: 'view' | 'whatsapp_click')`, `session_id (text)`, `occurred_at (timestamptz, default now())`. No se almacena IP, user-agent completo ni ningún dato personal identificable del visitante.
- RF-07.2: `session_id` es un identificador anónimo generado en el cliente (ej. UUID persistido en `localStorage` del navegador del visitante), usado únicamente para evitar sobre-conteo (ver RF-07.5), nunca para identificar a una persona.
- RF-07.3: Evento `view`: se dispara desde `src/views/CatalogoDetail.tsx`, en el `useEffect` que ya reacciona al `costume` cargado (líneas 22-27), insertando un registro con `event_type = 'view'` y el `costume.id` correspondiente.
- RF-07.4: Evento `whatsapp_click`: se dispara desde el botón "Agendar por WhatsApp" de la ficha de detalle (`src/views/CatalogoDetail.tsx`, botón dentro de `#detail-action-buttons`, líneas 288-298), en el mismo `onClick` que ya abre la URL de `wa.me`, insertando un registro con `event_type = 'whatsapp_click'`. **No** debe instrumentarse el botón flotante genérico (`src/components/WhatsAppButton.tsx`) porque ese componente no siempre tiene un `costume_id` de contexto (solo un nombre de texto libre vía `selectedCostumeName`); queda fuera de alcance salvo que se le añada esa prop en una iteración futura (ver Notas de la redacción).
- RF-07.5: Para evitar sobreconteo por recargas de página o navegación repetida en la misma visita, el cliente debe evitar reenviar un evento `view` para el mismo `costume_id` + `session_id` dentro de una ventana corta (ej. 30 minutos), antes de insertar.
- RF-07.6: El insert de eventos debe hacerse con el rol `anon` (política RLS de solo `INSERT`, columnas limitadas), y la lectura/agregación debe estar restringida exclusivamente al rol admin (`is_admin()`), siguiendo el mismo patrón de `005_admin_auth.sql`/`006_admin_rls.sql`.
- RF-07.7: Las cards de "Top disfraces más visualizados" (RF-03.3) y "Tasa de interés → contacto" (RF-03.4) consumen agregaciones (`count(*) group by costume_id, event_type`) sobre esta tabla, filtradas por el periodo activo (RF-02).

---

## 4. Propuesta de diseño / UX

### 4.1 Principio general

El dashboard debe sentirse parte del mismo taller cálido y artesanal que el resto del sitio (ver `DESIGN.md`), no un panel corporativo genérico de BI. Se reutiliza la paleta ya definida — Rojo Madi (`#A8001A`) como acento primario y de jerarquía alta, Oro Tradición (`#FDC003`) para destacados/badges, Lienzo Cálido (`#FFF8F5`) como fondo — y los mismos tonos neutros ya usados en las tablas existentes del panel (`#EFE1DB`, `#6E4B4B`, `#4A1F1F`), para que Insights no se sienta como una pantalla "pegada" al resto del Admin.

### 4.2 Layout propuesto (de arriba hacia abajo)

1. **Barra de filtros superior** (sticky): segmented control de periodo (RF-02.1) a la izquierda, selector de rango personalizado a la derecha (se revela solo si se elige "Rango personalizado"). Mismo estilo de chip/pill que ya usan los badges "Disponible"/"Destacado" en la tabla de disfraces.
2. **Fila de KPIs** (grid responsive: 4 columnas en escritorio, 2 en tablet, 1 en móvil): tarjetas compactas con número grande en `JetBrains Mono` (coherente con la regla de `DESIGN.md` de que datos duros se comunican en fuente monoespaciada), etiqueta corta debajo, e indicador de variación (flecha + porcentaje, verde si sube, rojo tenue si baja — nunca el Rojo Madi de marca para esta semántica de error, según regla de iconografía de `DESIGN.md` 4.3).
3. **Dos cards de "Top" lado a lado** (columna única en móvil): "Top disfraces más alquilados" y "Top disfraces más visualizados", cada una con lista de 5 filas (miniatura del disfraz + nombre + barra horizontal proporcional al conteo + número), y un enlace de texto "Ver detalle completo →" al pie que abre un drawer lateral con la tabla completa.
4. *(Card de estacionalidad — movida a Fase 2, ver `docs/specs/specs_freeze/admin_insights_dashboard_fase2.spec.md`.)*
5. *(Card "Disfraces destacados sin movimiento" — movida a Fase 2.)*
6. **Tabla histórica de alquileres** al final, ancho completo, con la misma estructura visual que la tabla ya existente en la vista "Disfraces" (`sticky` header, filas alternadas, badges de estado para "vinculado"/"sin vincular"), barra de herramientas propia arriba (buscador + filtros; el botón de exportar CSV queda en Fase 2).

### 4.3 Interacción y feedback

- Todo estado de carga usa el mismo spinner/patrón ya usado en el resto del Admin (ej. skeletons o spinner circular con borde `#a8001a/20` y punta `#a8001a`, visto en `CatalogoDetail.tsx`).
- Ningún `alert()`/`confirm()`/`prompt()` nativo: los mensajes de éxito/error de la importación de CSV (RF-05.2) y de las acciones de vinculación (RF-06.1) usan `Toast` y `ConfirmDialog`, igual que el resto del panel (`DESIGN.md` 5.1).
- El drawer/modal de "Ver detalle completo" (RF-04) se anima con la misma librería y timing ya usada en el sitio (`motion/react`, transiciones 150-300ms).

### 4.4 Copys sugeridos (tono cálido, sin exponer datos sensibles fuera del panel)

- Estado vacío de periodo sin datos: *"Aún no hay movimiento registrado en este periodo. Prueba con otro rango de fechas."*
- Card de disfraces sin movimiento: *"Estos disfraces destacados no han tenido visitas recientes — puede ser buen momento para darles protagonismo."*

---

## 5. Requerimientos no funcionales

| Código | Requerimiento |
|---|---|
| RNF-01 | La tabla histórica debe responder en menos de 2 segundos con el volumen actual (~115 registros); la consulta debe diseñarse de forma que escalar a miles de filas (digitalización progresiva de más facturas) solo requiera activar paginación server-side, sin rediseñar el esquema. |
| RNF-02 | El insert de eventos de tracking (`costume_events`) debe ser asíncrono y no bloqueante: un fallo de red al registrar una vista o un clic nunca debe impedir ni retrasar la navegación del visitante ni la apertura del enlace de WhatsApp. |
| RNF-03 | Ningún dato de `costume_events` debe permitir identificar a una persona real (sin nombre, sin teléfono, sin IP, sin user-agent completo); el único identificador es un `session_id` anónimo de propósito exclusivo anti-sobreconteo. |
| RNF-04 | `costume_rental_history` contiene datos personales reales (`customer_name`, `customer_address`, `customer_phone`) y debe quedar protegida por RLS de forma que **ningún** rol `anon` pueda leerla ni escribirla; solo el rol admin (`is_admin()`) tiene `SELECT`/`INSERT`/`UPDATE`. |
| RNF-05 | El dashboard debe ser responsive (uso desde tablet/escritorio en el taller, igual que el resto del panel Admin). |
| RNF-06 | La sección Insights debe cargarse de forma perezosa (no debe aumentar el peso del bundle inicial del panel Admin ni del sitio público; puede reutilizar el patrón `React.lazy` ya aplicado a `/admin` en `src/App.tsx`). |
| RNF-07 | Toda escritura a `costume_events` desde el cliente público debe pasar por una política RLS de `INSERT` explícita y acotada (columnas permitidas limitadas), nunca exponiendo credenciales de `service_role` en el frontend. |

---

## 6. Casos de uso principales

1. **CU-01: Revisar el desempeño del mes actual** — La Sra. Madi entra a Insights, deja el periodo por defecto en "Este mes" y ve de un vistazo el total de alquileres, el top de disfraces alquilados y visualizados, y la variación contra el mes anterior.
2. **CU-02: Detectar un disfraz con potencial desaprovechado** — Ve en la card de "Disfraces destacados sin movimiento" que un traje recién featured no ha tenido vistas en dos semanas, y decide promoverlo en redes.
3. **CU-03: Consultar un alquiler antiguo** — Busca por nombre de cliente en la tabla histórica para confirmar cuándo alquiló un disfraz por última vez, antes de que llegue a su próxima visita.
4. **CU-04: Vincular registros históricos** — Al revisar la tabla, nota varias filas "sin vincular" con la etiqueta `cumbia azul`; usa la utilidad de vinculación manual para asociarlas al disfraz actual correspondiente del catálogo.
5. **CU-05: Ver el detalle completo de un ranking** — Desde la card "Top disfraces más visualizados", hace clic en "Ver detalle completo" para revisar el ranking completo (no solo el top 5) y navega directo a editar uno de esos disfraces.
6. **CU-06: Entender la estacionalidad** — Antes de la temporada de Carnaval, revisa la card de estacionalidad histórica para anticipar cuántos disfraces preparar con base en años anteriores.

---

## 7. Restricciones técnicas identificadas

- No existe hoy ninguna tabla de reservas/citas en vivo en Supabase; el tipo `Booking` de `src/types.ts` no tiene tabla ni servicio asociado, y `src/views/BookingsManager.tsx` (mencionado como archivo de referencia en `AGENTS.md`) todavía no existe en el repositorio. En consecuencia, el "histórico de alquileres" de este dashboard depende **enteramente** de la importación del CSV (RF-05), no de un sistema transaccional en vivo.
- Las etiquetas `Disfraz`/`categoria` del CSV son texto libre y no coinciden de forma exacta ni consistente con los `slug`/`name`/`category` actuales del catálogo (`costumes`), lo que obliga a un proceso de vinculación manual asistido (RF-06) en vez de un `JOIN` directo.
- El CSV contiene datos personales reales de clientes; su importación y almacenamiento debe respetar RNF-04 desde la primera migración, no como ajuste posterior.
- La importación inicial del CSV es un proceso de una sola vez (o de baja frecuencia); no se especifica en este documento un pipeline automatizado de sincronización continua, ya que no existe una fuente "viva" equivalente hoy.

---

## 8. Entregables del proyecto

| # | Entregable | Descripción |
|---|---|---|
| E-01 | Migraciones SQL nuevas | Tabla `costume_rental_history`, tabla `costume_events`, tabla auxiliar `costume_label_aliases`, políticas RLS asociadas (ver RF-06.2, RF-07.6, RNF-04, RNF-07). |
| E-02 | Script/migración de importación del CSV | Carga inicial de `non_public_assets/alquileres_definitivo.csv` a `costume_rental_history`. |
| E-03 | Sección "Insights" en el panel Admin | Frontend completo: filtros de periodo, cards de KPI y Top, drawer de detalle completo, tabla histórica con búsqueda/filtro/orden, utilidad de vinculación manual. |
| E-04 | Instrumentación de tracking en el sitio público | Inserts de eventos `view` y `whatsapp_click` desde `src/views/CatalogoDetail.tsx`. |
| E-05 | Actualización de `supabase/README.md` | Documentar las migraciones nuevas en la lista de "Migraciones actuales" y su orden de ejecución. |

---

## 9. Alcance fuera de este documento

- Definición exacta del algoritmo de comparación de texto para las sugerencias de vinculación (RF-06.1) — a decidir en diseño técnico (ej. similitud de trigramas de PostgreSQL `pg_trgm`, o comparación simple normalizada en el cliente).
- Diseño visual detallado (wireframes/mockups pixel-perfect) de las nuevas cards — este documento define layout y principios, no maquetas finales.
- Automatización de un pipeline de sincronización si en el futuro se digitaliza el histórico de forma continua en vez de por lotes.
- Cualquier integración con herramientas de analítica de terceros (explícitamente fuera de alcance; ver sección 1.2).

---

## 10. Notas de la redacción

Esta spec parte de apuntes crudos del usuario que dejaban varias decisiones abiertas. Se documentan aquí las suposiciones y decisiones de diseño tomadas para poder redactar requerimientos concretos:

1. **Unificación en una sola tabla de eventos.** Los apuntes originales piden "guardar en una tabla la visualización... y la utilización del botón de WhatsApp". Se interpretó literalmente como **una única tabla** `costume_events` con un campo `event_type` discriminador, en vez de dos tablas separadas. Es una decisión de diseño razonable y reversible; si se prefiere separarlas, el impacto en RF-07 es menor.
2. **No existe tabla de bookings en vivo.** `AGENTS.md` referencia `src/views/BookingsManager.tsx` como archivo clave, pero no existe en el código actual, y tampoco hay tabla de reservas en las migraciones SQL. Se asumió que el "histórico de alquileres" pedido debe salir exclusivamente del CSV (RF-05), no de un sistema de reservas que aún no existe. Si en el futuro se implementa un `BookingsManager`, esta spec debería revisarse para unificar ambas fuentes.
3. **El botón flotante de WhatsApp (`WhatsAppButton.tsx`) queda fuera del tracking por disfraz.** Ese componente es global y solo recibe un `selectedCostumeName` de texto, sin `costume_id`; instrumentarlo requeriría pasarle un id real, lo cual no estaba en el pedido original y podría chocar con la regla de negocio de mantener ese flujo simple y centrado en "Agendar cita" (sección 2 de `AGENTS.md`). Se instrumentó en su lugar el botón de WhatsApp propio de la ficha de detalle (`CatalogoDetail.tsx`), que sí tiene el `costume_id` disponible y ya redacta un mensaje específico del disfraz.
4. **Vinculación CSV ↔ catálogo no es automática.** El texto libre de `Disfraz`/`categoria` en el CSV no permite un `JOIN` confiable con `costumes`. Se propuso una utilidad de vinculación manual asistida (RF-06) como la solución más honesta dado el estado real de los datos, en vez de asumir un matching automático perfecto.
5. **Cards adicionales propuestas** (RF-03.4 a RF-03.7, exportar CSV en RF-05.6, reimportación incremental en RF-05.2) fueron agregadas aprovechando la invitación explícita del usuario a proponer contenido adicional de UX. Ninguna de ellas expone precios ni datos sensibles en el sitio público — todo queda dentro del panel Admin.
6. **Montos (`valor_total`, `deposito`) sí se muestran en el panel Admin.** La regla de "prohibición de precios públicos" de `AGENTS.md` aplica al sitio de cara al cliente; este dashboard es exclusivamente interno (requiere sesión admin), por lo que mostrar montos históricos aquí no viola esa regla. Se dejó explícito en RF-03.5 para evitar cualquier ambigüedad futura.
7. **Renombrado del archivo.** El nombre original `insights.spec.md` era ambiguo (podría confundirse con analítica de producto en general). Se renombró a `admin_insights_dashboard.spec.md` para reflejar con precisión que es un dashboard dentro del panel Admin, siguiendo la convención de nombres descriptivos ya usada en otras specs de la carpeta (`backend_supabase.spec.md`, `routing.spec.md`, `ui_adjustment.spec.md`).

## 11. Estado de implementación

Por el tamaño de la spec original, el usuario pidió dividir la implementación en 2 fases. Esta spec quedó **acotada definitivamente a la Fase 1** (ver título y sección 1.2): implementada en su totalidad y confirmada por el usuario (rama `feature/admin-insights-dashboard-fase1`, PR de código y PR de cierre v0.6.0) — RF-01, RF-02, RF-03.1–03.3 y 03.8, RF-04, RF-05 (salvo RF-05.6, movido junto con RF-03.4–03.7 a la Fase 2), RF-06, RF-07 completo, y los principios de diseño/UX de la sección 4 aplicados a lo anterior.

Las "propuestas adicionales" originales (RF-03.4–03.7, RF-05.6) se trasladaron a `docs/specs/specs_freeze/admin_insights_dashboard_fase2.spec.md`, en espera sin fecha definida para retomarse como una spec independiente.

Esta spec permanece en `specs_backlog` (no se mueve a `specs_done`) hasta que la Fase 2 quede implementada y confirmada, conforme a la regla de no mover specs parcialmente implementadas.
