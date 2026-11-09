# Rediseño del panel administrativo (dashboard y formularios)

## Objetivo
Alinear el panel administrativo (`/admin`) con `DESIGN.md` y mejorar la experiencia de agregar, editar, ocultar y eliminar disfraces, **sin alterar la funcionalidad existente** ni el modelo de datos.

Propuesta visual de referencia: lienzo "Disfraces Madi — Propuesta dashboard y formularios" (v2, según DESIGN.md).

## Alcance

### 1. Componentes compartidos
- `Toast.tsx`: estilos según `DESIGN.md` (éxito en verde estándar, error en rojo de sistema — no Rojo Madi —, info con Tinta funcional), icono de estado y botón para cerrar. Misma API (`toast`, `onDismiss`), mismo auto-dismiss de 4 s.
- `ConfirmDialog.tsx`: estilos según `DESIGN.md`. Nuevas props **opcionales** y retrocompatibles:
  - `destructive` (botón en rojo de sistema),
  - `details` (lista de consecuencias),
  - `confirmText` (texto que se debe escribir para habilitar el botón),
  - `secondaryAction` (`{ label, onClick }`, acción alternativa recomendada).
  Los usos actuales (telas, accesorios, fotos) no cambian.

### 2. Panel (`Admin.tsx`)
- Reemplazar colores fuera de la guía (`#4A1F1F`, `#6E4B4B`, `#E6D0C9`, etc.) por los tokens de `DESIGN.md`: Rojo Madi `#A8001A`, Oro Tradición `#FDC003` (solo superficies/badges con texto en tinta), Lienzo Cálido `#FFF8F5`, Tinta `#1A1418`, Tinta secundaria `#5C5257`.
- Navegación lateral con las secciones: Resumen (nueva, sección por defecto), Disfraces, Insights, Telas y accesorios, Configuración del sitio. En móvil se apila arriba.
- Vista Tabla: interruptores "Disponible" y "Destacado" (reutiliza `handleToggleFromList`), precios y slugs en JetBrains Mono. Si no hay precio de alquiler se muestra "Solo venta" (nunca "consultar", ver `AGENTS.md`).
- Formulario de disfraz: misma lógica de guardado; presentación por bloques; tallas agrupadas en Adulto (XS–XXL) y Niño (4–16) como chips accesibles (`aria-pressed`).
- Eliminar disfraz: el diálogo ofrece "Ocultar del catálogo" (`is_available = false`, recomendado) o "Eliminar para siempre", que exige escribir el slug y muestra cuántas fotos y alquileres del histórico se ven afectados.

### 3. Nueva sección "Resumen" (`src/views/admin/ResumenSection.tsx`, carga diferida)
- Indicadores del periodo reutilizando `insightsService` (alquileres, visitas a fichas, clics a WhatsApp) con su fuente, y disfraces disponibles/ocultos.
- Pendientes: disfraces sin depósito, disfraces sin fotos, fotos sin texto alternativo y alquileres del histórico sin vincular, con acceso directo a la sección correspondiente.

### 4. Servicios
- Solo consultas de lectura nuevas en `adminService.ts` (conteos). Sin migraciones ni cambios en escrituras.

## Criterios de aceptación
- `npm run lint` y `npm run build` sin errores.
- Todas las acciones existentes siguen funcionando: login/logout, crear/editar/eliminar disfraz, toggles de disponible/destacado, fotos (subir, principal, orden, alt, eliminar), ficha técnica, telas y accesorios, Insights (incluye importar CSV y vincular), configuración del sitio.
- No se usan `alert`/`confirm`/`prompt` nativos.
- Checklist de `AGENTS.md` §3 cumplido.
