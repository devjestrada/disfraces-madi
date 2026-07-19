# Documento de Especificación de Requerimientos (DER)
## Dashboard de Insights — Fase 2 (Analítica avanzada), Panel de Administración, Disfraces Madi

**Versión:** 1.0
**Fecha:** 19 de julio de 2026
**Autor:** Equipo de Producto / Análisis de Sistemas
**Base de datos:** Supabase (PostgreSQL)
**Estado:** En espera (`specs_freeze`) — sin fecha definida para retomar.

---

## 1. Introducción

### 1.1 Propósito

Esta spec formaliza las "propuestas adicionales" de la Fase 1 del Dashboard de Insights (`docs/specs/specs_done/admin_insights_dashboard.spec.md`) que quedaron fuera de esa entrega para mantenerla en un tamaño manejable. Extiende la sección "Insights" del panel Admin (ya implementada) con indicadores y utilidades adicionales de análisis.

### 1.2 Alcance

Incluye:
- KPI de tasa de interés → contacto (vistas de ficha que derivan en clic de WhatsApp).
- KPI de valor gestionado en el periodo (suma de `total_value` del histórico), exclusivo del panel Admin.
- Card de disfraces destacados sin movimiento reciente.
- Card de estacionalidad histórica (conteo de alquileres por mes, a través de todos los años disponibles).
- Exportar a CSV la vista filtrada de la tabla histórica de alquileres.

No incluye: nada distinto a lo ya cubierto por la Fase 1 (navegación, selector de periodo, tracking, tabla histórica, importación de CSV, vinculación manual) — todo eso ya está implementado y no se repite aquí.

### 1.3 Prerrequisito

Esta spec asume la Fase 1 ya implementada y en producción: las tablas `costume_events`, `costume_rental_history` y `costume_label_aliases` (migraciones `009_costume_events.sql` y `010_rental_history.sql`), el selector de periodo (`getPeriodRange`/`getPreviousEquivalentRange` en `src/utils/dateRanges.ts`), y los servicios `src/services/insightsService.ts` / `src/services/trackingService.ts`.

---

## 2. Requerimientos funcionales

### RF-P2-01 Tasa de interés → contacto
*(Antes RF-03.4 de la spec de Fase 1)*

Porcentaje de vistas de ficha que derivaron en un clic al botón "Agendar por WhatsApp" de esa misma ficha, en el periodo activo. Sirve para detectar disfraces que generan curiosidad pero poco contacto. Requiere consumir también el conteo de eventos `whatsapp_click` de `costume_events` (la Fase 1 solo consume `view` para el ranking de "más visualizados"; el conteo de `whatsapp_click` por disfraz queda pendiente de esta fase).

### RF-P2-02 Valor gestionado en el periodo
*(Antes RF-03.5)*

Suma de `total_value` del histórico de alquileres (`costume_rental_history`) en el periodo activo. Debe mostrarse únicamente dentro del panel Admin, nunca en el sitio público, en cumplimiento de la regla de precios de `AGENTS.md` (esa regla aplica al sitio de cara al cliente, no al backoffice).

### RF-P2-03 Disfraces destacados sin movimiento
*(Antes RF-03.6)*

Lista breve de disfraces con `featured = true` y cero o muy pocas vistas/alquileres en el periodo activo, como señal accionable para el equipo de marketing/exhibición. Copy sugerido: *"Estos disfraces destacados no han tenido visitas recientes — puede ser buen momento para darles protagonismo."*

### RF-P2-04 Estacionalidad histórica
*(Antes RF-03.7)*

Mini gráfico de barras con el conteo de alquileres por mes a través de todos los años disponibles en el histórico (no solo el periodo activo — es un agregado global), para visualizar el pico de temporada de Carnaval de un vistazo. Sin librería de gráficos nueva (ver decisión de diseño de la Fase 1): barras con divs/CSS, mes de temporada alta en Oro Tradición (`#FDC003`) vs. el resto en un tono neutro.

### RF-P2-05 Exportar CSV de la tabla histórica
*(Antes RF-05.6)*

Exportar la vista filtrada actual de la tabla histórica (`src/components/admin/insights/RentalHistoryTable.tsx`) a un archivo CSV descargable, reutilizando los datos ya cargados en el cliente (sin nueva consulta a Supabase). Útil para contabilidad o respaldo.

---

## 3. Requerimientos no funcionales

Aplican los mismos de la Fase 1 (ver `docs/specs/specs_done/admin_insights_dashboard.spec.md`, sección 5), en particular:
- Ningún dato nuevo de estos KPIs debe exponerse en el sitio público.
- El cálculo de estos indicadores debe apoyarse en agregación en el cliente sobre los datos ya traídos (mismo patrón de `src/services/insightsService.ts`), consistente con el volumen actual.

---

## 4. Notas

- Esta spec es una continuación directa de `docs/specs/specs_done/admin_insights_dashboard.spec.md`; cualquier decisión de diseño/UX no repetida aquí (paleta, tipografía, patrones de interacción, prohibición de `alert`/`confirm` nativos) sigue vigente tal como se documentó en esa spec.
- Se archivó en `specs_freeze` porque el usuario priorizó cerrar primero la Fase 1; no hay fecha definida para retomarla. Para reactivarla, mover el archivo a `docs/specs/specs_backlog/` y seguir el flujo normal de specs de `AGENTS.md`.
